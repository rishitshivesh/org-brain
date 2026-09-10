"use client";

import type { CustomToolRendererProps } from "@/components/agent-elements/types";
import { Badge } from "@/components/ui/badge";
import {
  Activity,
  BookOpenCheck,
  CheckCircle2,
  Cloud,
  FileCode2,
  GitBranch,
  Network,
  Search,
  ShieldAlert,
  Sparkles,
  Undo2,
  Wrench,
} from "lucide-react";

const toolMeta = {
  start_investigation_workflow: { label: "Started durable investigation", icon: Cloud },
  search_work_items: { label: "Searched work items", icon: Search },
  resolve_work_impact: { label: "Resolved work impact", icon: Network },
  check_work_conflicts: { label: "Checked conflicts", icon: ShieldAlert },
  inspect_trace: { label: "Inspected trace", icon: Activity },
  inspect_logs: { label: "Inspected logs", icon: Search },
  compare_metrics: { label: "Compared metrics", icon: Activity },
  inspect_deployments: { label: "Inspected deployments", icon: GitBranch },
  inspect_commits: { label: "Inspected commits", icon: GitBranch },
  inspect_source_changes: { label: "Inspected source changes", icon: FileCode2 },
  correlate_change: { label: "Correlated change", icon: Network },
  inspect_architecture_decisions: { label: "Inspected architecture decisions", icon: BookOpenCheck },
  check_architecture_constraints: { label: "Checked architecture constraints", icon: ShieldAlert },
  resolve_dependency_graph: { label: "Resolved dependency graph", icon: Network },
  assess_blast_radius: { label: "Assessed blast radius", icon: Network },
  synthesize_rca: { label: "Synthesized RCA", icon: Sparkles },
  prepare_mitigation: { label: "Prepared mitigation", icon: Undo2 },
  prepare_remediation_work: { label: "Prepared remediation work", icon: Wrench },
  record_approval: { label: "Recorded approval", icon: CheckCircle2 },
  select_specialists: { label: "Selected specialists", icon: GitBranch },
} as const;

function outputSummary(name: string, output: unknown): string {
  if (!output || typeof output !== "object") return "Completed";
  const value = output as Record<string, unknown>;

  if (name === "start_investigation_workflow" && typeof value.state === "string") return value.state.replaceAll("-", " ");
  if (name === "search_work_items" && typeof value.matched === "string") return value.matched;
  if (name === "resolve_work_impact" && Array.isArray(value.services)) return `${value.services.length} services`;
  if (name === "check_work_conflicts" && Array.isArray(value.conflicts)) return `${value.conflicts.length} conflicts`;
  if (name === "inspect_trace" && Array.isArray(value.services)) return `${value.services.length} services traced`;
  if (name === "inspect_logs" && typeof value.total === "number") return `${value.total} logs`;
  if (name === "compare_metrics" && Array.isArray(value.anomalies)) return `${value.anomalies.length} anomalies`;
  if (name === "inspect_deployments" && Array.isArray(value.deployments)) return `${value.deployments.length} deployment${value.deployments.length === 1 ? "" : "s"}`;
  if (name === "inspect_commits" && Array.isArray(value.commits)) return `${value.commits.length} commit${value.commits.length === 1 ? "" : "s"}`;
  if (name === "inspect_source_changes" && Array.isArray(value.files)) return `${value.files.length} source snapshot${value.files.length === 1 ? "" : "s"}`;
  if (name === "correlate_change" && typeof value.confidence === "number") return `${value.confidence}% confidence`;
  if (name === "inspect_architecture_decisions" && Array.isArray(value.decisions)) return `${value.decisions.length} decision${value.decisions.length === 1 ? "" : "s"}`;
  if (name === "check_architecture_constraints" && Array.isArray(value.constraints)) return `${value.constraints.length} constraint${value.constraints.length === 1 ? "" : "s"}`;
  if (name === "resolve_dependency_graph" && Array.isArray(value.edges)) return `${value.edges.length} edges`;
  if (name === "assess_blast_radius" && typeof value.count === "number") return `${value.count} downstream services`;
  if (name === "synthesize_rca" && typeof value.confidence === "number") return `${value.confidence}% confidence`;
  if (name === "prepare_mitigation" && value.execution === "draft-only") return "Draft only";
  if (name === "prepare_remediation_work" && value.execution === "draft-only") return "Draft only";
  if (name === "record_approval" && typeof value.status === "string") return value.status.replaceAll("-", " ");
  if (name === "select_specialists" && Array.isArray(value.agents)) return `${value.agents.length} specialist${value.agents.length === 1 ? "" : "s"}`;

  return "Completed";
}

export function OrgToolRenderer({ name, output, status }: CustomToolRendererProps) {
  const meta = toolMeta[name as keyof typeof toolMeta] ?? {
    label: name.replaceAll("_", " "),
    icon: Search,
  };
  const Icon = meta.icon;
  const pending = status !== "success" && status !== "error";

  return (
    <div className="animate-in fade-in slide-in-from-bottom-1 my-1 flex items-center gap-2 rounded-xl border bg-muted/20 px-3 py-2 text-sm duration-200">
      <span className="relative flex size-8 shrink-0 items-center justify-center rounded-lg border bg-background/80 shadow-sm">
        {pending ? <span className="absolute inset-0 animate-pulse rounded-lg bg-foreground/5" /> : null}
        <Icon className="relative size-3.5 text-muted-foreground" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{meta.label}</p>
        <p className="truncate text-xs text-muted-foreground">
          {status === "success" ? outputSummary(name, output) : status}
        </p>
      </div>
      <Badge
        variant={status === "error" ? "destructive" : "outline"}
        className="shrink-0 font-normal capitalize"
      >
        {status}
      </Badge>
    </div>
  );
}

export const orgToolRenderers = Object.fromEntries(
  Object.keys(toolMeta).map((name) => [name, OrgToolRenderer]),
);
