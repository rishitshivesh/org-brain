import {
  WorkflowEntrypoint,
  type WorkflowEvent,
  type WorkflowStep,
} from "cloudflare:workers";

import { runOrchestrator, type ApprovalRecord } from "../agents";
import { orgBrainProviders } from "../providers";
import type {
  InvestigationApprovalInput,
  InvestigationState,
} from "../types/investigation";
import { groundAnswerWithWorkersAi } from "./ai";
import { createD1OrgProviders, ensureD1OrganizationData } from "./d1-providers";
import type { Env } from "./env";
import { indexInvestigationMemory, searchInvestigationMemory } from "./memory";
import { persistInvestigation } from "./persistence";
import { patchInvestigation, readInvestigation } from "./state-client";

export interface InvestigationWorkflowPayload {
  investigationId: string;
  query: string;
}

function errorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "Investigation workflow failed";
}

export class InvestigationWorkflow extends WorkflowEntrypoint<
  Env,
  InvestigationWorkflowPayload
> {
  async run(
    event: WorkflowEvent<InvestigationWorkflowPayload>,
    step: WorkflowStep,
  ): Promise<void> {
    const { investigationId, query } = event.payload;

    await step.do("mark investigation running", () =>
      patchInvestigation(this.env, investigationId, { status: "running" }),
    );

    try {
      const d1Ready = await step.do("prepare organization data", () =>
        ensureD1OrganizationData(this.env),
      );
      const providers = d1Ready
        ? createD1OrgProviders(this.env)
        : orgBrainProviders;

      const deterministicResult = await step.do(
        "resolve deterministic engineering context",
        () => runOrchestrator(providers, query),
      );

      const historicalMemory = await step.do(
        "search historical investigation memory",
        () => searchInvestigationMemory(this.env, query, 4),
      );

      const grounded = await step.do("synthesize with Workers AI", () =>
        groundAnswerWithWorkersAi(
          this.env,
          query,
          deterministicResult,
          historicalMemory,
        ),
      );

      const result = {
        ...deterministicResult,
        tools: [
          ...(deterministicResult.tools ?? []),
          {
            id: `memory-${investigationId}`,
            name: "search_incident_memory",
            input: { query },
            output: {
              matches: historicalMemory.map((match) => ({
                incidentId: match.incidentId,
                score: match.score,
                source: match.source,
              })),
            },
          },
        ],
        answer: grounded.answer,
      };

      const investigation = await step.do("persist investigation result", () =>
        patchInvestigation(this.env, investigationId, {
          result,
          ai: grounded.metadata,
          status: result.rca ? "waiting-approval" : "completed",
        }),
      );

      await step.do("archive investigation history", () =>
        persistInvestigation(this.env, investigation),
      );

      if (result.rca) {
        await step.do("index investigation memory", () =>
          indexInvestigationMemory(this.env, investigation),
        );
      }

      if (!result.rca) return;

      const approvalEvent = await step.waitForEvent<InvestigationApprovalInput>(
        "wait for rca approval",
        {
          type: "rca-approval",
          timeout: "7 days",
        },
      );

      const actions = approvalEvent.payload.actions.filter(
        (action) => action === "mitigation" || action === "remediation",
      );
      const approval: ApprovalRecord = {
        id: crypto.randomUUID(),
        incidentId: result.rca.incidentId,
        actions: [...new Set(actions)],
        status: actions.length ? "approved" : "kept-as-draft",
        recordedAt: new Date().toISOString(),
      };

      const finalPatch: Partial<InvestigationState> = {
        approval,
        handoff: {
          mitigationEligible: approval.actions.includes("mitigation"),
          remediationPrepared: approval.actions.includes("remediation"),
          execution: "not-executed",
        },
        status: "completed",
      };

      const completed = await step.do("record durable approval", () =>
        patchInvestigation(this.env, investigationId, finalPatch),
      );

      await step.do("archive approved investigation", () =>
        persistInvestigation(this.env, completed),
      );

      if (approval.actions.includes("remediation")) {
        await step.do("prepare remediation provider handoff", async () => {
          const latest = await readInvestigation(this.env, investigationId);
          const draft =
            latest?.result?.rca?.remediationDraft ??
            result.rca!.remediationDraft;
          return providers.workItems.createDraft(draft);
        });
      }
    } catch (error) {
      const failed = await step.do("record investigation failure", () =>
        patchInvestigation(this.env, investigationId, {
          status: "failed",
          error: errorMessage(error),
        }),
      );
      await step.do("archive failed investigation", () =>
        persistInvestigation(this.env, failed),
      );
      throw error;
    }
  }
}
