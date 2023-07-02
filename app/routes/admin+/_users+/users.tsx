import { type LoaderArgs, json, useLoaderData } from "~/remix.ts";
import { prisma } from "~/utils/db.server.ts";
import { requireAdmin } from "~/utils/permissions.server.ts";
import { DataTable } from "~/components/ui/data_table.tsx";

import { type ColumnDef } from "@tanstack/react-table";
import { type User } from "@prisma/client";
import { formatRelative } from 'date-fns'
import { Icon } from '~/components/ui/icon.tsx';
import { 
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '~/components/ui/dropdown-menu.tsx';
import { Button } from '~/components/ui/button.tsx';

export const loader = async ({ request }: LoaderArgs) => {
  await requireAdmin(request)
  return json(
    await prisma.user.findMany()
  );
};

export default function Users() {
 const data = useLoaderData<typeof loader>()
 return ( 
  <div>
    <h1 className="text-5xl text-center">Users</h1>
    <div className="container pt-10">
      <DataTable columns={columns} data={data}/>
    </div>
  </div>
  )
}

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
  {
    id: "actions",
    cell: ({ row }) => {
      return (
       <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <Icon className="h-4 w-4" name="dots-vertical" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => alert("unimplemented!")}
            >
              <Icon name="pencil-1">Edit</Icon>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => alert("unimplemented!")}
            >
            <Icon name="trash">Delete</Icon>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu> )
    }
  },
]
