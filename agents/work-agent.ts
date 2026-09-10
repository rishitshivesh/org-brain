import { buildWorkPlanningContext } from "@/lib/context-builders";
import type { OrgBrainProviders } from "@/providers/types";
import type { WorkItemDraft } from "@/types/org-brain";

import type { SpecialistAgentResult, WorkPackageDraft } from "./types";

const workItemPattern = /ADO-\d+/i;

function getWorkLookup(query: string): string {
  const workItemId = query.match(workItemPattern)?.[0].toUpperCase();
  if (workItemId) return workItemId;

  const normalized = query.toLowerCase();
  if (normalized.includes("partial settlement") || normalized.includes("opd")) {
    return "partial settlement";
  }
  if (normalized.includes("document categorization")) {
    return "document categorization";
  }

  return query;
}

function shouldGeneratePackage(query: string): boolean {
  const normalized = query.toLowerCase();
  return [
    "implement",
    "plan",
    "break down",
    "breakdown",
    "stories",
    "work items",
    "create work",
    "what changes",
    "support partial",
  ].some((signal) => normalized.includes(signal));
}

function makeWorkPackage(
  context: Awaited<ReturnType<typeof buildWorkPlanningContext>> & {},
): WorkPackageDraft {
  const source = context.workItem;
  const services = context.services.map((service) => service.id);
  const common = {
    tags: [...new Set([...(source.tags ?? []), "org-brain-generated"])],
    relatedServiceIds: services,
    sourceReferences: [{ type: "work-item" as const, id: source.id }],
  };

  const feature: WorkItemDraft = {
    type: "Feature",
    title: source.title,
    description:
      source.description ??
      `Implement ${source.title} while preserving the currently linked architecture constraints and service boundaries.`,
    ...common,
    acceptanceCriteria: [
      "The existing conflicting behavior is explicitly reconciled before rollout.",
      "The implementation respects linked architecture decisions and current service ownership.",
      "The change is observable and can be rolled out independently without introducing a parallel source of truth.",
    ],
    rationale: `Generated from ${source.id} with ${context.conflicts.length} explicit conflict(s) and ${context.architectureDecisions.length} linked architecture decision(s).`,
  };

  const apiStory: WorkItemDraft = {
    type: "Story",
    title: `Implement ${source.title.toLowerCase()} in claims-api`,
    description:
      "Extend the claims-api lifecycle and contract so the new behavior remains owned by the existing settlement boundary rather than introducing a second settlement state machine.",
    ...common,
    acceptanceCriteria: [
      "The API contract represents the new state without breaking existing all-or-nothing consumers.",
      "Settlement lifecycle ownership remains in claims-api.",
      "Validation and failure paths are covered by contract and integration tests.",
    ],
  };

  const rulesStory: WorkItemDraft = {
    type: "Story",
    title: `Add eligibility rules for ${source.title.toLowerCase()}`,
    description:
      "Update rules-engine eligibility decisions while keeping settlement state transitions outside the rules service.",
    ...common,
    acceptanceCriteria: [
      "Rules-engine returns eligibility decisions only and does not persist an independent settlement lifecycle.",
      "Existing settlement validation remains backward compatible for unaffected claim types.",
      "Rule outcomes are covered by representative positive and negative fixtures.",
    ],
  };

  const webStory: WorkItemDraft = {
    type: "Story",
    title: `Expose ${source.title.toLowerCase()} in claims-web`,
    description:
      "Update the user flow to represent partial completion and line-item settlement states using the claims-api contract as the source of truth.",
    ...common,
    acceptanceCriteria: [
      "Users can clearly distinguish settled, unsettled and ineligible line items.",
      "The UI does not derive settlement state independently from backend lifecycle state.",
      "Existing non-OPD settlement flows remain unchanged.",
    ],
  };

  return {
    sourceWorkItemId: source.id,
    summary: `A feature-level package with ${3} implementation stories across the primary service boundaries. All items remain drafts until a provider handoff is explicitly approved.`,
    items: [feature, apiStory, rulesStory, webStory],
  };
}

export async function runWorkAgent(
  providers: OrgBrainProviders,
  query: string,
): Promise<SpecialistAgentResult | null> {
  const lookup = getWorkLookup(query);
  const context = await buildWorkPlanningContext(providers, lookup);
  if (!context) return null;

  const serviceNames = context.services.map((service) => service.name);
  const conflicts = context.conflicts.map(
    (item) => `${item.id} · ${item.title}`,
  );
  const decisions = context.architectureDecisions.map(
    (decision) => `${decision.id} · ${decision.title}`,
  );
  const workPackage = shouldGeneratePackage(query)
    ? makeWorkPackage(context)
    : undefined;

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
    workPackage,
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
        output: {
          services: serviceNames,
          repositories: context.repositories.map((repo) => repo.name),
        },
      },
      {
        id: `work-conflicts-${context.workItem.id}`,
        name: "check_work_conflicts",
        input: { workItemId: context.workItem.id },
        output: { conflicts, architectureDecisions: decisions },
      },
      ...(workPackage
        ? [
            {
              id: `work-package-${context.workItem.id}`,
              name: "prepare_work_package",
              input: { workItemId: context.workItem.id },
              output: {
                items: workPackage.items.map((item) => ({
                  type: item.type,
                  title: item.title,
                })),
                execution: "draft-only",
              },
            },
          ]
        : []),
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
      ...(workPackage
        ? [
            "",
            `**Draft work package:** ${workPackage.items.map((item) => `${item.type}: ${item.title}`).join("; ")}.`,
            "The package is advisory and remains behind the provider handoff boundary.",
          ]
        : []),
    ].join("\n"),
  };
}
