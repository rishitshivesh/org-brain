"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export function PortalFrame({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <main className="portal-main portal-scroll min-w-0 flex-1">
      <div key={pathname} className="portal-page min-h-full">
        {children}
      </div>
    </main>
  );
}
