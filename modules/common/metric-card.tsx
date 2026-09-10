import type { LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

export function MetricCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <Card className="portal-card-hover group/metric shadow-none">
      <CardContent className="flex items-center gap-3 p-4">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted transition-transform duration-300 group-hover/metric:scale-105">
          <Icon className="size-4 text-muted-foreground transition-colors group-hover/metric:text-foreground" />
        </span>
        <div className="min-w-0">
          <p className="text-2xl font-semibold leading-none tracking-tight">
            {value}
          </p>
          <p className="mt-1 truncate text-xs text-muted-foreground">{label}</p>
          {hint ? (
            <p className="mt-0.5 truncate text-[11px] text-muted-foreground/70">
              {hint}
            </p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
