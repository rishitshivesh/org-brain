import { AlertTriangle, Boxes, CircleDot, ListTodo } from "lucide-react";

import { PageHeader } from "@/modules/common/page-header";
import { MetricCard } from "@/modules/common/metric-card";
import { SectionLabel } from "@/modules/common/section-label";
import { WorkTable } from "@/modules/work/work-table";
import { getWorkSummary, orgBrainData } from "@/lib/org-brain";

export default function WorkComponent() {
  const summary = getWorkSummary();

  const metrics = [
    { label: "Work items", value: summary.total, icon: ListTodo, hint: "Current organization slice" },
    { label: "In motion", value: summary.active, icon: CircleDot, hint: "Active or investigating" },
    { label: "Conflicts", value: summary.conflicts, icon: AlertTriangle, hint: "Explicit requirement conflicts" },
    { label: "Services touched", value: summary.services, icon: Boxes, hint: "Resolved from work context" },
  ];

  return (
    <div className="min-h-full bg-background/40">
      <PageHeader
        eyebrow="Work intelligence"
        title="Work"
        description="Azure DevOps-style engineering work with service impact, ownership and requirement conflicts kept in the same context."
      />

      <div className="mx-auto w-full max-w-[1680px] space-y-6 p-5 sm:p-6">
        <div className="space-y-3">
          <SectionLabel aside="Programmatic context, no model inference">Delivery pulse</SectionLabel>
          <div className="portal-grid grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {metrics.map((metric) => (
              <MetricCard key={metric.label} {...metric} />
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <SectionLabel aside={`${orgBrainData.workItems.length} indexed items`}>Work browser</SectionLabel>
          <WorkTable data={orgBrainData.workItems} />
        </div>
      </div>
    </div>
  );
}
