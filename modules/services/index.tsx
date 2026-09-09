import { Box, GitFork, Layers3, RadioTower } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/modules/common/page-header";
import {
  getRepository,
  getServiceDependencies,
  getServiceIncidents,
  getServiceWorkItems,
  getTeam,
  orgBrainData,
} from "@/lib/org-brain";

export default function ServicesComponent() {
  return (
    <div className="min-h-full bg-background">
      <PageHeader
        eyebrow="Service catalog"
        title="Services"
        description="Ownership, repositories, dependencies and current engineering context for each service."
      />
      <div className="grid gap-4 p-6 md:grid-cols-2 xl:grid-cols-3">
        {orgBrainData.services.map((service) => {
          const repository = getRepository(service.repositoryId);
          const team = getTeam(service.ownerTeamId);
          const dependencies = getServiceDependencies(service.id);
          const incidents = getServiceIncidents(service.id);
          const work = getServiceWorkItems(service.id);

          return (
            <Link key={service.id} href={`/services/${service.id}`} className="group">
              <Card className="h-full shadow-none transition-colors group-hover:border-foreground/20 group-hover:bg-muted/20">
                <CardHeader>
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex size-9 items-center justify-center rounded-lg bg-muted"><Box className="size-4" /></span>
                    <Badge variant="outline">{service.type}</Badge>
                  </div>
                  <CardTitle className="mt-2 text-lg">{service.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <div className="grid grid-cols-2 gap-3 text-muted-foreground">
                    <div><p className="text-xs">Owner</p><p className="mt-1 truncate font-medium text-foreground">{team?.name ?? service.ownerTeamId}</p></div>
                    <div><p className="text-xs">Repository</p><p className="mt-1 truncate font-medium text-foreground">{repository?.name ?? "Not linked"}</p></div>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1"><GitFork className="size-3" /> {dependencies.length} links</span>
                    <span className="inline-flex items-center gap-1"><Layers3 className="size-3" /> {work.length} work items</span>
                    <span className="inline-flex items-center gap-1"><RadioTower className="size-3" /> {incidents.length} incidents</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
