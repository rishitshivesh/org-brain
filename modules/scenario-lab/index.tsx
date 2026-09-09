"use client";

import { Activity, BadgeAlert, DatabaseZap, Play, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/modules/common/page-header";
import { orgBrainData } from "@/lib/org-brain";

const scenarios = [
  {
    id: "claims-worker-regression",
    title: "Kafka consumer regression",
    description: "Inject the seeded claims-worker rollout, trace slowdown, lag spike and related code context.",
    icon: Activity,
    ready: true,
    incidentId: "INC-2409",
    signals: ["logs", "trace", "metrics", "deployment", "commit"],
  },
  {
    id: "database-pool",
    title: "Database pool exhaustion",
    description: "Reserved fixture for the next dataset expansion. The UI is ready, the evidence pack is not fabricated yet.",
    icon: DatabaseZap,
    ready: false,
    signals: ["logs", "metrics", "deployment"],
  },
  {
    id: "retry-storm",
    title: "Downstream retry storm",
    description: "Reserved fixture for dependency and cascading-failure analysis.",
    icon: BadgeAlert,
    ready: false,
    signals: ["trace", "logs", "metrics"],
  },
];

export default function ScenarioLabComponent() {
  const [active, setActive] = useState<string | null>(null);
  const incident = orgBrainData.incidents[0];

  return (
    <div className="min-h-full bg-background">
      <PageHeader
        eyebrow="Deterministic fixtures"
        title="Scenario Lab"
        description="Inject consistent operational evidence for demos and development. The investigator sees logs and traces, not the hidden answer."
        actions={active ? <Button variant="outline" size="sm" onClick={() => setActive(null)}><RotateCcw /> Reset</Button> : null}
      />
      <div className="grid gap-4 p-6 xl:grid-cols-3">
        {scenarios.map(({ description, icon: Icon, id, incidentId, ready, signals, title }) => {
          const injected = active === id;
          return (
            <Card key={id} className={injected ? "border-foreground/30 shadow-none" : "shadow-none"}>
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <span className="flex size-9 items-center justify-center rounded-lg bg-muted"><Icon className="size-4" /></span>
                  <Badge variant={ready ? "secondary" : "outline"}>{ready ? "Seeded" : "Fixture pending"}</Badge>
                </div>
                <CardTitle className="mt-2 text-lg">{title}</CardTitle>
                <CardDescription className="leading-5">{description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-1">
                  {signals.map((signal) => <Badge key={signal} variant="outline" className="font-normal">{signal}</Badge>)}
                </div>
                {injected && incidentId ? (
                  <div className="rounded-lg border bg-muted/30 p-3 text-sm">
                    <p className="font-medium">Injected {incident?.id}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{incident?.title}</p>
                    <Button asChild size="sm" className="mt-3 w-full"><Link href={`/incidents/${incidentId}`}>Open incident</Link></Button>
                  </div>
                ) : (
                  <Button className="w-full" variant={ready ? "default" : "outline"} disabled={!ready} onClick={() => setActive(id)}>
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
