import {
  BadgeCheck,
  Beaker,
  BrainCircuit,
  CheckCircle2,
  Gauge,
  ShieldCheck,
} from "lucide-react";

import { runOrchestrator } from "@/agents";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { publicScenarios } from "@/data/scenarios/public";
import { evaluateSeededRca } from "@/lib/scenario-evaluator";
import { MetricCard } from "@/modules/common/metric-card";
import { PageHeader } from "@/modules/common/page-header";
import { SectionLabel } from "@/modules/common/section-label";
import { orgBrainProviders } from "@/providers";
import type { RcaEvaluationResult } from "@/types/evaluation";

interface EvaluationRun {
  scenario: (typeof publicScenarios)[number];
  evaluation: RcaEvaluationResult | null;
  rootCause: string | null;
  confidence: number | null;
  agents: string[];
}

function scoreLabel(score: number) {
  if (score >= 90) return "Excellent";
  if (score >= 75) return "Strong";
  if (score >= 55) return "Partial";
  return "Needs work";
}

async function runEvaluationSuite(): Promise<EvaluationRun[]> {
  return Promise.all(
    publicScenarios
      .filter((scenario) => scenario.ready && scenario.incidentId)
      .map(async (scenario) => {
        const result = await runOrchestrator(
          orgBrainProviders,
          scenario.prompt,
        );
        return {
          scenario,
          evaluation: evaluateSeededRca(result),
          rootCause: result.rca?.rootCause ?? null,
          confidence: result.rca?.confidence ?? null,
          agents: result.plan.agents,
        };
      }),
  );
}

export default async function EvaluationsPage() {
  const runs = await runEvaluationSuite();
  const completed = runs.filter((run) => run.evaluation);
  const averageScore = completed.length
    ? Math.round(
        completed.reduce((sum, run) => sum + (run.evaluation?.score ?? 0), 0) /
          completed.length,
      )
    : 0;
  const strongRuns = completed.filter(
    (run) => (run.evaluation?.score ?? 0) >= 75,
  ).length;
  const dimensions = completed.flatMap(
    (run) => run.evaluation?.dimensions ?? [],
  );
  const averageCausalScore = dimensions.filter(
    (dimension) => dimension.key === "causal-alignment",
  );
  const causalPercent = averageCausalScore.length
    ? Math.round(
        (averageCausalScore.reduce(
          (sum, dimension) => sum + dimension.score / dimension.maxScore,
          0,
        ) /
          averageCausalScore.length) *
          100,
      )
    : 0;

  return (
    <div className="min-h-full bg-background/40">
      <PageHeader
        eyebrow="Hidden-truth evaluation"
        title="RCA Evaluation Lab"
        description="Run every seeded incident through the same bounded orchestrator and score the result against server-only evaluation contracts. The browser sees rubric scores, never the hidden answer key."
      />

      <div className="mx-auto w-full max-w-[1680px] space-y-7 p-5 sm:p-6">
        <div className="space-y-3">
          <SectionLabel aside="Deterministic regression suite">
            Evaluation pulse
          </SectionLabel>
          <div className="portal-grid grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              icon={Beaker}
              label="Scenarios evaluated"
              value={completed.length}
              hint="Independent failure modes"
            />
            <MetricCard
              icon={Gauge}
              label="Average score"
              value={`${averageScore}/100`}
              hint="Across the hidden rubric"
            />
            <MetricCard
              icon={BadgeCheck}
              label="Strong or better"
              value={`${strongRuns}/${completed.length}`}
              hint="75+ evaluation score"
            />
            <MetricCard
              icon={BrainCircuit}
              label="Causal alignment"
              value={`${causalPercent}%`}
              hint="Root-cause concept coverage"
            />
          </div>
        </div>

        <Card className="border-emerald-500/20 bg-emerald-500/[0.035] shadow-none">
          <CardContent className="flex gap-3 p-4 text-sm leading-6">
            <ShieldCheck className="mt-0.5 size-5 shrink-0 text-emerald-600" />
            <div>
              <p className="font-medium">Evaluation truth stays server-side</p>
              <p className="text-muted-foreground">
                The suite compares generated RCA evidence and causal concepts
                against private scenario contracts inside the server component.
                Only aggregate dimension scores are rendered. Runtime agents and
                the browser never receive the expected root cause.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-3">
          <SectionLabel aside="Same orchestrator, different incident shapes">
            Scenario results
          </SectionLabel>
          <div className="portal-grid grid gap-4 xl:grid-cols-3">
            {runs.map(
              ({ scenario, evaluation, rootCause, confidence, agents }) => (
                <Card
                  key={scenario.id}
                  className="portal-card-hover overflow-hidden border-foreground/10 bg-card/82 shadow-none backdrop-blur-sm"
                >
                  <CardHeader className="border-b bg-muted/15">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                          {scenario.incidentId}
                        </p>
                        <CardTitle className="mt-1 text-base leading-6">
                          {scenario.title}
                        </CardTitle>
                      </div>
                      {evaluation ? (
                        <div className="shrink-0 text-right">
                          <p className="text-2xl font-semibold tracking-tight">
                            {evaluation.score}
                          </p>
                          <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                            / 100
                          </p>
                        </div>
                      ) : null}
                    </div>
                    {evaluation ? (
                      <Badge
                        variant="secondary"
                        className="mt-2 w-fit font-normal"
                      >
                        <CheckCircle2 className="size-3" />
                        {scoreLabel(evaluation.score)}
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="mt-2 w-fit font-normal"
                      >
                        No score
                      </Badge>
                    )}
                  </CardHeader>

                  <CardContent className="space-y-5 p-4">
                    <div>
                      <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                        RCA produced
                      </p>
                      <p className="mt-2 text-sm leading-6">
                        {rootCause ??
                          "No RCA was synthesized for this scenario."}
                      </p>
                      {confidence !== null ? (
                        <p className="mt-2 text-xs text-muted-foreground">
                          Agent confidence: {confidence}%
                        </p>
                      ) : null}
                    </div>

                    <div>
                      <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                        Specialists
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {agents.map((agent) => (
                          <Badge
                            key={agent}
                            variant="outline"
                            className="font-normal capitalize"
                          >
                            {agent}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {evaluation ? (
                      <div className="space-y-3">
                        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                          Rubric
                        </p>
                        {evaluation.dimensions.map((dimension) => {
                          const percent = Math.round(
                            (dimension.score / dimension.maxScore) * 100,
                          );
                          return (
                            <div key={dimension.key} className="space-y-1.5">
                              <div className="flex items-center justify-between gap-3 text-xs">
                                <span className="font-medium">
                                  {dimension.label}
                                </span>
                                <span className="font-mono text-muted-foreground">
                                  {dimension.score}/{dimension.maxScore}
                                </span>
                              </div>
                              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                                <div
                                  className="h-full rounded-full bg-foreground/70 transition-[width] duration-500"
                                  style={{ width: `${percent}%` }}
                                />
                              </div>
                              <p className="text-[11px] leading-4 text-muted-foreground">
                                {dimension.detail}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    ) : null}
                  </CardContent>
                </Card>
              ),
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
