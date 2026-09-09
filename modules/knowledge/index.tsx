import { BookOpenCheck, Boxes, GitBranch, Link2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/modules/common/page-header";
import { getService, getWorkItem, orgBrainData } from "@/lib/org-brain";

export default function KnowledgeComponent() {
  return (
    <div className="min-h-full bg-background">
      <PageHeader
        eyebrow="Engineering memory"
        title="Knowledge"
        description="Architectural decisions and durable engineering context. Semantic retrieval comes later; the source relationships already work now."
      />
      <div className="grid gap-4 p-6 xl:grid-cols-2">
        {orgBrainData.architectureDecisions.map((decision) => (
          <Card key={decision.id} className="shadow-none">
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <span className="flex size-9 items-center justify-center rounded-lg bg-muted"><BookOpenCheck className="size-4" /></span>
                <Badge variant="outline">{decision.status}</Badge>
              </div>
              <div className="mt-2">
                <p className="font-mono text-xs text-muted-foreground">{decision.id}</p>
                <CardTitle className="mt-1 text-lg">{decision.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm leading-6 text-muted-foreground">{decision.summary}</p>
              <div className="space-y-2 border-t pt-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Connected context</p>
                <div className="flex flex-wrap gap-2">
                  {decision.relatedServiceIds?.map((id) => (
                    <Badge key={id} variant="secondary"><Boxes className="size-3" />{getService(id)?.name ?? id}</Badge>
                  ))}
                  {decision.relatedWorkItemIds?.map((id) => (
                    <Badge key={id} variant="outline"><GitBranch className="size-3" />{getWorkItem(id)?.id ?? id}</Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        <Card className="border-dashed shadow-none">
          <CardContent className="flex min-h-64 flex-col items-center justify-center px-8 text-center">
            <Link2 className="mb-3 size-5 text-muted-foreground" />
            <p className="font-medium">Vector memory comes after the graph</p>
            <p className="mt-1 max-w-md text-sm leading-6 text-muted-foreground">
              Historical RCAs, runbooks and long-form notes will move behind semantic retrieval without changing these entity relationships.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
