"use client";

import { AgentChat } from "@/components/agent-elements/agent-chat";
import type { UIMessage } from "ai";

const messages: UIMessage[] = [
    {
        id: "msg-1",
        role: "user",
        parts: [{ type: "text", text: "Show me the latest status." }],
    },
    {
        id: "msg-2",
        role: "assistant",
        parts: [{ type: "text", text: "All systems are green." }],
    },
];

const promptSuggestions = [
    { id: "write", label: "Write", value: "Write release notes for this change." },
    { id: "plan", label: "Plan", value: "Draft a rollout plan in 5 steps." },
];

export function ChatExample() {
    return (
        <AgentChat
            messages={[]}
            status="ready"
            onSend={() => {}}
            onStop={() => {}}
            emptyStatePosition="center"
            emptySuggestionsPlacement="empty"
            emptySuggestionsPosition="bottom"
            suggestions={{ items: promptSuggestions }}
        />
    );
}
