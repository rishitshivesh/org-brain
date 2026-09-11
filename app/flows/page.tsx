import {
  ArrowRight,
  FileLock2,
  GitFork,
  RadioTower,
  ShieldCheck,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getService, orgBrainData } from "@/lib/org-brain";
import { MetricCard } from "@/modules/common/metric-card";
import { PageHeader } from "@/modules/common/page-header";
import { SectionLabel } from "@/modules/common/section-label";

interface FlowDefinition {
  title: string;
  description: string;
  serviceIds: string[];
  note: string;
}

const flows: FlowDefinition[] = [
  {
    title: "Public claims request",
    description:
      "The synchronous path from internet security controls to claims business services.",
    serviceIds: [
      "SVC-WAF",
      "SVC-NGINX",
      "SVC-CLAIMS-WEB",
      "SVC-CLAIMS-API",
      "SVC-IDENTITY",
      "SVC-RULES",
      "SVC-DOCUMENT",
    ],
    note: "WAF and NGINX are explicit engineering dependencies, not invisible infrastructure outside the graph.",
  },
  {
    title: "Asynchronous claim processing",
    description:
      "Accepted submissions cross the event boundary before worker-side validation and downstream processing.",
    serviceIds: [
      "SVC-CLAIMS-API",
      "SVC-KAFKA",
      "SVC-CLAIMS-WORKER",
      "SVC-DOCUMENT",
    ],
    note: "Kafka separates request acceptance from async processing; worker lag becomes an observable operational signal.",
  },
  {
    title: "Audit telemetry",
    description:
      "Business requests publish append-only audit events without synchronously waiting for the audit store.",
    serviceIds: ["SVC-CLAIMS-API", "SVC-KAFKA", "SVC-AUDIT"],
    note: "ADR-036 keeps audit persistence asynchronous and replayable so compliance telemetry cannot inflate claims request latency.",
  },
  {
    title: "Identity and coordination",
    description:
      "Authentication context is resolved by identity-service while Redis supports short-lived coordination and throttling state.",
    serviceIds: [
      "SVC-CLAIMS-WEB",
      "SVC-IDENTITY",
      "SVC-CLAIMS-API",
      "SVC-REDIS",
    ],
    note: "This path gives dependency analysis enough structure to distinguish auth latency from business-service or cache pressure.",
  },
];

function dependencyBetween(from: string, to: string) {
  return orgBrainData.serviceDependencies.find(
    (dependency) => dependency.from === from && dependency.to === to,
  );
}

export default function FlowsPage() {
  return (
    <div className="min-h-full bg-background/40">
      <PageHeader
        eyebrow="System paths"
        title="Engineering flows"
        description="Follow requests and events across WAF, NGINX, application services, identity, Redis, Kafka, workers and audit telemetry. These same explicit edges power blast-radius analysis and incident context."
      />

      <div className="mx-auto w-full max-w-[1680px] space-y-7 p-5 sm:p-6">
        <div className="portal-grid grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            icon={GitFork}
            label="Explicit dependencies"
            value={orgBrainData.serviceDependencies.length}
            hint="Protocol-aware service edges"
          />
          <MetricCard
            icon={ShieldCheck}
            label="Edge controls"
            value="WAF + NGINX"
            hint="Security and reverse proxy layers"
          />
          <MetricCard
            icon={RadioTower}
            label="Event backbone"
            value="Kafka"
            hint="Claims and audit event flows"
          />
          <MetricCard
            icon={FileLock2}
            label="Architecture rules"
            value={orgBrainData.architectureDecisions.length}
            hint="Recorded constraints and decisions"
          />
        </div>

        <div className="space-y-3">
          <SectionLabel aside="Same graph used by Dependency Agent">
            End-to-end paths
          </SectionLabel>
          <div className="space-y-4">
            {flows.map((flow) => (
              <Card
                key={flow.title}
                className="portal-card-hover border-foreground/10 bg-card/82 shadow-none backdrop-blur-sm"
              >
                <CardHeader className="gap-1">
                  <CardTitle className="text-base">{flow.title}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {flow.description}
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="portal-scroll-x flex items-stretch gap-2 overflow-x-auto pb-2">
                    {flow.serviceIds.map((serviceId, index) => {
                      const service = getService(serviceId);
                      const nextId = flow.serviceIds[index + 1];
                      const edge = nextId
                        ? dependencyBetween(serviceId, nextId)
                        : undefined;

                      return (
                        <div key={`${flow.title}-${serviceId}`} className="flex items-center gap-2">
                          <div className="min-w-[190px] rounded-xl border bg-background/55 p-3">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="text-sm font-medium">
                                  {service?.name ?? serviceId}
                                </p>
                                <p className="mt-1 text-xs text-muted-foreground">
                                  {service?.type ?? "service"}
                                </p>
                              </div>
                              {service?.runtime ? (
                                <Badge variant="outline" className="font-normal">
                                  {service.runtime}
                                </Badge>
                              ) : null}
                            </div>
                            {service?.description ? (
                              <p className="mt-3 text-xs leading-5 text-muted-foreground">
                                {service.description}
                              </p>
                            ) : null}
                          </div>

                          {nextId ? (
                            <div className="flex min-w-20 flex-col items-center gap-1 text-[10px] text-muted-foreground">
                              <span>{edge?.protocol ?? "flow"}</span>
                              <ArrowRight className="size-4" />
                              <span className="max-w-24 truncate">
                                {edge?.topic ?? edge?.endpoint ?? ""}
                              </span>
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>

                  <p className="rounded-lg border bg-muted/20 p-3 text-xs leading-5 text-muted-foreground">
                    {flow.note}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
