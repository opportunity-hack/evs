import { type ColumnDef } from "@tanstack/react-table";
import { type Horse } from "@prisma/client";
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
            <DropdownMenuItem className=""
              onClick={() => alert("unimplemented!")}
            >
            <Icon name="trash">Delete</Icon>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu> )
    }
  },
]
