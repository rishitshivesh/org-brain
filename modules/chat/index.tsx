"use client";

import type { ChatStatus, UIMessage } from "ai";
import { Boxes, GitBranch, Network, Sparkles } from "lucide-react";
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
import { orgBrainData } from "@/lib/org-brain";
import { PageHeader } from "@/modules/common/page-header";
import { orgToolRenderers } from "@/modules/chat/org-tool-renderers";
import { orgBrainProviders } from "@/providers";

const initialMessages: UIMessage[] = [
  {
    id: "preview-1",
    role: "assistant",
    parts: [
      {
        type: "text",
        text: "Org Brain can now coordinate work, runtime, code-change, dependency and architecture specialists. RCA actions remain gated behind an explicit human approval step.",
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
    value: "Why did claims submission latency increase after the latest deployment?",
  },
  {
    id: "dependency",
    label: "Map claims-worker blast radius",
    value: "What depends on claims-worker and what is its downstream blast radius?",
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

function approvalQuestion(result: OrchestrationResult) {
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
          description: "Approval is recorded locally. No external rollback or work item creation is executed yet.",
          options: [
            {
              id: "approve-both",
              label: "Mitigation + remediation",
              description: "Approve the rollback handoff and remediation work draft.",
            },
            {
              id: "approve-mitigation",
              label: "Mitigation only",
              description: "Approve the mitigation handoff and keep remediation as draft.",
            },
            {
              id: "approve-remediation",
              label: "Remediation only",
              description: "Prepare the work-item draft for provider handoff.",
            },
            {
              id: "keep-drafts",
              label: "Keep both as drafts",
              description: "Record no approval and leave both actions unchanged.",
            },
          ],
        },
      ],
      submitLabel: "Record decision",
      allowSkip: false,
    },
  };
}

function assistantRunMessage(result: OrchestrationResult): UIMessage {
  const parts: unknown[] = [];

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

  const question = approvalQuestion(result);
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
      const candidate = part as { type?: string; toolCallId?: string; output?: unknown };
      if (candidate.type !== "tool-Question" || candidate.toolCallId !== toolCallId) {
        return part;
      }
      return { ...candidate, state: "output-available", output: { answer } } as typeof part;
    }),
  }));
}

export function ChatExample() {
  const [messages, setMessages] = useState<UIMessage[]>(initialMessages);
  const [status, setStatus] = useState<ChatStatus>("ready");
  const [lastIntent, setLastIntent] = useState<string>("orchestrator-ready");
  const [activeAgents, setActiveAgents] = useState<string[]>([]);
  const [lastRun, setLastRun] = useState<OrchestrationResult | null>(null);
  const [lastApproval, setLastApproval] = useState<ApprovalRecord | null>(null);

  async function handleSend(input: { role: "user"; content: string }) {
    if (!input.content.trim()) return;

    setMessages((current) => [...current, textMessage("user", input.content)]);
    setStatus("submitted");

    try {
      const result = await runOrchestrator(orgBrainProviders, input.content);
      setLastIntent(result.plan.intent);
      setActiveAgents(result.plan.agents);
      setLastRun(result);
      setLastApproval(null);
      setMessages((current) => [...current, assistantRunMessage(result)]);
    } catch {
      setMessages((current) => [
        ...current,
        textMessage(
          "assistant",
          "The local orchestration run failed before any remote model call. The deterministic data remains unchanged.",
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
    if (actions.includes("remediation")) {
      await orgBrainProviders.workItems.createDraft(lastRun.rca.remediationDraft);
    }

    const record: ApprovalRecord = {
      id: crypto.randomUUID(),
      incidentId: lastRun.rca.incidentId,
      actions,
      status: actions.length ? "approved" : "kept-as-draft",
      recordedAt: new Date().toISOString(),
    };
    setLastApproval(record);

    const approvalText = actions.length
      ? `Approval recorded for **${actions.join(" + ")}**. The remediation draft is ready for provider handoff when selected, and mitigation is eligible for a future execution provider. **No external system was changed.**`
      : "Both actions remain drafts. No execution or work-item handoff was approved.";

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
            input: { incidentId: record.incidentId },
            output: {
              status: record.status,
              actions: record.actions,
              execution: "not-executed",
            },
          },
          { type: "text", text: approvalText },
        ],
      } as UIMessage,
    ]);
  }

  return (
    <div className="min-h-full bg-background">
      <PageHeader
        eyebrow="Ask Org Brain"
        title="Engineering context, coordinated"
        description="Bounded specialists resolve work, architecture, dependencies, runtime evidence and source changes. Any resulting action remains human-gated."
      />

      <div className="grid min-h-[calc(100vh-11rem)] gap-4 p-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="min-h-[620px] overflow-hidden shadow-none">
          <CardHeader className="border-b py-4">
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Sparkles className="size-4" /> Org Brain
              </CardTitle>
              <Badge variant="outline">{lastIntent}</Badge>
            </div>
          </CardHeader>
          <CardContent className="h-[calc(100%-65px)] p-0">
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

        <div className="space-y-4">
          <Card className="shadow-none">
            <CardHeader>
              <CardTitle className="text-sm">Available context</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <GitBranch className="size-4" /> Work items
                </span>
                <span className="font-medium">{orgBrainData.workItems.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Boxes className="size-4" /> Services
                </span>
                <span className="font-medium">{orgBrainData.services.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Network className="size-4" /> Dependencies
                </span>
                <span className="font-medium">{orgBrainData.serviceDependencies.length}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-none">
            <CardHeader>
              <CardTitle className="text-sm">Last orchestration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {activeAgents.length ? (
                activeAgents.map((agent) => (
                  <div key={agent} className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
                    <span className="capitalize">{agent} Agent</span>
                    <Badge variant="secondary">completed</Badge>
                  </div>
                ))
              ) : (
                <p className="text-sm leading-6 text-muted-foreground">
                  No specialist was needed for the last query. The deterministic resolver handled it directly.
                </p>
              )}
            </CardContent>
          </Card>

          {lastRun?.rca ? (
            <Card className="shadow-none">
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <CardTitle className="text-sm">Latest RCA</CardTitle>
                  <Badge variant="secondary">{lastRun.rca.confidence}%</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p className="leading-6">{lastRun.rca.rootCause}</p>
                <div className="rounded-lg border bg-muted/20 p-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Mitigation draft</p>
                  <p className="mt-1 leading-5">{lastRun.rca.mitigation}</p>
                </div>
                <div className="rounded-lg border bg-muted/20 p-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Remediation work</p>
                  <p className="mt-1 font-medium">{lastRun.rca.remediationDraft.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Draft only until approved</p>
                </div>
                {lastApproval ? (
                  <div className="flex items-center justify-between rounded-lg border px-3 py-2">
                    <span className="text-xs text-muted-foreground">Approval</span>
                    <Badge variant="outline">{lastApproval.status}</Badge>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ) : null}

          <Card className="border-dashed shadow-none">
            <CardContent className="p-4 text-sm leading-6 text-muted-foreground">
              Specialist execution is capped at three runs. Approvals are recorded separately from execution, ready to become durable Workflow state later.
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
