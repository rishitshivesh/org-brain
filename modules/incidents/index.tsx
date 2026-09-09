import { Activity, Clock3, GitCommitHorizontal, Siren } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/modules/common/page-header";
import {
  getIncidentDeployments,
  getService,
  orgBrainData,
} from "@/lib/org-brain";

export default function IncidentsComponent() {
  return (
    <div className="min-h-full bg-background">
      <PageHeader
        eyebrow="Production intelligence"
        title="Incidents"
        description="Operational issues connected to affected services, traces, deployments and engineering work."
      />
      <div className="grid gap-4 p-6 xl:grid-cols-2">
        {orgBrainData.incidents.map((incident) => {
          const deployments = getIncidentDeployments(incident);
          return (
            <Link key={incident.id} href={`/incidents/${incident.id}`} className="group">
              <Card className="h-full shadow-none transition-colors group-hover:border-foreground/20 group-hover:bg-muted/20">
                <CardHeader className="gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={incident.severity === "SEV1" ? "destructive" : "outline"}>{incident.severity}</Badge>
                    <Badge variant="secondary">{incident.status}</Badge>
                    <span className="ml-auto font-mono text-xs text-muted-foreground">{incident.id}</span>
                  </div>
                  <CardTitle className="text-lg">{incident.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {incident.affectedServiceIds.map((id) => (
                      <Badge key={id} variant="secondary" className="font-normal">
                        <Activity className="size-3" /> {getService(id)?.name ?? id}
                      </Badge>
                    ))}
                  </div>
                  <div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
                    <div className="flex items-center gap-2"><Clock3 className="size-3.5" /> Started {new Date(incident.startedAt).toLocaleString()}</div>
                    <div className="flex items-center gap-2"><GitCommitHorizontal className="size-3.5" /> {deployments[0]?.version ?? "No deployment correlation"}</div>
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
              <p className="font-medium">No incidents in the current dataset</p>
              <p className="mt-1 text-sm text-muted-foreground">Scenario Lab can inject deterministic fixtures later.</p>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
