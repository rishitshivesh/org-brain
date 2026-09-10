import type { IncidentId } from "@/types/org-brain";

import type {
  AgentToolEvent,
  RcaSynthesis,
  SpecialistAgentResult,
} from "./types";

function firstFinding(
  runs: SpecialistAgentResult[],
  agent: SpecialistAgentResult["agent"],
) {
  return runs.find((run) => run.agent === agent)?.findings?.[0];
}

export function synthesizeIncidentRca(
  incidentId: IncidentId,
  runs: SpecialistAgentResult[],
): { rca: RcaSynthesis; tools: AgentToolEvent[]; summary: string } | null {
  const observability = firstFinding(runs, "observability");
  const change = firstFinding(runs, "change");
  if (!observability || !change) return null;

  const confidence = Math.min(
    95,
    Math.round(((observability.confidence ?? 80) + (change.confidence ?? 80)) / 2),
  );
  const commit = change.title.replace("Candidate change ", "");
  const sequentialValidation = change.evidence.some((item) =>
    item.includes("awaited work inside a loop"),
  );
  const rootCause = sequentialValidation
    ? `Commit ${commit} introduced sequential awaited document validation in the claims-worker processing path. The deployed change matches the trace bottleneck and the sharp increase in consumer processing time and lag.`
    : `Commit ${commit} introduced behavior that is strongly correlated with the runtime bottleneck identified by the Observability Agent.`;
  const evidence = [...observability.evidence, ...change.evidence];
  const evidenceAgainst = [
    ...(observability.evidenceAgainst ?? []),
    ...(change.evidenceAgainst ?? []),
  ];
  const mitigation =
    "Roll back the correlated claims-worker release to the previous known-good version while the validation path is corrected and re-tested.";

  const rca: RcaSynthesis = {
    incidentId,
    rootCause,
    confidence,
    evidence,
    evidenceAgainst,
    mitigation,
    remediationDraft: {
      type: "Bug",
      title: "Remove sequential document validation from claims consumer path",
      description:
        "Refactor claims-worker document validation so independent document checks do not execute serially inside the consumer processing path. Preserve bounded concurrency, error isolation and existing validation metrics.",
      tags: ["claims", "performance", "document-validation", "remediation"],
      relatedServiceIds: ["SVC-CLAIMS-WORKER", "SVC-DOCUMENT"],
      acceptanceCriteria: [
        "Document validation no longer performs unbounded sequential awaits for independent documents.",
        "Consumer processing latency returns to the established baseline under the seeded workload.",
        "Validation failures remain observable per document without blocking unrelated checks.",
        "Consumer lag does not regress under the same load profile.",
      ],
      rationale: `Generated from ${incidentId} after correlating runtime evidence with the deployed source change.`,
      sourceReferences: [{ type: "incident", id: incidentId }],
    },
  };

  const tools: AgentToolEvent[] = [
    {
      id: `synthesis-${incidentId}`,
      name: "synthesize_rca",
      input: {
        incidentId,
        specialists: runs.map((run) => run.agent),
      },
      output: {
        confidence,
        evidenceCount: evidence.length,
        evidenceAgainstCount: evidenceAgainst.length,
      },
    },
    {
      id: `mitigation-${incidentId}`,
      name: "prepare_mitigation",
      input: { incidentId },
      output: { mitigation, execution: "draft-only" },
    },
    {
      id: `remediation-${incidentId}`,
      name: "prepare_remediation_work",
      input: { incidentId },
      output: {
        title: rca.remediationDraft.title,
        type: rca.remediationDraft.type,
        acceptanceCriteria: rca.remediationDraft.acceptanceCriteria,
        execution: "draft-only",
      },
    },
  ];

  const summary = [
    "## RCA Synthesis",
    "",
    `**Confidence: ${confidence}%**`,
    "",
    `**Root cause**  \n${rootCause}`,
    "",
    "**Supporting evidence**",
    ...evidence.map((item) => `- ${item}`),
    "",
    "**Evidence against / uncertainty**",
    ...(evidenceAgainst.length
      ? evidenceAgainst.map((item) => `- ${item}`)
      : ["- No contradictory evidence was found in the seeded context."]),
    "",
    `**Immediate mitigation**  \n${mitigation}`,
    "",
    `**Remediation draft**  \n${rca.remediationDraft.title}`,
  ].join("\n");

  return { rca, tools, summary };
}
