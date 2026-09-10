import {
  BookOpenCheck,
  Boxes,
  GitBranch,
  Link2,
  ShieldCheck,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricCard } from "@/modules/common/metric-card";
import { PageHeader } from "@/modules/common/page-header";
import { SectionLabel } from "@/modules/common/section-label";
import { getService, getWorkItem, orgBrainData } from "@/lib/org-brain";

export default function KnowledgeComponent() {
  const accepted = orgBrainData.architectureDecisions.filter(
    (decision) => decision.status === "Accepted",
  ).length;
  const linkedServices = new Set(
    orgBrainData.architectureDecisions.flatMap((decision) => decision.relatedServiceIds ?? []),
  ).size;
  const linkedWork = new Set(
    orgBrainData.architectureDecisions.flatMap((decision) => decision.relatedWorkItemIds ?? []),
  ).size;

  return (
    <div className="min-h-full bg-background/40">
      <PageHeader
        eyebrow="Engineering memory"
        title="Knowledge"
        description="Architectural decisions and durable engineering context. Semantic retrieval comes later; the source relationships already work now."
      />

      <div className="mx-auto w-full max-w-[1680px] space-y-6 p-5 sm:p-6">
        <div className="space-y-3">
          <SectionLabel aside="Durable context before semantic retrieval">Knowledge pulse</SectionLabel>
          <div className="portal-grid grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard icon={BookOpenCheck} label="Architecture decisions" value={orgBrainData.architectureDecisions.length} hint="Current durable memory" />
            <MetricCard icon={ShieldCheck} label="Accepted constraints" value={accepted} hint="Active architectural guidance" />
            <MetricCard icon={Boxes} label="Linked services" value={linkedServices} hint="Explicit decision relationships" />
            <MetricCard icon={GitBranch} label="Linked work items" value={linkedWork} hint="Delivery context" />
          </div>
        </div>

        <div className="space-y-3">
          <SectionLabel aside="Architecture is treated as evidence, not generated opinion">
            Decision library
          </SectionLabel>
          <div className="portal-grid grid gap-4 xl:grid-cols-2">
            {orgBrainData.architectureDecisions.map((decision) => (
              <Card
                key={decision.id}
                className="portal-card-hover border-foreground/10 bg-card/82 shadow-none backdrop-blur-sm"
              >
                <CardHeader>
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex size-10 items-center justify-center rounded-xl border bg-muted/50">
                      <BookOpenCheck className="size-4" />
                    </span>
                    <Badge variant="outline" className="gap-1.5 font-normal">
                      <span className="size-1.5 rounded-full bg-emerald-500" />
                      {decision.status}
                    </Badge>
                  </div>
                  <div className="mt-2">
                    <p className="font-mono text-xs text-muted-foreground">{decision.id}</p>
                    <CardTitle className="mt-1 text-lg tracking-tight">{decision.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm leading-6 text-muted-foreground">{decision.summary}</p>
                  <div className="space-y-2 border-t pt-4">
                    <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                      Connected context
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {decision.relatedServiceIds?.map((id) => (
                        <Badge key={id} variant="secondary" className="font-normal">
                          <Boxes className="size-3" />
                          {getService(id)?.name ?? id}
                        </Badge>
                      ))}
                      {decision.relatedWorkItemIds?.map((id) => (
                        <Badge key={id} variant="outline" className="font-normal">
                          <GitBranch className="size-3" />
                          {getWorkItem(id)?.id ?? id}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            <Card className="portal-card-hover border-dashed bg-card/55 shadow-none backdrop-blur-sm">
              <CardContent className="flex min-h-72 flex-col items-center justify-center px-8 text-center">
                <span className="flex size-11 items-center justify-center rounded-xl border bg-muted/40">
                  <Link2 className="size-5 text-muted-foreground" />
                </span>
                <p className="mt-4 font-medium">Vector memory comes after the graph</p>
                <p className="mt-1 max-w-md text-sm leading-6 text-muted-foreground">
                  Historical RCAs, runbooks and long-form notes will move behind semantic retrieval without changing these entity relationships.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
