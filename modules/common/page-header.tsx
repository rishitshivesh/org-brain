import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="portal-header relative overflow-hidden border-b bg-background/70 px-5 py-5 backdrop-blur-sm sm:px-6 sm:py-6">
      <div className="mx-auto flex w-full max-w-[1680px] flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          {eyebrow ? (
            <Badge
              variant="secondary"
              className="mb-3 rounded-md border border-border/60 bg-background/60 font-medium shadow-sm backdrop-blur"
            >
              {eyebrow}
            </Badge>
          ) : null}
          <h1 className="text-2xl font-semibold tracking-[-0.035em] md:text-3xl">{title}</h1>
          {description ? (
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="shrink-0">{actions}</div> : null}
      </div>
    </div>
  );
}
