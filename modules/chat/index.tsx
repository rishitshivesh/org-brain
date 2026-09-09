"use client";

import type { UIMessage } from "ai";
import { Boxes, GitBranch, Network, Sparkles } from "lucide-react";

import { AgentChat } from "@/components/agent-elements/agent-chat";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/modules/common/page-header";
import { orgBrainData } from "@/lib/org-brain";

const messages: UIMessage[] = [
  {
    id: "preview-1",
    role: "user",
    parts: [
      {
        type: "text",
        text: "What changes if we support partial settlement for OPD claims?",
      },
    ],
  },
  {
    id: "preview-2",
    role: "assistant",
    parts: [
      {
        type: "text",
        text: "I found **ADO-4231** and one existing requirement conflict with **ADO-3988**. The change touches `claims-web`, `claims-api`, and `rules-engine`. ADR-018 also requires settlement lifecycle state to remain in `claims-api`, so I would extend the current settlement model instead of introducing a parallel OPD flow.",
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
];

export function ChatExample() {
  return (
    <div className="min-h-full bg-background">
      <PageHeader
        eyebrow="Ask Org Brain"
        title="Engineering context, in one place"
        description="The chat surface is ready against the seeded organization model. Agent orchestration is intentionally the next milestone, not hidden behind mocked network calls."
      />

      <div className="grid min-h-[calc(100vh-11rem)] gap-4 p-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="min-h-[620px] overflow-hidden shadow-none">
          <CardHeader className="border-b py-4">
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Sparkles className="size-4" /> Org Brain
              </CardTitle>
              <Badge variant="outline">Context preview</Badge>
            </div>
          </CardHeader>
          <CardContent className="h-[calc(100%-65px)] p-0">
            <AgentChat
              messages={messages}
              status="ready"
              onSend={() => {}}
              onStop={() => {}}
              suggestions={{ items: promptSuggestions }}
              showCopyToolbar
              initialScrollBehavior="top"
            />
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="shadow-none">
            <CardHeader><CardTitle className="text-sm">Available context</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between"><span className="flex items-center gap-2 text-muted-foreground"><GitBranch className="size-4" /> Work items</span><span className="font-medium">{orgBrainData.workItems.length}</span></div>
              <div className="flex items-center justify-between"><span className="flex items-center gap-2 text-muted-foreground"><Boxes className="size-4" /> Services</span><span className="font-medium">{orgBrainData.services.length}</span></div>
              <div className="flex items-center justify-between"><span className="flex items-center gap-2 text-muted-foreground"><Network className="size-4" /> Dependencies</span><span className="font-medium">{orgBrainData.serviceDependencies.length}</span></div>
            </CardContent>
          </Card>

          <Card className="border-dashed shadow-none">
            <CardContent className="p-4 text-sm leading-6 text-muted-foreground">
              This screen uses Agent Elements&apos; full chat surface, suggestions and message rendering now. Tool cards, streaming states and question/approval flows will plug into the same surface when the real agents arrive.
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
