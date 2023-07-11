import {
	type ActionArgs,
	type DataFunctionArgs,
	Form,
	json,
	useActionData,
	useLoaderData,
	Outlet,
	Link,
} from '~/remix.ts'
import { prisma } from '~/utils/db.server.ts'
import { requireAdmin } from '~/utils/permissions.server.ts'
import { DataTable } from '~/components/ui/data_table.tsx'
import { z } from 'zod'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
	DialogClose,
} from '~/components/ui/dialog.tsx'
import { useState } from 'react'
import { Label } from '~/components/ui/label.tsx'
import { Input } from '~/components/ui/input.tsx'
import { Textarea } from '~/components/ui/textarea.tsx'
import { parse } from '@conform-to/zod'
import { useResetCallback } from '~/utils/misc.ts'
import { useToast } from '~/components/ui/use-toast.ts'

import { type ColumnDef } from '@tanstack/react-table'
import { type Horse } from '@prisma/client'
import { formatRelative } from 'date-fns'
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

export const horseFormSchema = z.object({
	_action: z.enum(['create', 'update']),
	name: z.string().min(1, { message: 'Name is required' }),
	notes: z.string().optional(),
	status: z.string().optional(),
})

export const loader = async ({ request }: DataFunctionArgs) => {
	await requireAdmin(request)
	return json(await prisma.horse.findMany())
}

export default function Horses() {
	const data = useLoaderData<typeof loader>()
	return (
		<div className="container">
			<h1 className="text-center text-5xl">Horses</h1>
			<div className="flex flex-row-reverse">
				<CreateHorseDialog />
			</div>
			<div className="pt-2">
				<DataTable columns={columns} data={data} />
			</div>
			<Outlet />
		</div>
	)
}

export const action = async ({ request }: ActionArgs) => {
	await requireAdmin(request)
	const formData = await request.formData()
	const submission = parse(formData, { schema: horseFormSchema })
	if (!submission.value) {
		return json({ status: 'error', submission } as const, { status: 400 })
	}

	await prisma.horse.create({
		data: {
			name: submission.value.name,
			notes: submission.value.notes,
			status: submission.value.status,
		},
	})

	return json(
		{
			status: 'ok',
			submission,
		},
		{ status: 200 },
	)
}

function CreateHorseDialog() {
	const [open, setOpen] = useState(false)
	const actionData = useActionData<typeof action>()
	const { toast } = useToast()
	useResetCallback(actionData, () => {
		if (!actionData) {
			return
		}
		if (actionData.status == 'ok') {
			toast({
				title: 'Success',
				description: `Created horse "${actionData.submission?.value?.name}".`,
			})
			setOpen(false)
		} else {
			if (actionData.submission.value?._action == 'create') {
				toast({
					variant: 'destructive',
					title: 'Error creating horse',
					description: 'Failed to create horse. There was an unexpected error.',
				})
			}
		}
	})

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button className="mt-5 flex gap-2" variant="outline">
					<Icon className="text-body-md" name="plus" />
					Register new horse
				</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Register new horse</DialogTitle>
					<DialogDescription>
						Fill out this form to add a new horse to the database.
					</DialogDescription>
				</DialogHeader>
				<Form method="post">
					<input type="hidden" name="_action" value="create" />
					<Label htmlFor="name">Name</Label>
					<Input type="text" name="name" required></Input>

					<Label htmlFor="status">Status</Label>
					<Input type="textarea" name="status"></Input>

					<Label htmlFor="notes">Notes</Label>
					<Textarea name="notes" />
					<DialogFooter className="mt-4">
						<Button type="submit">Save</Button>
					</DialogFooter>
				</Form>
				<DialogClose />
			</DialogContent>
		</Dialog>
	)
}

export const columns: ColumnDef<Horse>[] = [
	{
		accessorKey: 'name',
		header: 'name',
	},
	{
		accessorKey: 'notes',
		header: 'notes',
	},
	{
		accessorKey: 'status',
		header: 'status',
	},
	{
		accessorKey: 'updatedAt',
		header: 'last updated',
		cell: ({ row }) => {
			const timeStamp = new Date(row.getValue('updatedAt'))
			const formatted = formatRelative(timeStamp, new Date())
			return <div>{formatted}</div>
		},
	},
	{
		id: 'actions',
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
						<DropdownMenuItem asChild>
							<Link to={`edit/${row.original.id}`} preventScrollReset>
								<Icon name="pencil-1">Edit</Icon>
							</Link>
						</DropdownMenuItem>
						<DropdownMenuSeparator />
						<DropdownMenuItem asChild>
							<Link to={`delete/${row.original.id}`} preventScrollReset>
								<Icon name="trash">Delete</Icon>
							</Link>
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			)
		},
	},
]
