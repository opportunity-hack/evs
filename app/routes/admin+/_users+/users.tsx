import { type LoaderArgs, json, useLoaderData, Outlet, Link } from '~/remix.ts'
import { prisma } from '~/utils/db.server.ts'
import { requireAdmin } from '~/utils/permissions.server.ts'
import { DataTable } from '~/components/ui/data_table.tsx'

import { type ColumnDef } from '@tanstack/react-table'
import { type User, type Role } from '@prisma/client'
import { formatRelative } from 'date-fns'
import { formatPhone } from '~/utils/phone-format.ts'
import { Icon } from '~/components/ui/icon.tsx'
import {
	DropdownMenu,
	DropdownMenuTrigger,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
} from '~/components/ui/dropdown-menu.tsx'
import { Button } from '~/components/ui/button.tsx'
import { SetSignupPasswordForm } from '~/routes/resources+/signup_password.tsx'

export const loader = async ({ request }: LoaderArgs) => {
	await requireAdmin(request)
	return json(await prisma.user.findMany({ include: { roles: true } }))
}

export default function Users() {
	const data = useLoaderData<typeof loader>()
	return (
		<div>
			<h1 className="text-center text-5xl">Users</h1>
			<div className="container pt-10">
				<DataTable columns={columns} data={data} />
				<SetSignupPasswordForm/>
			</div>
			<Outlet />
		</div>
	)
}

type UserWithRole = User & { roles: Role[] }

export const columns: ColumnDef<UserWithRole>[] = [
	{
		accessorKey: 'email',
		header: 'email',
	},
	{
		accessorKey: 'name',
		header: 'name',
	},
	{
		accessorKey: 'phone',
		header: 'phone',
		cell: ({ row }) => {
			const s = row.getValue('phone') as string
			const formatted = s ? formatPhone(s) : null
			return formatted
		}
	},
	{
		accessorKey: 'lastLogin',
		header: 'last login',
		cell: ({ row }) => {
			const timeStamp = new Date(row.getValue('lastLogin'))
			const formatted = formatRelative(timeStamp, new Date())
			return formatted
		},
	},
	{
		header: 'instructor',
		accessorFn: (row) => {
			const hasRole = row.roles.find(r => r.name === 'instructor')
			return hasRole ? 'Yes' : 'No'
		},
	},
	{
		header: 'admin',
		accessorFn: (row) => {
			const hasRole = row.roles.find(r => r.name === 'admin')
			return hasRole ? 'Yes' : 'No'
		},
	},
	{
		header: 'lesson assistant',
		accessorFn: (row) => {
			const hasRole = row.roles.find(r => r.name === 'lessonAssistant')
			return hasRole ? 'Yes' : 'No'
		},
	},
	{
		header: 'horse leader',
		accessorFn: (row) => {
			const hasRole = row.roles.find(r => r.name === 'horseLeader')
			return hasRole ? 'Yes' : 'No'
		},
	},
	{
		id: 'actions',
		cell: ({ row }) => {
			const isAdmin = row.original.roles.find(r => r.name === 'admin')
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
						<DropdownMenuItem asChild>
							<Link to={`edit/${row.original.id}`} preventScrollReset>
								<Icon name="pencil-1">Edit</Icon>
							</Link>
						</DropdownMenuItem>
						<DropdownMenuItem asChild>
							<Link to={`delete/${row.original.id}`} preventScrollReset>
								<Icon name="trash">Delete</Icon>
							</Link>
						</DropdownMenuItem>
						<DropdownMenuSeparator className="mt-4 border" />
						<DropdownMenuItem>
							<Link
								to={`/admin/users/promote/${row.original.id}`}
								preventScrollReset
							>
								<Icon name="lock-closed">
									{isAdmin ? 'Demote from Admin' : 'Promote to Admin'}
								</Icon>
							</Link>
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			)
		},
	},
]
