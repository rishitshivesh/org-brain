export interface ScenarioEvaluation {
  scenarioId: string;
  expectedRootCause: string;
  supportingEvidenceIds: string[];
  expectedServiceIds: string[];
  expectedDeploymentIds: string[];
  expectedCommitShas: string[];
}

/**
 * Kept separate from public scenario metadata so the UI never needs to import
 * the answer key. Later this can be used by server-side evaluation tooling.
 */
export const scenarioEvaluations: ScenarioEvaluation[] = [
  {
    scenarioId: "claims-latency",
    expectedRootCause:
      "Sequential document validation introduced in claims-worker v3.19.2 increased consumer processing time and caused downstream claim-processing deadlines to be exceeded.",
    supportingEvidenceIds: ["LOG-03", "LOG-04", "tr_8b92f17c"],
    expectedServiceIds: ["SVC-CLAIMS-WORKER", "SVC-DOCUMENT"],
    expectedDeploymentIds: ["DEP-2198"],
    expectedCommitShas: ["8fc19b2"],
  },
  {
    scenarioId: "database-pool",
    expectedRootCause:
      "A claims-api configuration change reduced the production database connection pool from 24 to 6 connections, causing queueing and request timeouts under normal peak concurrency.",
    supportingEvidenceIds: ["LOG-12", "LOG-13", "tr_4cc71d02"],
    expectedServiceIds: ["SVC-CLAIMS-API"],
    expectedDeploymentIds: ["DEP-2214"],
    expectedCommitShas: ["c41db71"],
  },
  {
    scenarioId: "retry-storm",
    expectedRootCause:
      "An aggressive retry policy introduced in claims-api retried document-service 5xx responses immediately, amplifying a downstream slowdown into a request-volume and latency cascade.",
    supportingEvidenceIds: ["LOG-22", "LOG-23", "tr_92f4ad10"],
    expectedServiceIds: ["SVC-CLAIMS-API", "SVC-DOCUMENT"],
    expectedDeploymentIds: ["DEP-2231"],
    expectedCommitShas: ["a90ed31"],
  },
];
