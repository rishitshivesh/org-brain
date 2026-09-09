import { ArrowLeft, Boxes, Link2, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/modules/common/page-header";
import {
  getTeam,
  getWorkItem,
  getWorkItemConflicts,
  getWorkItemServices,
} from "@/lib/org-brain";

export default async function WorkItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = getWorkItem(id);
  if (!item) notFound();

  const services = getWorkItemServices(item);
  const conflicts = getWorkItemConflicts(item);
  const team = getTeam(item.ownerTeamId);
  const parent = getWorkItem(item.parentId);

  return (
    <div className="min-h-full bg-background">
      <PageHeader
        eyebrow={`${item.type} · ${item.id}`}
        title={item.title}
        description={item.description}
        actions={
          <Button render={<Link href="/work" />} variant="outline" size="sm">
            <ArrowLeft /> Work
          </Button>
        }
      />

      <div className="grid gap-5 p-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-5">
          <Card className="shadow-none">
            <CardHeader>
              <CardTitle className="text-base">Engineering context</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs text-muted-foreground">State</p>
                <Badge className="mt-2" variant="outline">{item.state}</Badge>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Owner</p>
                <p className="mt-2 text-sm font-medium">{team?.name ?? item.ownerTeamId ?? "Unassigned"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Parent</p>
                <p className="mt-2 text-sm font-medium">{parent ? `${parent.id} · ${parent.title}` : "No parent"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Tags</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {item.tags?.map((tag) => <Badge key={tag} variant="secondary">{tag}</Badge>)}
                </div>
              </div>
            </CardContent>
          </Card>

          {conflicts.length ? (
            <Card className="border-destructive/30 bg-destructive/5 shadow-none">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <TriangleAlert className="size-4 text-destructive" /> Requirement conflict
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {conflicts.map((conflict) => (
                  <Link key={conflict.id} href={`/work/${conflict.id}`} className="block rounded-lg border bg-background p-3 hover:bg-muted/50">
                    <p className="font-mono text-xs text-muted-foreground">{conflict.id}</p>
                    <p className="mt-1 text-sm font-medium">{conflict.title}</p>
                    {conflict.description ? <p className="mt-1 text-sm text-muted-foreground">{conflict.description}</p> : null}
                  </Link>
                ))}
              </CardContent>
            </Card>
          ) : null}
        </div>

        <Card className="h-fit shadow-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><Boxes className="size-4" /> Affected services</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {services.map((service) => (
              <Button
                key={service.id}
                render={<Link href={`/services/${service.id}`} />}
                variant="ghost"
                className="h-auto w-full justify-start px-3 py-2"
              >
                <Link2 className="size-4" />
                <span className="min-w-0 text-left">
                  <span className="block truncate text-sm font-medium">{service.name}</span>
                  <span className="block text-xs text-muted-foreground">{service.type}</span>
                </span>
              </Button>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
