import { resolveOrgQuery } from "@/lib/query-resolver";
import type { OrgBrainProviders } from "@/providers/types";

import { runObservabilityAgent } from "./observability-agent";
import type {
  OrchestrationPlan,
  OrchestrationResult,
  SpecialistAgentResult,
} from "./types";
import { runWorkAgent } from "./work-agent";

const workSignals = ["ado-", "work item", "partial settlement", "opd", "requirement", "conflict"];
const incidentSignals = ["inc-", "incident", "latency", "trace", "logs", "slow", "error"];

function includesAny(query: string, signals: string[]): boolean {
  return signals.some((signal) => query.includes(signal));
}

export function planOrchestration(rawQuery: string): OrchestrationPlan {
  const query = rawQuery.toLowerCase();
  const work = includesAny(query, workSignals);
  const observability = includesAny(query, incidentSignals);

  if (work && observability) {
    return {
      intent: "impact-analysis",
      agents: ["work", "observability"],
      reason: "The query crosses delivery context and production evidence, so both bounded specialists are useful.",
    };
  }

  if (observability) {
    return {
      intent: "incident-investigation",
      agents: ["observability"],
      reason: "The query asks about runtime symptoms or incident evidence.",
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

  for (const agent of plan.agents.slice(0, 2)) {
    const result =
      agent === "work"
        ? await runWorkAgent(providers, query)
        : await runObservabilityAgent(providers, query);
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

  return {
    plan,
    runs,
    references: [...new Set(runs.flatMap((run) => run.references))],
    answer: runs.map((run) => run.summary).join("\n\n---\n\n"),
  };
}
