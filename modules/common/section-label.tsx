import type { ReactNode } from "react";

export function SectionLabel({
  children,
  aside,
}: {
  children: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
        {children}
      </p>
      {aside ? <div className="text-xs text-muted-foreground">{aside}</div> : null}
    </div>
  );
}
