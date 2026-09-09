import {
  ArrowLeft,
  Clock3,
  Code2,
  Gauge,
  GitCommitHorizontal,
  RadioTower,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/modules/common/page-header";
import {
  getDeploymentCommits,
  getIncident,
  getIncidentDeployments,
  getIncidentTraces,
  getService,
  orgBrainData,
} from "@/lib/org-brain";

export default async function IncidentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const incident = getIncident(id);
  if (!incident) notFound();

  const traces = getIncidentTraces(incident);
  const deployments = getIncidentDeployments(incident);
  const commits = deployments.flatMap(getDeploymentCommits);
  const logs = orgBrainData.logs.filter((log) => traces.some((trace) => trace.id === log.traceId));
  const metrics = orgBrainData.metrics.filter((metric) =>
    incident.affectedServiceIds.includes(metric.serviceId),
  );
  const primaryTrace = traces[0];
  const maxDuration = primaryTrace?.durationMs ?? 1;

  return (
    <div className="min-h-full bg-background">
      <PageHeader
        eyebrow={`${incident.severity} · ${incident.id}`}
        title={incident.title}
        description={`Started ${new Date(incident.startedAt).toLocaleString()} · ${incident.status}`}
        actions={
          <Button render={<Link href="/incidents" />} variant="outline" size="sm">
            <ArrowLeft /> Incidents
          </Button>
        }
      />

      <div className="grid gap-5 p-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-5">
          <Card className="shadow-none">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base"><RadioTower className="size-4" /> Trace path</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {primaryTrace?.spans.map((span) => {
                const service = getService(span.serviceId);
                const width = Math.max(8, Math.round((span.durationMs / maxDuration) * 100));
                return (
                  <div key={span.id} className="grid grid-cols-[150px_minmax(0,1fr)_70px] items-center gap-3 text-xs">
                    <span className="truncate font-medium">{service?.name ?? span.serviceId}</span>
                    <div className="h-7 rounded-md bg-muted p-1">
                      <div
                        className={span.status === "error" ? "h-full rounded-sm bg-destructive/70" : "h-full rounded-sm bg-foreground/20"}
                        style={{ width: `${width}%` }}
                        title={`${span.operation} · ${span.durationMs} ms`}
                      />
                    </div>
                    <span className="text-right font-mono text-muted-foreground">{span.durationMs} ms</span>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card className="shadow-none">
            <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Code2 className="size-4" /> Correlated logs</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {logs.map((log) => (
                <div key={log.id} className="grid gap-2 rounded-lg border p-3 sm:grid-cols-[70px_140px_minmax(0,1fr)]">
                  <Badge variant={log.level === "error" ? "destructive" : "outline"} className="w-fit">{log.level}</Badge>
                  <span className="font-mono text-xs text-muted-foreground">{getService(log.serviceId)?.name ?? log.serviceId}</span>
                  <span className="text-sm">{log.message}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-5">
          <Card className="shadow-none">
            <CardHeader><CardTitle className="flex items-center gap-2 text-base"><GitCommitHorizontal className="size-4" /> Change context</CardTitle></CardHeader>
            <CardContent className="space-y-4 text-sm">
              {deployments.map((deployment) => (
                <div key={deployment.id} className="rounded-lg border p-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium">{deployment.version}</span>
                    <Badge variant="secondary">{deployment.status}</Badge>
                  </div>
                  <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground"><Clock3 className="size-3" /> {new Date(deployment.deployedAt).toLocaleString()}</p>
                </div>
              ))}
              {commits.map((commit) => (
                <div key={commit.sha} className="rounded-lg bg-muted/40 p-3">
                  <p className="font-mono text-xs">{commit.sha}</p>
                  <p className="mt-1 text-sm font-medium">{commit.message}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{commit.changedFiles?.length ?? 0} files changed</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="shadow-none">
            <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Gauge className="size-4" /> Signal deltas</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {metrics.map((metric) => (
                <div key={`${metric.serviceId}-${metric.metric}`} className="flex items-end justify-between gap-4 border-b pb-3 last:border-0 last:pb-0">
                  <div><p className="text-sm font-medium">{metric.metric.replaceAll("_", " ")}</p><p className="text-xs text-muted-foreground">{getService(metric.serviceId)?.name}</p></div>
                  <div className="text-right"><p className="font-mono text-sm">{metric.before} → {metric.after} {metric.unit}</p></div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
