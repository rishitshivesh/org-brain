"use client";

import { Command as CommandIcon, Search } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@/components/ui/command";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { SIDEBAR_ITEMS } from "@/constants";
import { StatusPulse } from "@/modules/common/status-pulse";

const routeLabels: Record<string, string> = {
  "/": "Ask",
  "/work": "Work",
  "/incidents": "Incidents",
  "/services": "Services",
  "/graph": "Graph",
  "/knowledge": "Knowledge",
  "/scenario-lab": "Scenario Lab",
};

export function PortalTopbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const route =
    Object.entries(routeLabels)
      .sort(([a], [b]) => b.length - a.length)
      .find(([href]) =>
        href === "/" ? pathname === "/" : pathname.startsWith(href),
      )?.[1] ?? "Workspace";

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((value) => !value);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  function navigate(href: string) {
    setOpen(false);
    router.push(href);
  }

  return (
    <>
      <header className="relative z-40 flex h-14 shrink-0 items-center border-b bg-background/80 px-3 backdrop-blur-xl supports-[backdrop-filter]:bg-background/65 sm:px-4">
        <SidebarTrigger className="transition-transform duration-200 active:scale-95" />
        <div className="mx-3 h-4 w-px bg-border" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{route}</p>
        </div>
        <div className="hidden items-center gap-4 md:flex">
          <StatusPulse />
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex items-center gap-2 rounded-lg border bg-background/70 px-2.5 py-1.5 text-xs text-muted-foreground shadow-sm transition-[background-color,color,transform] duration-200 hover:bg-muted/60 hover:text-foreground active:scale-[0.98]"
          >
            <Search className="size-3.5" />
            <span>Jump anywhere</span>
            <span className="ml-2 inline-flex items-center gap-0.5 rounded border bg-muted/50 px-1.5 py-0.5 font-mono text-[10px]">
              <CommandIcon className="size-2.5" /> K
            </span>
          </button>
        </div>
      </header>

      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="Navigate Org Brain"
        description="Jump between engineering intelligence surfaces"
        className="max-w-lg border bg-popover/95 shadow-2xl backdrop-blur-xl"
      >
        <Command>
          <CommandInput placeholder="Search workspace..." />
          <CommandList className="portal-scroll max-h-96">
            <CommandEmpty>No matching surface.</CommandEmpty>
            <CommandGroup heading="Workspace">
              {SIDEBAR_ITEMS.map(({ href, icon: Icon, label }) => (
                <CommandItem
                  key={href}
                  value={`${label} ${href}`}
                  onSelect={() => navigate(href)}
                >
                  <Icon className="text-muted-foreground" />
                  <span>{label}</span>
                  {pathname === href ||
                  (href !== "/" && pathname.startsWith(href)) ? (
                    <CommandShortcut>Current</CommandShortcut>
                  ) : null}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
}
