"use client";

import { ArrowRight, Boxes, GitCommitHorizontal, Network, Workflow } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/modules/common/page-header";
import {
  getCommit,
  getDeployment,
  getService,
  getWorkItem,
  orgBrainData,
} from "@/lib/org-brain";

function Node({ label, meta, icon: Icon }: { label: string; meta: string; icon: typeof Boxes }) {
  return (
    <Card className="min-w-[180px] flex-1 shadow-none">
      <CardContent className="p-4">
        <Icon className="mb-3 size-4 text-muted-foreground" />
        <p className="truncate text-sm font-medium">{label}</p>
        <p className="mt-1 truncate text-xs text-muted-foreground">{meta}</p>
      </CardContent>
    </Card>
  );
}

function Chain({ children }: { children: React.ReactNode[] }) {
  return (
    <div className="flex min-w-max items-center gap-2">
      {children.map((child, index) => (
        <div key={index} className="flex items-center gap-2">
          {child}
          {index < children.length - 1 ? <ArrowRight className="size-4 shrink-0 text-muted-foreground" /> : null}
        </div>
      ))}
    </div>
  );
}

export default function GraphComponent() {
  const incident = orgBrainData.incidents[0];
  const deployment = incident ? getDeployment(incident.correlatedDeploymentIds?.[0]) : undefined;
  const commit = deployment ? getCommit(deployment.commitShas[0]) : undefined;
  const workItem = commit ? getWorkItem(commit.workItemIds?.[0]) : undefined;

  return (
    <div className="min-h-full bg-background">
      <PageHeader
        eyebrow="Org map"
        title="Graph"
        description="Scoped relationship views for the questions engineers actually ask. Expand context deliberately instead of throwing the whole organization onto one canvas."
      />
      <div className="p-6">
        <Tabs defaultValue="services" className="space-y-4">
          <TabsList>
            <TabsTrigger value="services">Service flow</TabsTrigger>
            <TabsTrigger value="work">Work impact</TabsTrigger>
            <TabsTrigger value="incident">Incident chain</TabsTrigger>
          </TabsList>

          <TabsContent value="services">
            <Card className="overflow-hidden shadow-none">
              <CardContent className="overflow-x-auto p-6">
                <Chain>
                  {["SVC-CLAIMS-WEB", "SVC-CLAIMS-API", "SVC-CLAIMS-WORKER", "SVC-DOCUMENT"].map((id) => {
                    const service = getService(id);
                    return <Node key={id} label={service?.name ?? id} meta={service?.type ?? "service"} icon={Boxes} />;
                  })}
                </Chain>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="work">
            <Card className="overflow-hidden shadow-none">
              <CardContent className="overflow-x-auto p-6">
                <Chain>
                  <Node label="ADO-4231" meta="Partial OPD settlement" icon={Workflow} />
                  <Node label="claims-api" meta="settlement lifecycle" icon={Boxes} />
                  <Node label="rules-engine" meta="eligibility rules" icon={Boxes} />
                </Chain>
                <div className="mt-5 flex items-center gap-2 text-sm text-muted-foreground">
                  <Badge variant="destructive">Conflict</Badge>
                  ADO-3988 requires all-or-nothing settlement semantics.
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="incident">
            <Card className="overflow-hidden shadow-none">
              <CardContent className="overflow-x-auto p-6">
                <Chain>
                  <Node label={incident?.id ?? "Incident"} meta={incident?.title ?? "No incident"} icon={Network} />
                  <Node label={deployment?.version ?? "Deployment"} meta={deployment?.id ?? "Not correlated"} icon={GitCommitHorizontal} />
                  <Node label={commit?.sha ?? "Commit"} meta={commit?.message ?? "No commit"} icon={GitCommitHorizontal} />
                  <Node label={workItem?.id ?? "Work item"} meta={workItem?.title ?? "No linked work"} icon={Workflow} />
                </Chain>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
