"use client";

import { Search, SlidersHorizontal, X } from "lucide-react";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import { columns } from "@/modules/work/columns";
import type { WorkItem } from "@/types/org-brain";

const states = ["All", "Active", "Proposed", "Investigating", "Done"] as const;

export function WorkTable({ data }: { data: WorkItem[] }) {
  const [query, setQuery] = useState("");
  const [state, setState] = useState<(typeof states)[number]>("All");

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    return data.filter((item) => {
      const matchesState = state === "All" || item.state === state;
      const matchesQuery =
        !normalized ||
        item.id.toLowerCase().includes(normalized) ||
        item.title.toLowerCase().includes(normalized) ||
        item.tags?.some((tag) => tag.toLowerCase().includes(normalized)) ||
        item.relatedServiceIds?.some((service) => service.toLowerCase().includes(normalized));

      return matchesState && Boolean(matchesQuery);
    });
  }, [data, query, state]);

  const filteredCount = filtered.length;
  const hasFilters = Boolean(query || state !== "All");

  return (
    <div className="overflow-hidden rounded-2xl border bg-card/72 shadow-sm backdrop-blur-sm">
      <div className="sticky top-0 z-20 border-b bg-card/90 p-3 backdrop-blur-xl sm:p-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="relative w-full xl:max-w-md">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search work items, tags or services"
              className="bg-background/80 pl-9 pr-9 shadow-none transition-shadow focus-visible:shadow-sm"
            />
            {query ? (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            ) : null}
          </div>

          <div className="portal-scroll-x flex max-w-full items-center gap-1 overflow-x-auto pb-1 xl:pb-0">
            <span className="mr-1 flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
              <SlidersHorizontal className="size-3.5" /> State
            </span>
            {states.map((itemState) => (
              <Button
                key={itemState}
                type="button"
                size="sm"
                variant={state === itemState ? "secondary" : "ghost"}
                className="shrink-0 transition-transform active:scale-95"
                onClick={() => setState(itemState)}
              >
                {itemState}
              </Button>
            ))}
            {hasFilters ? (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="shrink-0 text-muted-foreground"
                onClick={() => {
                  setQuery("");
                  setState("All");
                }}
              >
                Reset
              </Button>
            ) : null}
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between gap-3 text-xs text-muted-foreground">
          <span>
            <span className="font-medium text-foreground">{filteredCount}</span> of {data.length} work items
          </span>
          <Badge variant="outline" className="hidden font-normal sm:inline-flex">
            Seeded Azure DevOps view
          </Badge>
        </div>
      </div>

      <div className="p-1.5 sm:p-2">
        <DataTable data={filtered} columns={columns} />
      </div>
    </div>
  );
}
