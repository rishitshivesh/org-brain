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
 * the answer key. Server-only evaluation compares generated RCA output against
 * these contracts without exposing the expected answer to runtime agents.
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
  {
    scenarioId: "waf-false-positive",
    expectedRootCause:
      "A WAF policy rollout enabled strict multipart body inspection at an anomaly threshold that blocks a legitimate claims upload pattern before traffic reaches NGINX or claims-api.",
    supportingEvidenceIds: ["LOG-31", "LOG-32", "tr_waf_31fd2c"],
    expectedServiceIds: ["SVC-WAF", "SVC-NGINX", "SVC-CLAIMS-API"],
    expectedDeploymentIds: ["DEP-2244"],
    expectedCommitShas: ["f3a21d9"],
  },
  {
    scenarioId: "nginx-timeout",
    expectedRootCause:
      "A NGINX configuration rollout reduced proxy_read_timeout to five seconds, below the supported claims request latency budget, so the edge returns 504 while claims-api continues and completes successfully.",
    supportingEvidenceIds: ["LOG-38", "LOG-39", "tr_nginx_81ce7a"],
    expectedServiceIds: ["SVC-NGINX", "SVC-CLAIMS-API", "SVC-DOCUMENT"],
    expectedDeploymentIds: ["DEP-2250"],
    expectedCommitShas: ["b7d992a"],
  },
];
