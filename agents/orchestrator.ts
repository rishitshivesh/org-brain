import { resolveOrgQuery } from "@/lib/query-resolver";
import type { OrgBrainProviders } from "@/providers/types";

import { runChangeAgent } from "./change-agent";
import { runDependencyAgent } from "./dependency-agent";
import { runKnowledgeAgent } from "./knowledge-agent";
import { runObservabilityAgent } from "./observability-agent";
import { synthesizeIncidentRca } from "./synthesizer";
import type {
  OrchestrationPlan,
  OrchestrationResult,
  SpecialistAgentId,
  SpecialistAgentResult,
} from "./types";
import { runWorkAgent } from "./work-agent";

const workSignals = [
  "ado-",
  "work item",
  "work items",
  "partial settlement",
  "opd",
  "requirement",
  "conflict",
  "implement",
  "break down",
  "breakdown",
  "stories",
];
const incidentSignals = [
  "inc-",
  "incident",
  "latency",
  "trace",
  "logs",
  "slow",
  "error",
  "root cause",
  "rca",
  "timeout",
  "timeouts",
  "retry",
  "database",
];
const dependencySignals = [
  "dependency",
  "dependencies",
  "depends on",
  "upstream",
  "downstream",
  "blast radius",
  "calls",
  "service path",
];
const knowledgeSignals = [
  "adr-",
  "architecture",
  "decision",
  "constraint",
  "knowledge",
];

function includesAny(query: string, signals: string[]): boolean {
  return signals.some((signal) => query.includes(signal));
}

function uniqueAgents(agents: SpecialistAgentId[]): SpecialistAgentId[] {
  return [...new Set(agents)].slice(0, 3);
}

export function planOrchestration(rawQuery: string): OrchestrationPlan {
  const query = rawQuery.toLowerCase();
  const work = includesAny(query, workSignals);
  const incident = includesAny(query, incidentSignals);
  const dependency = includesAny(query, dependencySignals);
  const knowledge = includesAny(query, knowledgeSignals);

  if (incident) {
    return {
      intent: "root-cause-analysis",
      agents: uniqueAgents([
        "observability",
        "change",
        ...(dependency ? ["dependency" as SpecialistAgentId] : []),
        ...(knowledge ? ["knowledge" as SpecialistAgentId] : []),
      ]),
      reason:
        "Runtime evidence and engineering changes are evaluated separately, with dependency or architecture context added only when the query asks for it.",
    };
  }

  if (work) {
    return {
      intent: "work-planning",
      agents: uniqueAgents([
        "work",
        ...(dependency ? ["dependency" as SpecialistAgentId] : []),
        ...(knowledge ? ["knowledge" as SpecialistAgentId] : []),
      ]),
      reason:
        "Work context is primary, with dependency and architecture specialists added only when requested.",
    };
  }

  if (dependency) {
    return {
      intent: "service-analysis",
      agents: ["dependency"],
      reason:
        "The query asks about explicit service reachability or blast radius.",
    };
  }

  if (knowledge) {
    return {
      intent: "impact-analysis",
      agents: ["knowledge"],
      reason:
        "The query asks for durable architecture decisions or constraints.",
    };
  }

  return {
    intent: "general-query",
    agents: [],
    reason:
      "No specialist is required for the currently supported deterministic query types.",
  };
}

async function runSpecialist(
  agent: SpecialistAgentId,
  providers: OrgBrainProviders,
  query: string,
): Promise<SpecialistAgentResult | null> {
  switch (agent) {
    case "work":
      return runWorkAgent(providers, query);
    case "observability":
      return runObservabilityAgent(providers, query);
    case "change":
      return runChangeAgent(providers, query);
    case "dependency":
      return runDependencyAgent(providers, query);
    case "knowledge":
      return runKnowledgeAgent(providers, query);
  }
}

export async function runOrchestrator(
  providers: OrgBrainProviders,
  query: string,
): Promise<OrchestrationResult> {
  const plan = planOrchestration(query);
  const runs: SpecialistAgentResult[] = [];

  for (const agent of plan.agents) {
    const result = await runSpecialist(agent, providers, query);
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
  const synthesis = incidentId ? synthesizeIncidentRca(incidentId, runs) : null;
  const workPackage = runs.find((run) => run.workPackage)?.workPackage;

  return {
    plan,
    runs,
    tools: synthesis?.tools,
    rca: synthesis?.rca,
    workPackage,
    references: [
      ...new Set([
        ...runs.flatMap((run) => run.references),
        ...(synthesis?.rca.remediationDraft.sourceReferences?.map(
          (reference) => reference.id,
        ) ?? []),
        ...(workPackage?.items.flatMap((item) =>
          item.sourceReferences?.map((reference) => reference.id) ?? [],
        ) ?? []),
      ]),
    ],
    answer: [
      ...runs.map((run) => run.summary),
      ...(synthesis ? [synthesis.summary] : []),
    ].join("\n\n---\n\n"),
  };
}
