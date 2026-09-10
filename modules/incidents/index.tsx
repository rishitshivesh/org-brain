import {
  Activity,
  Clock3,
  GitCommitHorizontal,
  RadioTower,
  ShieldAlert,
  Siren,
} from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricCard } from "@/modules/common/metric-card";
import { PageHeader } from "@/modules/common/page-header";
import { SectionLabel } from "@/modules/common/section-label";
import {
  getIncidentDeployments,
  getService,
  orgBrainData,
} from "@/lib/org-brain";

export default function IncidentsComponent() {
  const activeCount = orgBrainData.incidents.filter(
    (incident) => !["Resolved", "Closed"].includes(incident.status),
  ).length;
  const affectedServices = new Set(
    orgBrainData.incidents.flatMap((incident) => incident.affectedServiceIds),
  ).size;
  const correlatedDeployments = new Set(
    orgBrainData.incidents.flatMap(
      (incident) => incident.correlatedDeploymentIds ?? [],
    ),
  ).size;

  return (
    <div className="min-h-full bg-background/40">
      <PageHeader
        eyebrow="Production intelligence"
        title="Incidents"
        description="Operational issues connected to affected services, traces, deployments and engineering work."
      />

      <div className="mx-auto w-full max-w-[1680px] space-y-6 p-5 sm:p-6">
        <div className="space-y-3">
          <SectionLabel aside="Live from deterministic fixtures">
            Operations pulse
          </SectionLabel>
          <div className="portal-grid grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              icon={Siren}
              label="Incidents"
              value={orgBrainData.incidents.length}
              hint="Current dataset"
            />
            <MetricCard
              icon={ShieldAlert}
              label="Open investigations"
              value={activeCount}
              hint="Not resolved or closed"
            />
            <MetricCard
              icon={Activity}
              label="Affected services"
              value={affectedServices}
              hint="Unique services"
            />
            <MetricCard
              icon={GitCommitHorizontal}
              label="Correlated deployments"
              value={correlatedDeployments}
              hint="Deployment-linked incidents"
            />
          </div>
        </div>

        <div className="space-y-3">
          <SectionLabel aside="Select an incident to inspect evidence">
            Incident stream
          </SectionLabel>
          <div className="portal-grid grid gap-4 xl:grid-cols-2">
            {orgBrainData.incidents.map((incident) => {
              const deployments = getIncidentDeployments(incident);
              const primaryDeployment = deployments[0];

              return (
                <Link
                  key={incident.id}
                  href={`/incidents/${incident.id}`}
                  className="group outline-none"
                >
                  <Card className="portal-card-hover h-full border-foreground/10 bg-card/82 shadow-none backdrop-blur-sm group-focus-visible:ring-2 group-focus-visible:ring-ring">
                    <CardHeader className="gap-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          variant={
                            incident.severity === "SEV1"
                              ? "destructive"
                              : "outline"
                          }
                        >
                          {incident.severity}
                        </Badge>
                        <Badge variant="secondary" className="gap-1.5">
                          <span className="size-1.5 rounded-full bg-current opacity-60" />
                          {incident.status}
                        </Badge>
                        <span className="ml-auto font-mono text-xs text-muted-foreground">
                          {incident.id}
                        </span>
                      </div>
                      <CardTitle className="text-lg tracking-tight transition-colors group-hover:text-foreground">
                        {incident.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex flex-wrap gap-2">
                        {incident.affectedServiceIds.map((id) => (
                          <Badge
                            key={id}
                            variant="secondary"
                            className="font-normal"
                          >
                            <Activity className="size-3" />{" "}
                            {getService(id)?.name ?? id}
                          </Badge>
                        ))}
                      </div>

                      <div className="grid gap-3 rounded-xl border bg-muted/20 p-3 text-xs text-muted-foreground sm:grid-cols-3">
                        <div className="flex min-w-0 items-center gap-2">
                          <Clock3 className="size-3.5 shrink-0" />
                          <span className="truncate">
                            {new Date(incident.startedAt).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex min-w-0 items-center gap-2">
                          <GitCommitHorizontal className="size-3.5 shrink-0" />
                          <span className="truncate">
                            {primaryDeployment?.version ?? "No deployment"}
                          </span>
                        </div>
                        <div className="flex min-w-0 items-center gap-2">
                          <RadioTower className="size-3.5 shrink-0" />
                          <span className="truncate">
                            {incident.traceIds?.length ?? 0} trace
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}

            {!orgBrainData.incidents.length ? (
              <Card className="col-span-full border-dashed shadow-none">
                <CardContent className="flex min-h-52 flex-col items-center justify-center text-center">
                  <Siren className="mb-3 size-6 text-muted-foreground" />
                  <p className="font-medium">
                    No incidents in the current dataset
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Scenario Lab can inject deterministic fixtures later.
                  </p>
                </CardContent>
              </Card>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
