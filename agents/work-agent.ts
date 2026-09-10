import { buildWorkPlanningContext } from "@/lib/context-builders";
import type { OrgBrainProviders } from "@/providers/types";

import type { SpecialistAgentResult } from "./types";

const workItemPattern = /ADO-\d+/i;

export async function runWorkAgent(
  providers: OrgBrainProviders,
  query: string,
): Promise<SpecialistAgentResult | null> {
  const workItemId = query.match(workItemPattern)?.[0].toUpperCase();
  const lookup = workItemId ?? query;
  const context = await buildWorkPlanningContext(providers, lookup);
  if (!context) return null;

  const serviceNames = context.services.map((service) => service.name);
  const conflicts = context.conflicts.map((item) => `${item.id} · ${item.title}`);
  const decisions = context.architectureDecisions.map(
    (decision) => `${decision.id} · ${decision.title}`,
  );

  const recommendation = context.conflicts.length
    ? "Extend the existing flow rather than creating a parallel implementation until the conflicting requirement is reconciled."
    : "No explicit requirement conflict is linked to this work item in the current organization model.";

  return {
    agent: "work",
    references: [
      context.workItem.id,
      ...context.conflicts.map((item) => item.id),
      ...context.architectureDecisions.map((decision) => decision.id),
    ],
    tools: [
      {
        id: `work-search-${context.workItem.id}`,
        name: "search_work_items",
        input: { query: lookup },
        output: {
          matched: context.workItem.id,
          title: context.workItem.title,
          matchedBy: context.matchedBy,
        },
      },
      {
        id: `work-impact-${context.workItem.id}`,
        name: "resolve_work_impact",
        input: { workItemId: context.workItem.id },
        output: { services: serviceNames, repositories: context.repositories.map((repo) => repo.name) },
      },
      {
        id: `work-conflicts-${context.workItem.id}`,
        name: "check_work_conflicts",
        input: { workItemId: context.workItem.id },
        output: { conflicts, architectureDecisions: decisions },
      },
    ],
    summary: [
      `### Work Agent\n`,
      `I found **${context.workItem.id} · ${context.workItem.title}**.`,
      "",
      `**Affected services:** ${serviceNames.join(", ") || "none"}.`,
      `**Conflicts:** ${conflicts.join(", ") || "none"}.`,
      `**Architecture constraints:** ${decisions.join(", ") || "none"}.`,
      "",
      recommendation,
    ].join("\n"),
  };
}
