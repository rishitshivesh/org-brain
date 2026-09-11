import {
  ArrowLeft,
  Clock3,
  Code2,
  FileCode2,
  Gauge,
  GitCommitHorizontal,
  RadioTower,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getDeploymentCommits,
  getIncident,
  getIncidentDeployments,
  getIncidentTraces,
  getService,
  orgBrainData,
} from "@/lib/org-brain";
import { PageHeader } from "@/modules/common/page-header";
import type { MetricComparison } from "@/types/org-brain";

function metricsForIncident(
  incidentId: string,
  metrics: MetricComparison[],
): MetricComparison[] {
  if (incidentId === "INC-2417") {
    return metrics.filter((metric) =>
      /^(db_|checkout_|cpu_|memory_)/.test(metric.metric),
    );
  }
  if (incidentId === "INC-2424") {
    return metrics.filter((metric) =>
      /^(document_|submit_|requests_|error_|cpu_|memory_)/.test(metric.metric),
    );
  }
  return metrics.filter((metric) =>
    /^(consumer_|cpu_|memory_)/.test(metric.metric),
  );
}

export default async function IncidentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const incident = getIncident(id);
  if (!incident) notFound();

  const traces = getIncidentTraces(incident);
  const deployments = getIncidentDeployments(incident);
  const commits = deployments.flatMap(getDeploymentCommits);
  const commitShas = new Set(commits.map((commit) => commit.sha));
  const sourceSnapshots = orgBrainData.sourceSnapshots.filter((snapshot) =>
    commitShas.has(snapshot.commitSha),
  );
  const logs = orgBrainData.logs.filter((log) =>
    traces.some((trace) => trace.id === log.traceId),
  );
  const serviceMetrics = orgBrainData.metrics.filter((metric) =>
    incident.affectedServiceIds.includes(metric.serviceId),
  );
  const metrics = metricsForIncident(incident.id, serviceMetrics);
  const primaryTrace = traces[0];
  const maxDuration = primaryTrace?.durationMs ?? 1;

  return (
    <div className="min-h-full bg-background">
      <PageHeader
        eyebrow={`${incident.severity} · ${incident.id}`}
        title={incident.title}
        description={`Started ${new Date(incident.startedAt).toLocaleString()} · ${incident.status}`}
        actions={
          <Button
            render={<Link href="/incidents" />}
            variant="outline"
            size="sm"
          >
            <ArrowLeft /> Incidents
          </Button>
        }
      />

      <div className="grid gap-5 p-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-5">
          <Card className="portal-card-hover shadow-none">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <RadioTower className="size-4" /> Trace path
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {primaryTrace?.spans.map((span) => {
                const service = getService(span.serviceId);
                const width = Math.max(
                  8,
                  Math.round((span.durationMs / maxDuration) * 100),
                );
                return (
                  <div
                    key={span.id}
                    className="grid grid-cols-[150px_minmax(0,1fr)_70px] items-center gap-3 text-xs"
                  >
                    <div className="min-w-0">
                      <span className="block truncate font-medium">
                        {service?.name ?? span.serviceId}
                      </span>
                      <span className="block truncate text-[10px] text-muted-foreground">
                        {span.operation}
                      </span>
                    </div>
                    <div className="h-7 overflow-hidden rounded-md bg-muted p-1">
                      <div
                        className={
                          span.status === "error"
                            ? "h-full rounded-sm bg-destructive/70 transition-[width] duration-700"
                            : "h-full rounded-sm bg-foreground/20 transition-[width] duration-700"
                        }
                        style={{ width: `${width}%` }}
                        title={`${span.operation} · ${span.durationMs} ms`}
                      />
                    </div>
                    <span className="text-right font-mono text-muted-foreground">
                      {span.durationMs} ms
                    </span>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card className="portal-card-hover shadow-none">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Code2 className="size-4" /> Correlated logs
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="grid gap-2 rounded-lg border bg-background/45 p-3 transition-colors hover:bg-muted/20 sm:grid-cols-[70px_140px_minmax(0,1fr)]"
                >
                  <Badge
                    variant={log.level === "error" ? "destructive" : "outline"}
                    className="w-fit"
                  >
                    {log.level}
                  </Badge>
                  <span className="font-mono text-xs text-muted-foreground">
                    {getService(log.serviceId)?.name ?? log.serviceId}
                  </span>
                  <div>
                    <span className="text-sm">{log.message}</span>
                    {log.metadata ? (
                      <p className="mt-1 font-mono text-[10px] text-muted-foreground">
                        {Object.entries(log.metadata)
                          .map(([key, value]) => `${key}=${String(value)}`)
                          .join(" · ")}
                      </p>
                    ) : null}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {sourceSnapshots.length ? (
            <Card className="portal-card-hover overflow-hidden shadow-none">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileCode2 className="size-4" /> Suspect source
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {sourceSnapshots.map((snapshot) => (
                  <div
                    key={`${snapshot.commitSha}-${snapshot.path}`}
                    className="overflow-hidden rounded-xl border"
                  >
                    <div className="flex items-center justify-between gap-3 border-b bg-muted/35 px-3 py-2">
                      <span className="truncate font-mono text-xs">
                        {snapshot.path}
                      </span>
                      <Badge
                        variant="outline"
                        className="shrink-0 font-mono text-[10px]"
                      >
                        {snapshot.commitSha}
                      </Badge>
                    </div>
                    <pre className="portal-scroll overflow-x-auto bg-zinc-950 p-4 text-xs leading-5 text-zinc-100">
                      <code>{snapshot.content}</code>
                    </pre>
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : null}
        </div>

        <div className="space-y-5">
          <Card className="portal-card-hover shadow-none">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <GitCommitHorizontal className="size-4" /> Change context
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              {deployments.map((deployment) => (
                <div key={deployment.id} className="rounded-lg border p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium">{deployment.version}</p>
                      <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">
                        {deployment.id}
                      </p>
                    </div>
                    <Badge variant="secondary">{deployment.status}</Badge>
                  </div>
                  <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock3 className="size-3" />{" "}
                    {new Date(deployment.deployedAt).toLocaleString()}
                  </p>
                </div>
              ))}
              {commits.map((commit) => (
                <div key={commit.sha} className="rounded-lg bg-muted/40 p-3">
                  <p className="font-mono text-xs">{commit.sha}</p>
                  <p className="mt-1 text-sm font-medium">{commit.message}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {commit.changedFiles?.length ?? 0} files changed
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="portal-card-hover shadow-none">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Gauge className="size-4" /> Signal deltas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {metrics.map((metric) => {
                const change =
                  metric.before === 0 ? null : metric.after / metric.before;
                return (
                  <div
                    key={`${metric.serviceId}-${metric.metric}`}
                    className="flex items-end justify-between gap-4 border-b pb-3 last:border-0 last:pb-0"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {metric.metric.replaceAll("_", " ")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {getService(metric.serviceId)?.name}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-sm">
                        {metric.before} → {metric.after} {metric.unit}
                      </p>
                      {change && change >= 1.5 ? (
                        <p className="mt-0.5 text-[10px] font-medium text-destructive">
                          {change.toFixed(1)}× regression
                        </p>
                      ) : (
                        <p className="mt-0.5 text-[10px] text-muted-foreground">
                          near baseline
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
