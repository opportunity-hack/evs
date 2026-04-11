import { json, type DataFunctionArgs } from '@remix-run/node'
import { useLoaderData } from '@remix-run/react'
import { requireSuperAdmin } from '~/utils/permissions.server.ts'
import { prisma } from '~/utils/db.server.ts'
import { format } from 'date-fns'

export const loader = async ({ request }: DataFunctionArgs) => {
	await requireSuperAdmin(request)
	const orgs = await prisma.organization.findMany({
		include: {
			_count: { select: { users: true, animals: true, events: true } },
		},
		orderBy: { createdAt: 'desc' },
	})
	return json({ orgs })
}

export default function SuperAdminOrgs() {
	const { orgs } = useLoaderData<typeof loader>()

	return (
		<div className="container py-8">
			<h1 className="mb-6 text-h2">All Organizations</h1>
			<div className="overflow-x-auto rounded-lg border">
				<table className="w-full text-sm">
					<thead className="bg-muted">
						<tr>
							<th className="px-4 py-3 text-left">Name</th>
							<th className="px-4 py-3 text-left">Slug</th>
							<th className="px-4 py-3 text-left">Animal Type</th>
							<th className="px-4 py-3 text-left">Users</th>
							<th className="px-4 py-3 text-left">Animals</th>
							<th className="px-4 py-3 text-left">Events</th>
							<th className="px-4 py-3 text-left">Status</th>
							<th className="px-4 py-3 text-left">Created</th>
						</tr>
					</thead>
					<tbody>
						{orgs.map(org => (
							<tr key={org.id} className="border-t">
								<td className="px-4 py-3 font-medium">{org.name}</td>
								<td className="px-4 py-3 text-muted-foreground">{org.slug}</td>
								<td className="px-4 py-3">{org.animalType}</td>
								<td className="px-4 py-3">{org._count.users}</td>
								<td className="px-4 py-3">{org._count.animals}</td>
								<td className="px-4 py-3">{org._count.events}</td>
								<td className="px-4 py-3">
									<span
										className={
											org.isActive
												? 'text-green-600'
												: 'text-muted-foreground'
										}
									>
										{org.isActive ? 'Active' : 'Inactive'}
									</span>
								</td>
								<td className="px-4 py-3 text-muted-foreground">
									{format(new Date(org.createdAt), 'MMM d, yyyy')}
								</td>
							</tr>
						))}
					</tbody>
				</table>
				{orgs.length === 0 && (
					<div className="py-12 text-center text-muted-foreground">
						No organizations found.
					</div>
				)}
			</div>
			<p className="mt-4 text-sm text-muted-foreground">
				{orgs.length} organization{orgs.length !== 1 ? 's' : ''} total
			</p>
		</div>
	)
}
