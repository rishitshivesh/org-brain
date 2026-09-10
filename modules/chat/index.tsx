"use client";

import type { ChatStatus, UIMessage } from "ai";
import { Boxes, GitBranch, Network, Sparkles } from "lucide-react";
import { useState } from "react";

import { runOrchestrator, type OrchestrationResult } from "@/agents";
import { AgentChat } from "@/components/agent-elements/agent-chat";
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
        text: "Org Brain now separates runtime analysis from code-change attribution. Incident questions route through Observability and Change specialists before an RCA is synthesized.",
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
    id: "service",
    label: "Explain claims-worker",
    value: "Show me what claims-worker owns and what depends on it.",
  },
  {
    id: "deployment",
    label: "Inspect deployment",
    value: "What changed in DEP-2198?",
  },
];

function textMessage(role: "user" | "assistant", text: string): UIMessage {
  return {
    id: crypto.randomUUID(),
    role,
    parts: [{ type: "text", text }],
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

  return {
    id: crypto.randomUUID(),
    role: "assistant",
    parts,
  } as UIMessage;
}

export function ChatExample() {
  const [messages, setMessages] = useState<UIMessage[]>(initialMessages);
  const [status, setStatus] = useState<ChatStatus>("ready");
  const [lastIntent, setLastIntent] = useState<string>("orchestrator-ready");
  const [activeAgents, setActiveAgents] = useState<string[]>([]);
  const [lastRun, setLastRun] = useState<OrchestrationResult | null>(null);

  async function handleSend(input: { role: "user"; content: string }) {
    if (!input.content.trim()) return;

    setMessages((current) => [...current, textMessage("user", input.content)]);
    setStatus("submitted");

    try {
      const result = await runOrchestrator(orgBrainProviders, input.content);
      setLastIntent(result.plan.intent);
      setActiveAgents(result.plan.agents);
      setLastRun(result);
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

  return (
    <div className="min-h-full bg-background">
      <PageHeader
        eyebrow="Ask Org Brain"
        title="Engineering context, coordinated"
        description="Runtime symptoms, engineering changes and work context are evaluated by bounded specialists before synthesis. No production action is executed from this surface."
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
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Mitigation draft
                  </p>
                  <p className="mt-1 leading-5">{lastRun.rca.mitigation}</p>
                </div>
                <div className="rounded-lg border bg-muted/20 p-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Remediation work
                  </p>
                  <p className="mt-1 font-medium">{lastRun.rca.remediationDraft.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Draft only · no work item created</p>
                </div>
              </CardContent>
            </Card>
          ) : null}

          <Card className="border-dashed shadow-none">
            <CardContent className="p-4 text-sm leading-6 text-muted-foreground">
              Specialist execution is capped at three bounded runs. Mitigation and remediation output remain drafts until a later approval workflow is connected.
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
