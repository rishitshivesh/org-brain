import {
  Box,
  Boxes,
  GitFork,
  Layers3,
  Network,
  RadioTower,
  Users,
} from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricCard } from "@/modules/common/metric-card";
import { PageHeader } from "@/modules/common/page-header";
import { SectionLabel } from "@/modules/common/section-label";
import {
  getRepository,
  getServiceDependencies,
  getServiceIncidents,
  getServiceWorkItems,
  getTeam,
  orgBrainData,
} from "@/lib/org-brain";

export default function ServicesComponent() {
  const teams = new Set(
    orgBrainData.services.map((service) => service.ownerTeamId),
  ).size;
  const dependencies = orgBrainData.serviceDependencies.length;
  const activeIncidents = orgBrainData.incidents.filter(
    (incident) => !["Resolved", "Closed"].includes(incident.status),
  ).length;

  return (
    <div className="min-h-full bg-background/40">
      <PageHeader
        eyebrow="Service catalog"
        title="Services"
        description="Ownership, repositories, dependencies and current engineering context for each service."
      />

      <div className="mx-auto w-full max-w-[1680px] space-y-6 p-5 sm:p-6">
        <div className="space-y-3">
          <SectionLabel aside="Resolved from the organization graph">
            Platform pulse
          </SectionLabel>
          <div className="portal-grid grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              icon={Boxes}
              label="Services"
              value={orgBrainData.services.length}
              hint="Catalogued runtime units"
            />
            <MetricCard
              icon={Users}
              label="Owning teams"
              value={teams}
              hint="Unique owners"
            />
            <MetricCard
              icon={Network}
              label="Dependency links"
              value={dependencies}
              hint="Explicit service edges"
            />
            <MetricCard
              icon={RadioTower}
              label="Open incidents"
              value={activeIncidents}
              hint="Across the catalog"
            />
          </div>
        </div>

        <div className="space-y-3">
          <SectionLabel aside="Open a service for work, deploy and incident context">
            Service inventory
          </SectionLabel>
          <div className="portal-grid grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {orgBrainData.services.map((service) => {
              const repository = getRepository(service.repositoryId);
              const team = getTeam(service.ownerTeamId);
              const serviceDependencies = getServiceDependencies(service.id);
              const incidents = getServiceIncidents(service.id);
              const work = getServiceWorkItems(service.id);
              const outgoing = serviceDependencies.filter(
                (dependency) => dependency.from === service.id,
              ).length;
              const incoming = serviceDependencies.filter(
                (dependency) => dependency.to === service.id,
              ).length;

              return (
                <Link
                  key={service.id}
                  href={`/services/${service.id}`}
                  className="group outline-none"
                >
                  <Card className="portal-card-hover h-full border-foreground/10 bg-card/82 shadow-none backdrop-blur-sm group-focus-visible:ring-2 group-focus-visible:ring-ring">
                    <CardHeader>
                      <div className="flex items-center justify-between gap-3">
                        <span className="flex size-10 items-center justify-center rounded-xl border bg-muted/60 transition-transform duration-300 group-hover:scale-105">
                          <Box className="size-4" />
                        </span>
                        <Badge
                          variant="outline"
                          className="font-normal capitalize"
                        >
                          {service.type}
                        </Badge>
                      </div>
                      <div className="mt-2 min-w-0">
                        <p className="font-mono text-[11px] text-muted-foreground">
                          {service.id}
                        </p>
                        <CardTitle className="mt-1 truncate text-lg tracking-tight">
                          {service.name}
                        </CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm">
                      <div className="grid grid-cols-2 gap-3 rounded-xl border bg-muted/20 p-3 text-muted-foreground">
                        <div className="min-w-0">
                          <p className="text-[11px] uppercase tracking-wide">
                            Owner
                          </p>
                          <p className="mt-1 truncate font-medium text-foreground">
                            {team?.name ?? service.ownerTeamId}
                          </p>
                        </div>
                        <div className="min-w-0">
                          <p className="text-[11px] uppercase tracking-wide">
                            Repository
                          </p>
                          <p className="mt-1 truncate font-medium text-foreground">
                            {repository?.name ?? "Not linked"}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1.5">
                          <GitFork className="size-3" /> {incoming} in /{" "}
                          {outgoing} out
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <Layers3 className="size-3" /> {work.length} work
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <RadioTower className="size-3" /> {incidents.length}{" "}
                          incidents
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
