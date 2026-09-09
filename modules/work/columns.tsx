"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { WorkItem } from "@/types/org-brain";
import { features } from "@/components/ui/data-table/features";

export const columns: ColumnDef<typeof features, WorkItem>[] = [
  {
    accessorKey: "id",
    header: "ID",
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
      <div className="max-w-[320px] font-medium">{row.original.title}</div>
    ),
  },
  {
    accessorKey: "state",
    header: "State",
    cell: ({ row }) => <Badge>{row.original.state}</Badge>,
  },
  {
    accessorKey: "ownerTeamId",
    header: "Owner Team",
  },
  {
    accessorKey: "tags",
    header: "Tags",
    cell: ({ row }) => (
      <div className="flex flex-wrap gap-1">
        {row.original.tags?.map((tag) => (
          <Badge key={tag} variant="secondary">
            {tag}
          </Badge>
        ))}
      </div>
    ),
  },
  {
    accessorKey: "relatedServiceIds",
    header: "Services",
    cell: ({ row }) => (
      <div className="flex flex-col gap-1">
        {row.original.relatedServiceIds?.map((service) => (
          <span key={service} className="text-sm text-muted-foreground">
            {service}
          </span>
        ))}
      </div>
    ),
  },
];
