import { resolveOrgQuery } from "@/lib/query-resolver";
import type { OrgBrainProviders } from "@/providers/types";

import { runChangeAgent } from "./change-agent";
import { runObservabilityAgent } from "./observability-agent";
import { synthesizeIncidentRca } from "./synthesizer";
import type {
  OrchestrationPlan,
  OrchestrationResult,
  SpecialistAgentResult,
} from "./types";
import { runWorkAgent } from "./work-agent";

const workSignals = ["ado-", "work item", "partial settlement", "opd", "requirement", "conflict"];
const incidentSignals = ["inc-", "incident", "latency", "trace", "logs", "slow", "error", "root cause", "rca"];

function includesAny(query: string, signals: string[]): boolean {
  return signals.some((signal) => query.includes(signal));
}

export function planOrchestration(rawQuery: string): OrchestrationPlan {
  const query = rawQuery.toLowerCase();
  const work = includesAny(query, workSignals);
  const incident = includesAny(query, incidentSignals);

  if (work && incident) {
    return {
      intent: "impact-analysis",
      agents: ["work", "observability", "change"],
      reason:
        "The query crosses delivery context and production evidence, so work, runtime and change specialists are useful.",
    };
  }

  if (incident) {
    return {
      intent: "root-cause-analysis",
      agents: ["observability", "change"],
      reason:
        "The query asks about an operational symptom, so runtime evidence and correlated engineering changes must be evaluated separately.",
    };
  }

  if (work) {
    return {
      intent: "work-planning",
      agents: ["work"],
      reason: "The query asks about existing work, requirements or conflicts.",
    };
  }

  return {
    intent: "general-query",
    agents: [],
    reason: "No specialist is required for the currently supported deterministic query types.",
  };
}

export async function runOrchestrator(
  providers: OrgBrainProviders,
  query: string,
): Promise<OrchestrationResult> {
  const plan = planOrchestration(query);
  const runs: SpecialistAgentResult[] = [];

  for (const agent of plan.agents.slice(0, 3)) {
    const result =
      agent === "work"
        ? await runWorkAgent(providers, query)
        : agent === "observability"
          ? await runObservabilityAgent(providers, query)
          : await runChangeAgent(providers, query);
    if (result) runs.push(result);
  }

  if (runs.length === 0) {
    const fallback = await resolveOrgQuery(providers, query);
    return {
      plan: { ...plan, intent: fallback.intent },
      runs,
      references: fallback.references,
      answer: fallback.answer,
    };
  }

  const incidentId = runs
    .flatMap((run) => run.references)
    .find((reference) => /^INC-\d+$/i.test(reference));
  const synthesis = incidentId
    ? synthesizeIncidentRca(incidentId, runs)
    : null;

  return {
    plan,
    runs,
    tools: synthesis?.tools,
    rca: synthesis?.rca,
    references: [
      ...new Set([
        ...runs.flatMap((run) => run.references),
        ...(synthesis?.rca.remediationDraft.sourceReferences?.map((reference) => reference.id) ?? []),
      ]),
    ],
    answer: [
      ...runs.map((run) => run.summary),
      ...(synthesis ? [synthesis.summary] : []),
    ].join("\n\n---\n\n"),
  };
}
