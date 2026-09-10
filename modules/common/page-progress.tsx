"use client";

import { usePathname } from "next/navigation";

export function PageProgress() {
  const pathname = usePathname();

  return (
    <div
      key={pathname}
      className="pointer-events-none absolute inset-x-0 top-0 z-50 h-px overflow-hidden"
    >
      <span className="portal-route-progress block h-full w-full origin-left bg-foreground/55" />
    </div>
  );
}
