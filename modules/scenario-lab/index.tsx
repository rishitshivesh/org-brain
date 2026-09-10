"use client";

import {
  Activity,
  BadgeAlert,
  CheckCircle2,
  DatabaseZap,
  Play,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { publicScenarios } from "@/data/scenarios/public";
import { orgBrainData } from "@/lib/org-brain";
import { MetricCard } from "@/modules/common/metric-card";
import { PageHeader } from "@/modules/common/page-header";
import { SectionLabel } from "@/modules/common/section-label";

const scenarioIcons = {
  latency: Activity,
  availability: DatabaseZap,
  dependency: BadgeAlert,
};

export default function ScenarioLabComponent() {
  const [active, setActive] = useState<string | null>(null);
  const readyCount = publicScenarios.filter(
    (scenario) => scenario.ready,
  ).length;
  const signalCount = new Set(
    publicScenarios.flatMap((scenario) => scenario.signals),
  ).size;

  return (
    <div className="min-h-full bg-background/40">
      <PageHeader
        eyebrow="Deterministic fixtures"
        title="Scenario Lab"
        description="Inject consistent operational evidence for demos and development. Public scenario metadata is separated from the private evaluation answer key."
        actions={
          active ? (
            <Button
              variant="outline"
              size="sm"
              className="bg-background/70 shadow-sm transition-transform active:scale-95"
              onClick={() => setActive(null)}
            >
              <RotateCcw /> Reset scenario
            </Button>
          ) : null
        }
      />

      <div className="mx-auto w-full max-w-[1680px] space-y-6 p-5 sm:p-6">
        <div className="space-y-3">
          <SectionLabel aside="Safe to demo repeatedly">
            Fixture readiness
          </SectionLabel>
          <div className="portal-grid grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              icon={Sparkles}
              label="Scenarios"
              value={publicScenarios.length}
              hint="Defined fixtures"
            />
            <MetricCard
              icon={CheckCircle2}
              label="Ready to inject"
              value={readyCount}
              hint="Complete deterministic evidence"
            />
            <MetricCard
              icon={Activity}
              label="Signal types"
              value={signalCount}
              hint="Logs, traces, metrics and changes"
            />
            <MetricCard
              icon={BadgeAlert}
              label="Active fixture"
              value={active ? "1" : "0"}
              hint={active ? "Injected in this session" : "No active scenario"}
            />
          </div>
        </div>

        <div className="space-y-3">
          <SectionLabel aside="The root cause remains hidden from the client">
            Scenario catalogue
          </SectionLabel>
          <div className="portal-grid grid gap-4 xl:grid-cols-3">
            {publicScenarios.map(
              ({
                category,
                description,
                id,
                incidentId,
                ready,
                signals,
                title,
              }) => {
                const Icon = scenarioIcons[category];
                const injected = active === id;
                const incident = incidentId
                  ? orgBrainData.incidents.find(
                      (item) => item.id === incidentId,
                    )
                  : undefined;

                return (
                  <Card
                    key={id}
                    className={
                      injected
                        ? "portal-card-hover border-foreground/25 bg-card/95 shadow-lg shadow-foreground/[0.035]"
                        : "portal-card-hover border-foreground/10 bg-card/78 shadow-none backdrop-blur-sm"
                    }
                  >
                    <CardHeader>
                      <div className="flex items-center justify-between gap-3">
                        <span
                          className={
                            injected
                              ? "flex size-10 items-center justify-center rounded-xl bg-foreground text-background shadow-sm transition-all duration-300"
                              : "flex size-10 items-center justify-center rounded-xl border bg-muted/50 transition-all duration-300"
                          }
                        >
                          <Icon className="size-4" />
                        </span>
                        <Badge
                          variant={ready ? "secondary" : "outline"}
                          className="font-normal"
                        >
                          {injected
                            ? "Injected"
                            : ready
                              ? "Seeded"
                              : "Fixture pending"}
                        </Badge>
                      </div>
                      <CardTitle className="mt-2 text-lg tracking-tight">
                        {title}
                      </CardTitle>
                      <CardDescription className="leading-5">
                        {description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex flex-wrap gap-1.5">
                        {signals.map((signal) => (
                          <Badge
                            key={signal}
                            variant="outline"
                            className="font-normal"
                          >
                            {signal}
                          </Badge>
                        ))}
                      </div>

                      {injected && incidentId ? (
                        <div className="animate-in fade-in slide-in-from-bottom-2 rounded-xl border bg-muted/25 p-3 text-sm duration-300">
                          <div className="flex items-center gap-2">
                            <span className="relative flex size-2">
                              <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-500/40" />
                              <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
                            </span>
                            <p className="font-medium">
                              Injected {incident?.id}
                            </p>
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {incident?.title}
                          </p>
                          <p className="mt-2 text-xs leading-5 text-muted-foreground">
                            Observable evidence is now available to the
                            investigation surface. The evaluation answer key
                            remains isolated.
                          </p>
                          <Button
                            render={
                              <Link
                                href={`/incidents/${incidentId}`}
                                prefetch
                              />
                            }
                            size="sm"
                            className="mt-3 w-full transition-transform active:scale-[0.98]"
                          >
                            Open incident
                          </Button>
                        </div>
                      ) : (
                        <Button
                          className="w-full transition-transform active:scale-[0.98]"
                          variant={ready ? "default" : "outline"}
                          disabled={!ready}
                          onClick={() => setActive(id)}
                        >
                          <Play /> Inject scenario
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              },
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
