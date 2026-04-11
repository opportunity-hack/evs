import { useState } from 'react'
import { type LoaderArgs, json, useLoaderData, Outlet, Link } from '~/remix.ts'
import { prisma } from '~/utils/db.server.ts'
import { requireAdmin } from '~/utils/permissions.server.ts'
import { requireOrgMember } from '~/utils/auth.server.ts'
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
	const { orgId } = await requireOrgMember(request)
	return json(await prisma.user.findMany({ where: { orgId }, include: { roles: true } }))
}

export default function Users() {
	const data = useLoaderData<typeof loader>()
	const [search, setSearch] = useState('')

	const filtered = data.filter(u => {
		const q = search.toLowerCase()
		return (
			!q ||
			u.name?.toLowerCase().includes(q) ||
			u.email.toLowerCase().includes(q) ||
			u.username.toLowerCase().includes(q)
		)
	})

	return (
		<div className="container py-8">
			<div className="mb-6 flex items-center justify-between">
				<div>
					<h1 className="text-h3">Volunteers</h1>
					<p className="mt-1 text-body-sm text-muted-foreground">
						{data.length} member{data.length !== 1 ? 's' : ''} in your organization
					</p>
				</div>
			</div>

			{/* Filter bar */}
			<div className="mb-4 flex items-center gap-3">
				<div className="flex-1 max-w-sm">
					<input
						type="search"
						placeholder="Search by name, email or username..."
						value={search}
						onChange={e => setSearch(e.target.value)}
						className="w-full rounded-md border border-input bg-background px-3 py-2 text-body-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
					/>
				</div>
				{search && (
					<span className="text-body-xs text-muted-foreground">
						{filtered.length} result{filtered.length !== 1 ? 's' : ''}
					</span>
				)}
			</div>

			<DataTable
				columns={columns}
				data={filtered}
				emptyMessage={search ? 'No volunteers match your search' : 'No volunteers yet'}
				emptyDescription={search ? 'Try a different name or email.' : 'Volunteers will appear here once they join your organization.'}
			/>
			<div className="mt-8">
				<SetSignupPasswordForm />
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
		header: 'mailing list',
		accessorFn: (row) => {
			const isMailingList = row.mailingList
			return isMailingList ? 'Yes' : 'No'
		},
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
		header: 'animal handler',
		accessorFn: (row) => {
			const hasRole = row.roles.find(r => r.name === 'animalHandler')
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
