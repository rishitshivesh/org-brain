"use client";

import {
  ArrowRight,
  Boxes,
  GitCommitHorizontal,
  Network,
  Workflow,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/modules/common/page-header";
import { SectionLabel } from "@/modules/common/section-label";
import {
  getCommit,
  getDeployment,
  getService,
  getWorkItem,
  orgBrainData,
} from "@/lib/org-brain";

function Node({
  label,
  meta,
  icon: Icon,
}: {
  label: string;
  meta: string;
  icon: typeof Boxes;
}) {
  return (
    <Card className="portal-card-hover min-w-[190px] flex-1 border-foreground/10 bg-card/88 shadow-none backdrop-blur-sm">
      <CardContent className="p-4">
        <span className="mb-3 flex size-8 items-center justify-center rounded-lg border bg-muted/40">
          <Icon className="size-4 text-muted-foreground" />
        </span>
        <p className="truncate text-sm font-medium">{label}</p>
        <p className="mt-1 truncate text-xs text-muted-foreground">{meta}</p>
      </CardContent>
    </Card>
  );
}

function Chain({ children }: { children: React.ReactNode[] }) {
  return (
    <div className="portal-grid flex min-w-max items-center gap-2 py-1">
      {children.map((child, index) => (
        <div key={index} className="flex items-center gap-2">
          {child}
          {index < children.length - 1 ? (
            <div className="flex items-center gap-1">
              <span className="h-px w-4 bg-border sm:w-7" />
              <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function GraphViewport({ children }: { children: React.ReactNode }) {
  return (
    <Card className="overflow-hidden border-foreground/10 bg-card/70 shadow-none backdrop-blur-sm">
      <div className="border-b bg-muted/20 px-4 py-2 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
        Scroll horizontally to inspect the relationship chain
      </div>
      <CardContent className="portal-scroll-x overflow-x-auto p-5 sm:p-6">
        {children}
      </CardContent>
    </Card>
  );
}

export default function GraphComponent() {
  const incident = orgBrainData.incidents[0];
  const deployment = incident ? getDeployment(incident.correlatedDeploymentIds?.[0]) : undefined;
  const commit = deployment ? getCommit(deployment.commitShas[0]) : undefined;
  const workItem = commit ? getWorkItem(commit.workItemIds?.[0]) : undefined;

  return (
    <div className="min-h-full bg-background/40">
      <PageHeader
        eyebrow="Org map"
        title="Graph"
        description="Scoped relationship views for the questions engineers actually ask. Expand context deliberately instead of throwing the whole organization onto one canvas."
      />

      <div className="mx-auto w-full max-w-[1680px] space-y-4 p-5 sm:p-6">
        <SectionLabel aside={`${orgBrainData.serviceDependencies.length} explicit dependency edges`}>
          Relationship explorer
        </SectionLabel>

        <Tabs defaultValue="services" className="space-y-4">
          <div className="portal-scroll-x overflow-x-auto pb-1">
            <TabsList className="w-max">
              <TabsTrigger value="services">Service flow</TabsTrigger>
              <TabsTrigger value="work">Work impact</TabsTrigger>
              <TabsTrigger value="incident">Incident chain</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="services" className="animate-in fade-in slide-in-from-bottom-1 duration-300">
            <GraphViewport>
              <Chain>
                {["SVC-CLAIMS-WEB", "SVC-CLAIMS-API", "SVC-CLAIMS-WORKER", "SVC-DOCUMENT"].map((id) => {
                  const service = getService(id);
                  return (
                    <Node
                      key={id}
                      label={service?.name ?? id}
                      meta={service?.type ?? "service"}
                      icon={Boxes}
                    />
                  );
                })}
              </Chain>
            </GraphViewport>
          </TabsContent>

          <TabsContent value="work" className="animate-in fade-in slide-in-from-bottom-1 duration-300">
            <GraphViewport>
              <Chain>
                <Node label="ADO-4231" meta="Partial OPD settlement" icon={Workflow} />
                <Node label="claims-api" meta="settlement lifecycle" icon={Boxes} />
                <Node label="rules-engine" meta="eligibility rules" icon={Boxes} />
              </Chain>
              <div className="mt-5 flex max-w-2xl items-start gap-2 rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-sm text-muted-foreground">
                <Badge variant="destructive" className="shrink-0">Conflict</Badge>
                <span>ADO-3988 requires all-or-nothing settlement semantics.</span>
              </div>
            </GraphViewport>
          </TabsContent>

          <TabsContent value="incident" className="animate-in fade-in slide-in-from-bottom-1 duration-300">
            <GraphViewport>
              <Chain>
                <Node label={incident?.id ?? "Incident"} meta={incident?.title ?? "No incident"} icon={Network} />
                <Node label={deployment?.version ?? "Deployment"} meta={deployment?.id ?? "Not correlated"} icon={GitCommitHorizontal} />
                <Node label={commit?.sha ?? "Commit"} meta={commit?.message ?? "No commit"} icon={GitCommitHorizontal} />
                <Node label={workItem?.id ?? "Work item"} meta={workItem?.title ?? "No linked work"} icon={Workflow} />
              </Chain>
            </GraphViewport>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
