"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { ArrowUpRight, GitBranch, TriangleAlert } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { features } from "@/components/ui/data-table/features";
import { getService, getTeam } from "@/lib/org-brain";
import type { WorkItem } from "@/types/org-brain";

const stateVariant = (state: WorkItem["state"]) => {
  if (["Done", "Resolved", "Closed"].includes(state)) return "secondary" as const;
  if (["Blocked", "Investigating"].includes(state)) return "destructive" as const;
  return "outline" as const;
};

export const columns: ColumnDef<typeof features, WorkItem>[] = [
  {
    accessorKey: "id",
    header: "Work item",
    cell: ({ row }) => (
      <Link
        href={`/work/${row.original.id}`}
        className="inline-flex items-center gap-1 font-mono text-xs font-medium hover:underline"
      >
        {row.original.id}
        <ArrowUpRight className="size-3" />
      </Link>
    ),
  },
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => <Badge variant="outline">{row.original.type}</Badge>,
  },
  {
    accessorKey: "title",
    header: "Title",
    cell: ({ row }) => (
      <div className="min-w-[260px] max-w-[420px]">
        <Link href={`/work/${row.original.id}`} className="font-medium hover:underline">
          {row.original.title}
        </Link>
        {row.original.conflictsWith?.length ? (
          <div className="mt-1 flex items-center gap-1 text-xs text-destructive">
            <TriangleAlert className="size-3" />
            Conflicts with {row.original.conflictsWith.join(", ")}
          </div>
        ) : null}
      </div>
    ),
  },
  {
    accessorKey: "state",
    header: "State",
    cell: ({ row }) => <Badge variant={stateVariant(row.original.state)}>{row.original.state}</Badge>,
  },
  {
    accessorKey: "ownerTeamId",
    header: "Owner",
    cell: ({ row }) => (
      <span className="text-sm">{getTeam(row.original.ownerTeamId)?.name ?? row.original.ownerTeamId}</span>
    ),
  },
  {
    accessorKey: "relatedServiceIds",
    header: "Services",
    cell: ({ row }) => (
      <div className="flex min-w-[180px] flex-wrap gap-1">
        {row.original.relatedServiceIds?.slice(0, 3).map((serviceId) => (
          <Badge key={serviceId} variant="secondary" className="font-normal">
            <GitBranch className="size-3" />
            {getService(serviceId)?.name ?? serviceId}
          </Badge>
        ))}
      </div>
    ),
  },
];
