import {
  ArrowLeft,
  Boxes,
  GitFork,
  GitPullRequest,
  Layers3,
  RadioTower,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/modules/common/page-header";
import {
  getRepository,
  getService,
  getServiceDependencies,
  getServiceDeployments,
  getServiceIncidents,
  getServiceWorkItems,
  getTeam,
} from "@/lib/org-brain";

export default async function ServicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const service = getService(id);
  if (!service) notFound();

  const team = getTeam(service.ownerTeamId);
  const repository = getRepository(service.repositoryId);
  const dependencies = getServiceDependencies(service.id);
  const deployments = getServiceDeployments(service.id);
  const incidents = getServiceIncidents(service.id);
  const workItems = getServiceWorkItems(service.id);

  return (
    <div className="min-h-full bg-background">
      <PageHeader
        eyebrow={`${service.type} · ${service.id}`}
        title={service.name}
        description={`${team?.name ?? service.ownerTeamId} owns this service${repository ? ` · ${repository.name}` : ""}.`}
        actions={
          <Button
            render={<Link href="/services" />}
            variant="outline"
            size="sm"
          >
            <ArrowLeft /> Services
          </Button>
        }
      />

      <div className="grid gap-5 p-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-5">
          <Card className="shadow-none">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <GitFork className="size-4" /> Dependency edges
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {dependencies.map((dependency) => {
                const outgoing = dependency.from === service.id;
                const other = getService(
                  outgoing ? dependency.to : dependency.from,
                );
                return (
                  <div
                    key={`${dependency.from}-${dependency.to}`}
                    className="flex items-center justify-between gap-4 rounded-lg border p-3"
                  >
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">
                        {outgoing ? "Calls" : "Called by"}
                      </p>
                      <p className="mt-1 truncate text-sm font-medium">
                        {other?.name ??
                          (outgoing ? dependency.to : dependency.from)}
                      </p>
                    </div>
                    <Badge variant="outline">{dependency.protocol}</Badge>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card className="shadow-none">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Layers3 className="size-4" /> Related work
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {workItems.map((item) => (
                <Link
                  key={item.id}
                  href={`/work/${item.id}`}
                  className="flex items-start justify-between gap-3 rounded-lg border p-3 hover:bg-muted/40"
                >
                  <div>
                    <p className="font-mono text-xs text-muted-foreground">
                      {item.id}
                    </p>
                    <p className="mt-1 text-sm font-medium">{item.title}</p>
                  </div>
                  <Badge variant="secondary">{item.state}</Badge>
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-5">
          <Card className="shadow-none">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <GitPullRequest className="size-4" /> Repository
              </CardTitle>
            </CardHeader>
            <CardContent>
              {repository ? (
                <div className="space-y-2">
                  <p className="text-sm font-medium">{repository.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {repository.language ?? "Unknown"} ·{" "}
                    {repository.framework ?? "No framework"}
                  </p>
                  <Badge variant="outline">{repository.defaultBranch}</Badge>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No repository linked.
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-none">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <RadioTower className="size-4" /> Operational context
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Deployments
                </span>
                <span className="font-medium">{deployments.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Incidents</span>
                <span className="font-medium">{incidents.length}</span>
              </div>
              {incidents.map((incident) => (
                <Button
                  key={incident.id}
                  render={<Link href={`/incidents/${incident.id}`} />}
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                >
                  <Boxes /> {incident.id} · {incident.severity}
                </Button>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
