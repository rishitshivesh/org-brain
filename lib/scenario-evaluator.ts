import "server-only";

import type { OrchestrationResult } from "@/agents";
import { scenarioEvaluations } from "@/data/scenarios/evaluation";
import { publicScenarios } from "@/data/scenarios/public";
import { orgBrainData } from "@/lib/org-brain";
import type {
  RcaEvaluationDimension,
  RcaEvaluationResult,
} from "@/types/evaluation";

const causalStopWords = new Set([
  "a",
  "an",
  "and",
  "as",
  "at",
  "by",
  "for",
  "from",
  "in",
  "into",
  "of",
  "on",
  "or",
  "the",
  "to",
  "under",
  "with",
]);

function normalizedCorpus(result: OrchestrationResult): string {
  const rca = result.rca;
  if (!rca) return "";

  return [
    rca.rootCause,
    ...rca.evidence,
    ...rca.evidenceAgainst,
    rca.mitigation,
    rca.remediationDraft.title,
    rca.remediationDraft.description ?? "",
    ...(rca.remediationDraft.acceptanceCriteria ?? []),
    ...result.references,
  ]
    .join(" ")
    .toLowerCase();
}

function entityCoverage(
  expectedIds: string[],
  corpus: string,
  names: Map<string, string>,
): number {
  if (!expectedIds.length) return 1;
  const matches = expectedIds.filter((id) => {
    const name = names.get(id)?.toLowerCase();
    return corpus.includes(id.toLowerCase()) || Boolean(name && corpus.includes(name));
  });
  return matches.length / expectedIds.length;
}

function evidenceCoverage(expectedIds: string[], result: OrchestrationResult): number {
  if (!expectedIds.length) return 1;
  const references = new Set(result.references.map((reference) => reference.toLowerCase()));
  const corpus = normalizedCorpus(result);
  const matches = expectedIds.filter(
    (id) => references.has(id.toLowerCase()) || corpus.includes(id.toLowerCase()),
  );
  return matches.length / expectedIds.length;
}

function causalAlignment(expected: string, actual: string): number {
  const tokenize = (value: string) =>
    new Set(
      value
        .toLowerCase()
        .replace(/[^a-z0-9-]+/g, " ")
        .split(/\s+/)
        .filter((token) => token.length >= 4 && !causalStopWords.has(token)),
    );

  const expectedTokens = tokenize(expected);
  const actualTokens = tokenize(actual);
  if (!expectedTokens.size) return 1;
  const overlap = [...expectedTokens].filter((token) => actualTokens.has(token));
  return overlap.length / expectedTokens.size;
}

function grade(score: number): RcaEvaluationResult["grade"] {
  if (score >= 90) return "excellent";
  if (score >= 75) return "strong";
  if (score >= 55) return "partial";
  return "weak";
}

function dimension(
  key: RcaEvaluationDimension["key"],
  label: string,
  ratio: number,
  maxScore: number,
  detail: string,
): RcaEvaluationDimension {
  return {
    key,
    label,
    score: Math.round(Math.max(0, Math.min(1, ratio)) * maxScore),
    maxScore,
    detail,
  };
}

export function evaluateSeededRca(
  result: OrchestrationResult,
): RcaEvaluationResult | null {
  if (!result.rca) return null;

  const scenario = publicScenarios.find(
    (candidate) => candidate.incidentId === result.rca?.incidentId,
  );
  if (!scenario) return null;

  const expected = scenarioEvaluations.find(
    (candidate) => candidate.scenarioId === scenario.id,
  );
  if (!expected) return null;

  const names = new Map<string, string>([
    ...orgBrainData.services.map((service) => [service.id, service.name] as const),
    ...orgBrainData.deployments.map(
      (deployment) => [deployment.id, `${deployment.id} ${deployment.version}`] as const,
    ),
    ...orgBrainData.commits.map(
      (commit) => [commit.sha, `${commit.sha} ${commit.message}`] as const,
    ),
  ]);
  const corpus = normalizedCorpus(result);

  const dimensions: RcaEvaluationDimension[] = [
    dimension(
      "evidence",
      "Evidence coverage",
      evidenceCoverage(expected.supportingEvidenceIds, result),
      25,
      "Checks whether the investigation surfaced the seeded trace/log evidence expected for this scenario.",
    ),
    dimension(
      "services",
      "Service attribution",
      entityCoverage(expected.expectedServiceIds, corpus, names),
      20,
      "Checks whether the RCA identified the services involved in the failure path.",
    ),
    dimension(
      "deployment",
      "Deployment attribution",
      entityCoverage(expected.expectedDeploymentIds, corpus, names),
      15,
      "Checks whether the correlated rollout was represented in the RCA evidence.",
    ),
    dimension(
      "change",
      "Change attribution",
      entityCoverage(expected.expectedCommitShas, corpus, names),
      20,
      "Checks whether the investigation connected runtime symptoms to the relevant source change.",
    ),
    dimension(
      "causal-alignment",
      "Causal alignment",
      causalAlignment(expected.expectedRootCause, result.rca.rootCause),
      20,
      "Compares the causal concepts in the generated RCA with the hidden scenario contract without exposing its wording.",
    ),
  ];

  const score = dimensions.reduce((sum, item) => sum + item.score, 0);

  return {
    scenarioId: scenario.id,
    incidentId: result.rca.incidentId,
    score,
    maxScore: 100,
    grade: grade(score),
    dimensions,
    evaluatedAt: new Date().toISOString(),
  };
}
