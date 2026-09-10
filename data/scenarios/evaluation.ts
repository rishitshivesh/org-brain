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
];
