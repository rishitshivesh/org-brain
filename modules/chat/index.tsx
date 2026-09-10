"use client";

import type { ChatStatus, UIMessage } from "ai";
import { Boxes, GitBranch, Network, Sparkles } from "lucide-react";
import { useState } from "react";

import { AgentChat } from "@/components/agent-elements/agent-chat";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { orgBrainData } from "@/lib/org-brain";
import { resolveOrgQuery } from "@/lib/query-resolver";
import { PageHeader } from "@/modules/common/page-header";
import { orgBrainProviders } from "@/providers";

const initialMessages: UIMessage[] = [
  {
    id: "preview-1",
    role: "assistant",
    parts: [
      {
        type: "text",
        text: "I can resolve seeded work, service, deployment and incident relationships without an LLM. Try one of the prompts below, or ask about `ADO-4231`, `INC-2409`, `DEP-2198`, or `claims-worker`.",
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

function message(role: "user" | "assistant", text: string): UIMessage {
  return {
    id: crypto.randomUUID(),
    role,
    parts: [{ type: "text", text }],
  };
}

export function ChatExample() {
  const [messages, setMessages] = useState<UIMessage[]>(initialMessages);
  const [status, setStatus] = useState<ChatStatus>("ready");
  const [lastIntent, setLastIntent] = useState<string>("deterministic-query");

  async function handleSend(input: { role: "user"; content: string }) {
    if (!input.content.trim()) return;

    const userMessage = message("user", input.content);
    setMessages((current) => [...current, userMessage]);
    setStatus("submitted");

    try {
      const result = await resolveOrgQuery(orgBrainProviders, input.content);
      setLastIntent(result.intent);
      setMessages((current) => [...current, message("assistant", result.answer)]);
    } catch {
      setMessages((current) => [
        ...current,
        message(
          "assistant",
          "I could not resolve that query from the seeded organization model. No fallback LLM is connected yet.",
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
        title="Engineering context, in one place"
        description="Queries are resolved from explicit work, service, deployment and observability relationships before any agent or LLM is involved."
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

          <Card className="border-dashed shadow-none">
            <CardContent className="p-4 text-sm leading-6 text-muted-foreground">
              This is intentionally not an agent yet. The same Agent Elements surface is now exercising the deterministic context layer that future specialist agents will consume.
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
