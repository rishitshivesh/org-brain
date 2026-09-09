import { AlertTriangle, Boxes, CircleDot, ListTodo } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/modules/common/page-header";
import { WorkTable } from "@/modules/work/work-table";
import { getWorkSummary, orgBrainData } from "@/lib/org-brain";

export default function WorkComponent() {
  const summary = getWorkSummary();

  const metrics = [
    { label: "Work items", value: summary.total, icon: ListTodo },
    { label: "In motion", value: summary.active, icon: CircleDot },
    { label: "Conflicts", value: summary.conflicts, icon: AlertTriangle },
    { label: "Services touched", value: summary.services, icon: Boxes },
  ];

  return (
    <div className="min-h-full bg-background">
      <PageHeader
        eyebrow="Work intelligence"
        title="Work"
        description="Azure DevOps-style engineering work with service impact, ownership and requirement conflicts kept in the same context."
      />

      <div className="space-y-5 p-6">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map(({ icon: Icon, label, value }) => (
            <Card key={label} className="shadow-none">
              <CardContent className="flex items-center gap-3 p-4">
                <span className="flex size-9 items-center justify-center rounded-lg bg-muted">
                  <Icon className="size-4 text-muted-foreground" />
                </span>
                <div>
                  <p className="text-2xl font-semibold leading-none">{value}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <WorkTable data={orgBrainData.workItems} />
      </div>
    </div>
  );
}
