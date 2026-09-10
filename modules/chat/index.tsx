"use client";

import type { ChatStatus, UIMessage } from "ai";
import { Boxes, Cloud, GitBranch, Network, Sparkles } from "lucide-react";
import { useState } from "react";

import {
  runOrchestrator,
  type ApprovalAction,
  type ApprovalRecord,
  type OrchestrationResult,
} from "@/agents";
import { AgentChat } from "@/components/agent-elements/agent-chat";
import type { QuestionAnswer } from "@/components/agent-elements/question/question-prompt";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  approveRemoteInvestigation,
  isCloudflareRuntimeConfigured,
  runRemoteInvestigation,
} from "@/lib/cloudflare-runtime";
import { orgBrainData } from "@/lib/org-brain";
import { PageHeader } from "@/modules/common/page-header";
import { orgToolRenderers } from "@/modules/chat/org-tool-renderers";
import { orgBrainProviders } from "@/providers";
import type { InvestigationState } from "@/types/investigation";

const initialMessages: UIMessage[] = [
  {
    id: "preview-1",
    role: "assistant",
    parts: [
      {
        type: "text",
        text: "Org Brain coordinates work, runtime, code-change, dependency and architecture specialists. Structured context is resolved before model synthesis, and RCA actions remain gated behind explicit human approval.",
      },
    ],
  },
];

const promptSuggestions = [
  {
    id: "impact",
    label: "Check work impact",
    value: "What changes if we support partial settlement for OPD claims?",
  },
  {
    id: "incident",
    label: "Investigate claims latency",
    value:
      "Why did claims submission latency increase after the latest deployment?",
  },
  {
    id: "dependency",
    label: "Map claims-worker blast radius",
    value:
      "What depends on claims-worker and what is its downstream blast radius?",
  },
  {
    id: "knowledge",
    label: "Check architecture constraints",
    value: "What architecture decisions constrain ADO-4231?",
  },
];

function textMessage(role: "user" | "assistant", text: string): UIMessage {
  return {
    id: crypto.randomUUID(),
    role,
    parts: [{ type: "text", text }],
  };
}

function approvalQuestion(result: OrchestrationResult, durable: boolean) {
  if (!result.rca) return null;

  return {
    type: "tool-Question",
    toolCallId: `approval-${result.rca.incidentId}-${crypto.randomUUID()}`,
    state: "input-available",
    input: {
      questions: [
        {
          kind: "single",
          title: "What should be approved from this RCA?",
          description: durable
            ? "The decision resumes the durable Cloudflare Workflow. No external rollback or work item mutation is executed yet."
            : "Approval is recorded locally. No external rollback or work item mutation is executed yet.",
          options: [
            {
              id: "approve-both",
              label: "Mitigation + remediation",
              description:
                "Approve the mitigation handoff and remediation work draft.",
            },
            {
              id: "approve-mitigation",
              label: "Mitigation only",
              description:
                "Approve the mitigation handoff and keep remediation as draft.",
            },
            {
              id: "approve-remediation",
              label: "Remediation only",
              description: "Prepare the work-item draft for provider handoff.",
            },
            {
              id: "keep-drafts",
              label: "Keep both as drafts",
              description:
                "Resume without approval and leave both actions unchanged.",
            },
          ],
        },
      ],
      submitLabel: "Record decision",
      allowSkip: false,
    },
  };
}

function assistantRunMessage(
  result: OrchestrationResult,
  options: { durable: boolean; investigationId?: string },
): UIMessage {
  const parts: unknown[] = [];

  if (options.durable && options.investigationId) {
    parts.push({
      type: "tool-mcp__user-tools__start_investigation_workflow",
      toolCallId: crypto.randomUUID(),
      state: "output-available",
      input: { investigationId: options.investigationId },
      output: {
        runtime: "cloudflare",
        state: result.rca ? "waiting-approval" : "completed",
      },
    });
  }

  if (result.plan.agents.length) {
    parts.push({
      type: "tool-mcp__user-tools__select_specialists",
      toolCallId: crypto.randomUUID(),
      state: "output-available",
      input: { intent: result.plan.intent, reason: result.plan.reason },
      output: { agents: result.plan.agents },
    });
  }

  for (const run of result.runs) {
    for (const tool of run.tools) {
      parts.push({
        type: `tool-mcp__user-tools__${tool.name}`,
        toolCallId: tool.id,
        state: "output-available",
        input: tool.input,
        output: tool.output,
      });
    }
  }

  for (const tool of result.tools ?? []) {
    parts.push({
      type: `tool-mcp__user-tools__${tool.name}`,
      toolCallId: tool.id,
      state: "output-available",
      input: tool.input,
      output: tool.output,
    });
  }

  parts.push({ type: "text", text: result.answer });

  const question = approvalQuestion(result, options.durable);
  if (question) parts.push(question);

  return {
    id: crypto.randomUUID(),
    role: "assistant",
    parts,
  } as UIMessage;
}

function approvedActions(answer: QuestionAnswer): ApprovalAction[] {
  const selected = answer.selectedIds?.[0];
  if (selected === "approve-both") return ["mitigation", "remediation"];
  if (selected === "approve-mitigation") return ["mitigation"];
  if (selected === "approve-remediation") return ["remediation"];
  return [];
}

function resolveQuestion(
  messages: UIMessage[],
  toolCallId: string | undefined,
  answer: QuestionAnswer,
): UIMessage[] {
  return messages.map((message) => ({
    ...message,
    parts: message.parts?.map((part) => {
      const candidate = part as {
        type?: string;
        toolCallId?: string;
        output?: unknown;
      };
      if (
        candidate.type !== "tool-Question" ||
        candidate.toolCallId !== toolCallId
      ) {
        return part;
      }
      return {
        ...candidate,
        state: "output-available",
        output: { answer },
      } as typeof part;
    }),
  }));
}

export function ChatExample() {
  const cloudflareConfigured = isCloudflareRuntimeConfigured();
  const [messages, setMessages] = useState<UIMessage[]>(initialMessages);
  const [status, setStatus] = useState<ChatStatus>("ready");
  const [lastIntent, setLastIntent] = useState<string>("orchestrator-ready");
  const [activeAgents, setActiveAgents] = useState<string[]>([]);
  const [lastRun, setLastRun] = useState<OrchestrationResult | null>(null);
  const [lastApproval, setLastApproval] = useState<ApprovalRecord | null>(null);
  const [investigation, setInvestigation] = useState<InvestigationState | null>(
    null,
  );

  async function handleSend(input: { role: "user"; content: string }) {
    if (!input.content.trim()) return;

    setMessages((current) => [...current, textMessage("user", input.content)]);
    setStatus("submitted");
    setInvestigation(null);

    try {
      let result: OrchestrationResult;
      let remoteInvestigation: InvestigationState | null = null;

      if (cloudflareConfigured) {
        const remote = await runRemoteInvestigation(input.content);
        result = remote.result;
        remoteInvestigation = remote.investigation;
        setInvestigation(remote.investigation);
      } else {
        result = await runOrchestrator(orgBrainProviders, input.content);
      }

      setLastIntent(result.plan.intent);
      setActiveAgents(result.plan.agents);
      setLastRun(result);
      setLastApproval(null);
      setMessages((current) => [
        ...current,
        assistantRunMessage(result, {
          durable: Boolean(remoteInvestigation),
          investigationId: remoteInvestigation?.id,
        }),
      ]);
    } catch (error) {
      setMessages((current) => [
        ...current,
        textMessage(
          "assistant",
          cloudflareConfigured
            ? `The Cloudflare investigation failed before completion: ${error instanceof Error ? error.message : "unknown runtime error"}. No external system was changed.`
            : "The local orchestration run failed. The deterministic organization data remains unchanged.",
        ),
      ]);
    } finally {
      setStatus("ready");
    }
  }

  async function handleApproval(payload: {
    toolCallId?: string;
    answer: QuestionAnswer;
  }) {
    if (!lastRun?.rca) return;

    const actions = approvedActions(payload.answer);

    try {
      let durableInvestigation: InvestigationState | null = null;

      if (cloudflareConfigured && investigation) {
        durableInvestigation = await approveRemoteInvestigation(
          investigation.id,
          actions,
        );
        setInvestigation(durableInvestigation);
      } else if (actions.includes("remediation")) {
        await orgBrainProviders.workItems.createDraft(
          lastRun.rca.remediationDraft,
        );
      }

      const record: ApprovalRecord = durableInvestigation?.approval ?? {
        id: crypto.randomUUID(),
        incidentId: lastRun.rca.incidentId,
        actions,
        status: actions.length ? "approved" : "kept-as-draft",
        recordedAt: new Date().toISOString(),
      };
      setLastApproval(record);

      const approvalText = actions.length
        ? `Approval recorded for **${actions.join(" + ")}**${durableInvestigation ? " by the durable investigation workflow" : ""}. The selected handoffs are eligible for the next provider boundary. **No external system was changed.**`
        : `Both actions remain drafts${durableInvestigation ? "; the durable workflow resumed without an approved handoff" : ""}. No execution or work-item mutation was approved.`;

      setMessages((current) => [
        ...resolveQuestion(current, payload.toolCallId, payload.answer),
        {
          id: crypto.randomUUID(),
          role: "assistant",
          parts: [
            {
              type: "tool-mcp__user-tools__record_approval",
              toolCallId: `record-${record.id}`,
              state: "output-available",
              input: {
                incidentId: record.incidentId,
                investigationId: investigation?.id,
              },
              output: {
                status: record.status,
                actions: record.actions,
                runtime: durableInvestigation ? "cloudflare-workflow" : "local",
                execution: "not-executed",
              },
            },
            { type: "text", text: approvalText },
          ],
        } as UIMessage,
      ]);
    } catch (error) {
      setMessages((current) => [
        ...current,
        textMessage(
          "assistant",
          `The approval was not durably completed: ${error instanceof Error ? error.message : "unknown runtime error"}. No external system was changed.`,
        ),
      ]);
    }
  }

  return (
    <div className="min-h-full bg-background/35">
      <PageHeader
        eyebrow="Ask Org Brain"
        title="Engineering context, coordinated"
        description="Bounded specialists resolve work, architecture, dependencies, runtime evidence and source changes. Cloudflare can durably coordinate the investigation while actions remain human-gated."
      />

      <div className="mx-auto grid w-full max-w-[1680px] gap-4 p-5 sm:p-6 xl:grid-cols-[minmax(0,1fr)_330px]">
        <Card className="min-h-[650px] overflow-hidden border-foreground/10 bg-card/88 py-0 shadow-sm backdrop-blur-sm xl:h-[min(74svh,860px)]">
          <CardHeader className="border-b bg-card/80 py-4 backdrop-blur-xl">
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <span className="relative flex size-8 items-center justify-center rounded-lg border bg-muted/40">
                  {status !== "ready" ? (
                    <span className="absolute inset-0 animate-pulse rounded-lg bg-foreground/5" />
                  ) : null}
                  <Sparkles className="relative size-4" />
                </span>
                Org Brain
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className="hidden font-normal sm:inline-flex"
                >
                  {cloudflareConfigured ? <Cloud className="size-3" /> : null}
                  {cloudflareConfigured ? "Cloudflare" : "Local"}
                </Badge>
                <Badge variant="outline" className="font-normal">
                  {lastIntent}
                </Badge>
                <span className="relative flex size-2">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-500/40 motion-reduce:hidden" />
                  <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="h-[calc(100%-65px)] min-h-0 p-0">
            <AgentChat
              messages={messages}
              status={status}
              onSend={handleSend}
              onStop={() => setStatus("ready")}
              suggestions={{ items: promptSuggestions }}
              toolRenderers={orgToolRenderers}
              questionTool={{
                submitLabel: "Record decision",
                allowSkip: false,
                onAnswer: ({ toolCallId, answer }) =>
                  void handleApproval({ toolCallId, answer }),
              }}
              showCopyToolbar
              initialScrollBehavior="bottom"
            />
          </CardContent>
        </Card>

        <div className="portal-scroll space-y-4 xl:max-h-[min(74svh,860px)] xl:overflow-y-auto xl:pr-1">
          {investigation ? (
            <Card className="portal-card-hover animate-in fade-in slide-in-from-top-1 border-foreground/10 bg-card/82 shadow-none backdrop-blur-sm duration-200">
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Cloud className="size-4 text-muted-foreground" />{" "}
                    Investigation
                  </CardTitle>
                  <Badge variant="secondary" className="font-normal">
                    {investigation.status.replaceAll("-", " ")}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-xs text-muted-foreground">
                <p className="truncate font-mono">{investigation.id}</p>
                {investigation.ai ? (
                  <div className="rounded-lg border bg-background/45 p-2.5">
                    <p className="font-medium text-foreground">
                      {investigation.ai.used
                        ? "Workers AI synthesis"
                        : "Deterministic fallback"}
                    </p>
                    <p className="mt-1 truncate">{investigation.ai.model}</p>
                    <p className="mt-1">
                      Gateway: {investigation.ai.gatewayId}
                    </p>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ) : null}

          <Card className="portal-card-hover border-foreground/10 bg-card/78 shadow-none backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-sm">Available context</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <GitBranch className="size-4" /> Work items
                </span>
                <span className="font-medium">
                  {orgBrainData.workItems.length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Boxes className="size-4" /> Services
                </span>
                <span className="font-medium">
                  {orgBrainData.services.length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Network className="size-4" /> Dependencies
                </span>
                <span className="font-medium">
                  {orgBrainData.serviceDependencies.length}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="portal-card-hover border-foreground/10 bg-card/78 shadow-none backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-sm">Last orchestration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {activeAgents.length ? (
                <div className="portal-grid space-y-2">
                  {activeAgents.map((agent) => (
                    <div
                      key={agent}
                      className="flex items-center justify-between rounded-lg border bg-background/50 px-3 py-2 text-sm"
                    >
                      <span className="capitalize">{agent} Agent</span>
                      <Badge variant="secondary" className="font-normal">
                        completed
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm leading-6 text-muted-foreground">
                  No specialist was needed for the last query. The deterministic
                  resolver handled it directly.
                </p>
              )}
            </CardContent>
          </Card>

          {lastRun?.rca ? (
            <Card className="portal-card-hover animate-in fade-in slide-in-from-bottom-2 border-foreground/10 bg-card/90 shadow-sm duration-300">
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <CardTitle className="text-sm">Latest RCA</CardTitle>
                  <Badge variant="secondary">{lastRun.rca.confidence}%</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p className="leading-6">{lastRun.rca.rootCause}</p>
                <div className="rounded-xl border bg-muted/20 p-3">
                  <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                    Mitigation draft
                  </p>
                  <p className="mt-1 leading-5">{lastRun.rca.mitigation}</p>
                </div>
                <div className="rounded-xl border bg-muted/20 p-3">
                  <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                    Remediation work
                  </p>
                  <p className="mt-1 font-medium">
                    {lastRun.rca.remediationDraft.title}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Draft only until approved
                  </p>
                </div>
                {lastApproval ? (
                  <div className="flex items-center justify-between rounded-lg border bg-background/50 px-3 py-2">
                    <span className="text-xs text-muted-foreground">
                      Approval
                    </span>
                    <Badge variant="outline">{lastApproval.status}</Badge>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ) : null}

          <Card className="border-dashed bg-card/45 shadow-none backdrop-blur-sm">
            <CardContent className="p-4 text-sm leading-6 text-muted-foreground">
              {cloudflareConfigured
                ? "Investigations execute through Cloudflare Workflows, keep durable state in a Durable Object, and use Workers AI only after deterministic context resolution. Approvals resume the workflow without executing external mutations."
                : "Cloudflare runtime is not configured, so this browser is using the local deterministic orchestrator. Set NEXT_PUBLIC_ORG_BRAIN_API_URL to activate durable investigations."}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
