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
import type { Env } from "./env";
import { patchInvestigation } from "./state-client";

export interface InvestigationWorkflowPayload {
  investigationId: string;
  query: string;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Investigation workflow failed";
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
      const deterministicResult = await step.do(
        "resolve deterministic engineering context",
        () => runOrchestrator(orgBrainProviders, query),
      );

      const grounded = await step.do("synthesize with Workers AI", () =>
        groundAnswerWithWorkersAi(this.env, query, deterministicResult),
      );

      const result = {
        ...deterministicResult,
        answer: grounded.answer,
      };

      await step.do("persist investigation result", () =>
        patchInvestigation(this.env, investigationId, {
          result,
          ai: grounded.metadata,
          status: result.rca ? "waiting-approval" : "completed",
        }),
      );

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

      await step.do("record durable approval", () =>
        patchInvestigation(this.env, investigationId, finalPatch),
      );

      if (approval.actions.includes("remediation")) {
        await step.do("prepare remediation provider handoff", () =>
          orgBrainProviders.workItems.createDraft(result.rca!.remediationDraft),
        );
      }
    } catch (error) {
      await step.do("record investigation failure", () =>
        patchInvestigation(this.env, investigationId, {
          status: "failed",
          error: errorMessage(error),
        }),
      );
      throw error;
    }
  }
}
