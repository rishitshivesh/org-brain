"use client";

import { Search, X } from "lucide-react";
import { useMemo, useState } from "react";

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

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full lg:max-w-sm">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search work items, tags or services"
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap items-center gap-1">
          {states.map((itemState) => (
            <Button
              key={itemState}
              type="button"
              size="sm"
              variant={state === itemState ? "secondary" : "ghost"}
              onClick={() => setState(itemState)}
            >
              {itemState}
            </Button>
          ))}
          {(query || state !== "All") && (
            <Button
              type="button"
              size="icon-sm"
              variant="ghost"
              aria-label="Clear filters"
              onClick={() => {
                setQuery("");
                setState("All");
              }}
            >
              <X />
            </Button>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{filtered.length} of {data.length} work items</span>
        <span>Seeded Azure DevOps view</span>
      </div>

      <div className="rounded-xl border bg-card p-1 shadow-sm">
        <DataTable data={filtered} columns={columns} />
      </div>
    </div>
  );
}
