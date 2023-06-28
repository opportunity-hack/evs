import { type ColumnDef } from "@tanstack/react-table";
import { type User } from "@prisma/client";
import { formatRelative } from 'date-fns'

export const columns: ColumnDef<User>[] = [
  {
    accessorKey: "email",
    header: "email",
  },
  {
    accessorKey: "name",
    header: "name",
  },
  {
    accessorKey: "lastLogin",
    header: "last login",
    cell: ({ row }) => {
      const timeStamp = new Date(row.getValue("lastLogin"))
      const formatted = formatRelative(timeStamp, new Date())
      return <div>{formatted}</div>
    },
  },
]
