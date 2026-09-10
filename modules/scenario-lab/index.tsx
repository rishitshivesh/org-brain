"use client";

import { Activity, BadgeAlert, DatabaseZap, Play, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { publicScenarios } from "@/data/scenarios/public";
import { orgBrainData } from "@/lib/org-brain";
import { PageHeader } from "@/modules/common/page-header";

const scenarioIcons = {
  latency: Activity,
  availability: DatabaseZap,
  dependency: BadgeAlert,
};

export default function ScenarioLabComponent() {
  const [active, setActive] = useState<string | null>(null);

  return (
    <div className="min-h-full bg-background">
      <PageHeader
        eyebrow="Deterministic fixtures"
        title="Scenario Lab"
        description="Inject consistent operational evidence for demos and development. Public scenario metadata is separated from the private evaluation answer key."
        actions={
          active ? (
            <Button variant="outline" size="sm" onClick={() => setActive(null)}>
              <RotateCcw /> Reset
            </Button>
          ) : null
        }
      />
      <div className="grid gap-4 p-6 xl:grid-cols-3">
        {publicScenarios.map(({ category, description, id, incidentId, ready, signals, title }) => {
          const Icon = scenarioIcons[category];
          const injected = active === id;
          const incident = incidentId
            ? orgBrainData.incidents.find((item) => item.id === incidentId)
            : undefined;

          return (
            <Card
              key={id}
              className={injected ? "border-foreground/30 shadow-none" : "shadow-none"}
            >
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <span className="flex size-9 items-center justify-center rounded-lg bg-muted">
                    <Icon className="size-4" />
                  </span>
                  <Badge variant={ready ? "secondary" : "outline"}>
                    {ready ? "Seeded" : "Fixture pending"}
                  </Badge>
                </div>
                <CardTitle className="mt-2 text-lg">{title}</CardTitle>
                <CardDescription className="leading-5">{description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-1">
                  {signals.map((signal) => (
                    <Badge key={signal} variant="outline" className="font-normal">
                      {signal}
                    </Badge>
                  ))}
                </div>
                {injected && incidentId ? (
                  <div className="rounded-lg border bg-muted/30 p-3 text-sm">
                    <p className="font-medium">Injected {incident?.id}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{incident?.title}</p>
                    <p className="mt-2 text-xs leading-5 text-muted-foreground">
                      Only observable evidence is loaded into the investigation surface. The scenario evaluation remains outside the client path.
                    </p>
                    <Button
                      render={<Link href={`/incidents/${incidentId}`} />}
                      size="sm"
                      className="mt-3 w-full"
                    >
                      Open incident
                    </Button>
                  </div>
                ) : (
                  <Button
                    className="w-full"
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
        })}
      </div>
    </div>
  );
}
