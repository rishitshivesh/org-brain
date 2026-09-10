"use client";

import type { CustomToolRendererProps } from "@/components/agent-elements/types";
import { Badge } from "@/components/ui/badge";
import { Activity, GitBranch, Network, Search, ShieldAlert } from "lucide-react";

const toolMeta = {
  search_work_items: { label: "Searched work items", icon: Search },
  resolve_work_impact: { label: "Resolved work impact", icon: Network },
  check_work_conflicts: { label: "Checked conflicts", icon: ShieldAlert },
  inspect_trace: { label: "Inspected trace", icon: Activity },
  inspect_logs: { label: "Inspected logs", icon: Search },
  compare_metrics: { label: "Compared metrics", icon: Activity },
  select_specialists: { label: "Selected specialists", icon: GitBranch },
} as const;

function outputSummary(name: string, output: unknown): string {
  if (!output || typeof output !== "object") return "Completed";
  const value = output as Record<string, unknown>;

  if (name === "search_work_items" && typeof value.matched === "string") {
    return value.matched;
  }
  if (name === "resolve_work_impact" && Array.isArray(value.services)) {
    return `${value.services.length} services`;
  }
  if (name === "check_work_conflicts" && Array.isArray(value.conflicts)) {
    return `${value.conflicts.length} conflicts`;
  }
  if (name === "inspect_trace" && Array.isArray(value.services)) {
    return `${value.services.length} services traced`;
  }
  if (name === "inspect_logs" && typeof value.total === "number") {
    return `${value.total} logs`;
  }
  if (name === "compare_metrics" && Array.isArray(value.anomalies)) {
    return `${value.anomalies.length} anomalies`;
  }
  if (name === "select_specialists" && Array.isArray(value.agents)) {
    return `${value.agents.length} specialist${value.agents.length === 1 ? "" : "s"}`;
  }

  return "Completed";
}

export function OrgToolRenderer({ name, output, status }: CustomToolRendererProps) {
  const meta = toolMeta[name as keyof typeof toolMeta] ?? {
    label: name.replaceAll("_", " "),
    icon: Search,
  };
  const Icon = meta.icon;

  return (
    <div className="my-1 flex items-center gap-2 rounded-lg border bg-muted/20 px-3 py-2 text-sm">
      <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-background ring-1 ring-foreground/10">
        <Icon className="size-3.5 text-muted-foreground" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{meta.label}</p>
        <p className="truncate text-xs text-muted-foreground">
          {status === "success" ? outputSummary(name, output) : status}
        </p>
      </div>
      <Badge variant={status === "error" ? "destructive" : "outline"}>{status}</Badge>
    </div>
  );
}

export const orgToolRenderers = Object.fromEntries(
  Object.keys(toolMeta).map((name) => [name, OrgToolRenderer]),
);
