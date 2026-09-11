import type { IncidentId, ServiceId, WorkItemDraft } from "@/types/org-brain";

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

interface RcaPattern {
  rootCause: (commit: string) => string;
  mitigation: string;
  draft: Omit<WorkItemDraft, "rationale" | "sourceReferences">;
}

function detectPattern(changeEvidence: string[]): RcaPattern {
  const evidence = changeEvidence.join(" ").toLowerCase();

  if (evidence.includes("awaited work inside a loop")) {
    return {
      rootCause: (commit) =>
        `Commit ${commit} introduced sequential awaited document validation in the claims-worker processing path. The deployed change matches the trace bottleneck and the sharp increase in consumer processing time and lag.`,
      mitigation:
        "Roll back the correlated claims-worker release to the previous known-good version while the validation path is corrected and re-tested.",
      draft: {
        type: "Bug",
        title:
          "Remove sequential document validation from claims consumer path",
        description:
          "Refactor claims-worker document validation so independent document checks do not execute serially inside the consumer processing path. Preserve bounded concurrency, error isolation and existing validation metrics.",
        tags: ["claims", "performance", "document-validation", "remediation"],
        relatedServiceIds: ["SVC-CLAIMS-WORKER", "SVC-DOCUMENT"] as ServiceId[],
        acceptanceCriteria: [
          "Document validation no longer performs unbounded sequential awaits for independent documents.",
          "Consumer processing latency returns to the established baseline under the seeded workload.",
          "Validation failures remain observable per document without blocking unrelated checks.",
          "Consumer lag does not regress under the same load profile.",
        ],
      },
    };
  }

  if (evidence.includes("database pool max configured")) {
    return {
      rootCause: (commit) =>
        `Commit ${commit} reduced the claims-api database connection pool below the concurrency required by the production workload. Connection acquisition became the dominant trace span while application CPU remained stable, causing queued requests and checkout timeouts.`,
      mitigation:
        "Restore the previous production database pool limit and monitor connection wait time, pending acquisitions and checkout p95 before gradually tuning the pool again.",
      draft: {
        type: "Bug",
        title: "Restore capacity-aware database pool configuration",
        description:
          "Replace the reduced claims-api database pool setting with a capacity-tested configuration and add guardrails so production connection limits cannot be lowered below the observed concurrency requirement without validation.",
        tags: ["claims", "database", "capacity", "remediation"],
        relatedServiceIds: ["SVC-CLAIMS-API"] as ServiceId[],
        acceptanceCriteria: [
          "Database connection wait time remains within the established request latency budget at peak seeded concurrency.",
          "Pool pending requests return to baseline under the same load profile.",
          "Checkout p95 returns to the pre-incident range.",
          "Pool configuration changes include an explicit capacity validation or safe lower bound.",
        ],
      },
    };
  }

  if (evidence.includes("retry policy allows")) {
    return {
      rootCause: (commit) =>
        `Commit ${commit} introduced an aggressive synchronous retry policy for document-service failures. Repeated near-immediate attempts amplified a downstream 5xx condition into higher request volume and end-to-end latency across claims submission.`,
      mitigation:
        "Disable or reduce the new retry policy, restore bounded exponential backoff with jitter, and temporarily shed repeated document-validation attempts while document-service recovers.",
      draft: {
        type: "Bug",
        title: "Bound document-service retries with backoff and latency budget",
        description:
          "Replace immediate repeated document-validation retries with bounded exponential backoff, jitter and a caller latency budget. Prevent a degraded dependency from multiplying synchronous traffic.",
        tags: ["claims", "resilience", "retry", "remediation"],
        relatedServiceIds: ["SVC-CLAIMS-API", "SVC-DOCUMENT"] as ServiceId[],
        acceptanceCriteria: [
          "Transient document-service failures do not create more than the approved bounded retry count.",
          "Retries use exponential backoff with jitter rather than near-immediate repeated attempts.",
          "The total retry budget cannot exceed the claims submission latency budget.",
          "Dependency degradation does not amplify document-service request volume beyond the configured retry ceiling.",
        ],
      },
    };
  }

  if (evidence.includes("strict waf multipart body inspection")) {
    return {
      rootCause: (commit) =>
        `Commit ${commit} tightened managed WAF request-body inspection for multipart claim uploads without a scoped exception for the known false-positive rule. Legitimate document uploads are rejected at the edge before NGINX or claims-api receives the request.`,
      mitigation:
        "Roll back the WAF policy revision or apply a narrowly scoped route/content-type/rule exception for the verified false positive while retaining managed rules and block telemetry for all other traffic.",
      draft: {
        type: "Bug",
        title: "Scope WAF multipart exception for legitimate claim uploads",
        description:
          "Add the smallest possible WAF exception for the verified multipart false positive on the claim-document upload route. Preserve managed-rule inspection elsewhere and retain rule/action observability.",
        tags: ["waf", "security", "multipart", "false-positive", "remediation"],
        relatedServiceIds: [
          "SVC-WAF",
          "SVC-NGINX",
          "SVC-CLAIMS-API",
        ] as ServiceId[],
        acceptanceCriteria: [
          "Known-good multipart claim-document fixtures pass through WAF and reach claims-api.",
          "The exception is scoped to the affected route, content type and verified rule ID rather than disabling managed rules globally.",
          "Malicious regression fixtures for the same managed-rule family remain blocked.",
          "WAF logs continue to record rule ID, action and route for both blocked and excepted requests.",
        ],
      },
    };
  }

  if (evidence.includes("nginx proxy read timeout configured")) {
    return {
      rootCause: (commit) =>
        `Commit ${commit} reduced the NGINX proxy read timeout below the supported synchronous claims request budget. NGINX returns 504 after the edge deadline even though claims-api and document validation continue and complete successfully downstream.`,
      mitigation:
        "Restore the previous route-specific upstream timeout immediately, then align NGINX timeout policy with the bounded application latency budget instead of using a global low timeout.",
      draft: {
        type: "Bug",
        title:
          "Align NGINX claims upstream timeout with application latency budget",
        description:
          "Set a capacity-tested route-specific proxy timeout for claims submission, add edge timeout telemetry, and protect configuration changes with a regression test covering the longest supported synchronous document-validation path.",
        tags: ["nginx", "edge", "timeout", "504", "remediation"],
        relatedServiceIds: [
          "SVC-NGINX",
          "SVC-CLAIMS-API",
          "SVC-DOCUMENT",
        ] as ServiceId[],
        acceptanceCriteria: [
          "Supported claims submissions are not terminated by NGINX before the application latency budget expires.",
          "NGINX 504 rate returns to the established baseline for the seeded workload.",
          "Longer-running operations beyond the supported synchronous budget are routed to asynchronous processing rather than solved by unbounded timeout growth.",
          "Timeout-policy changes include route-specific regression coverage and an alert for requests approaching the edge budget.",
        ],
      },
    };
  }

  return {
    rootCause: (commit) =>
      `Commit ${commit} introduced behavior that is strongly correlated with the runtime bottleneck identified by the Observability Agent.`,
    mitigation:
      "Roll back the correlated release to the previous known-good version while the suspected change is isolated and re-tested against the observed production failure mode.",
    draft: {
      type: "Bug",
      title: "Remediate correlated production regression",
      description:
        "Correct the change correlated with the incident, reproduce the observed failure mode in a controlled test and add a regression guard for the affected service path.",
      tags: ["production", "regression", "remediation"],
      relatedServiceIds: [],
      acceptanceCriteria: [
        "The incident failure mode is reproducible before the fix and no longer reproducible after it.",
        "The affected latency or error signal returns to its previous baseline.",
        "A regression guard covers the identified change pattern.",
      ],
    },
  };
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
    Math.round(
      ((observability.confidence ?? 80) + (change.confidence ?? 80)) / 2,
    ),
  );
  const commit = change.title.replace("Candidate change ", "");
  const pattern = detectPattern(change.evidence);
  const rootCause = pattern.rootCause(commit);
  const evidence = [...observability.evidence, ...change.evidence];
  const evidenceAgainst = [
    ...(observability.evidenceAgainst ?? []),
    ...(change.evidenceAgainst ?? []),
  ];

  const remediationDraft: WorkItemDraft = {
    ...pattern.draft,
    rationale: `Generated from ${incidentId} after correlating runtime evidence with the deployed source change.`,
    sourceReferences: [{ type: "incident", id: incidentId }],
  };

  const rca: RcaSynthesis = {
    incidentId,
    rootCause,
    confidence,
    evidence,
    evidenceAgainst,
    mitigation: pattern.mitigation,
    remediationDraft,
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
      output: { mitigation: pattern.mitigation, execution: "draft-only" },
    },
    {
      id: `remediation-${incidentId}`,
      name: "prepare_remediation_work",
      input: { incidentId },
      output: {
        title: remediationDraft.title,
        type: remediationDraft.type,
        acceptanceCriteria: remediationDraft.acceptanceCriteria,
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
    `**Immediate mitigation**  \n${pattern.mitigation}`,
    "",
    `**Remediation draft**  \n${remediationDraft.title}`,
  ].join("\n");

  return { rca, tools, summary };
}
