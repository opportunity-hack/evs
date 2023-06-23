import { ColumnDef } from "@tanstack/react-table";
import { Horse } from "@prisma/client";
import { formatRelative } from 'date-fns'

export const columns: ColumnDef<Horse>[] = [
  {
    accessorKey: "name",
    header: "name",
  },
  {
    accessorKey: "notes",
    header: "notes",
  },
  {
    accessorKey: "status",
    header: "status",
  },
  {
    accessorKey: "updatedAt",
    header: "last updated",
    cell: ({ row }) => {
      const timeStamp = new Date(row.getValue("updatedAt"))
      const formatted = formatRelative(timeStamp, new Date())
      return <div>{formatted}</div>
    },
  },
]
