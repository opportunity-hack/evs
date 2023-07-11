import { useState } from 'react'
import {
	Dialog,
	DialogHeader,
	DialogContent,
	DialogDescription,
	DialogClose,
	DialogTitle,
	DialogFooter,
} from '~/components/ui/dialog.tsx'
import { Icon } from '~/components/ui/icon.tsx'
import { Field } from '~/components/forms.tsx'
import {
	Form,
	useLoaderData,
	useNavigate,
	useActionData,
	useNavigation,
	useFormAction,
} from '@remix-run/react'
import { json, type DataFunctionArgs } from '@remix-run/node'
import { requireAdmin } from '~/utils/permissions.server.ts'
import { prisma } from '~/utils/db.server.ts'
import invariant from 'tiny-invariant'
import { conform, useForm } from '@conform-to/react'
import { parse } from '@conform-to/zod'
import { redirectWithToast } from '~/utils/flash-session.server.ts'
import { StatusButton } from '~/components/ui/status-button.tsx'
import { Button } from '~/components/ui/button.tsx'
import { z } from 'zod'

export const loader = async ({ request, params }: DataFunctionArgs) => {
	await requireAdmin(request)
	invariant(params.eventId, 'Missing event id')
	const event = await prisma.event.findUnique({ where: { id: params.eventId } })
	if (!event) {
		throw new Response('not found', { status: 404 })
	}
	return json({ event })
}

export const deleteEventFormSchema = z.object({
	title: z
		.string()
		.min(1, {
			message:
				'You must enter the title of this event to delete it from the database.',
		}),
})

export async function action({ request, params }: DataFunctionArgs) {
	await requireAdmin(request)
	invariant(params.eventId, 'Missing event id')
	const formData = await request.formData()
	const event = await prisma.event.findUnique({ where: { id: params.eventId } })
	if (!event) {
		throw new Response('not found', { status: 404 })
	}
	const submission = await parse(formData, {
		async: true,
		schema: deleteEventFormSchema.superRefine(async ({ title }, ctx) => {
			if (event.title != title) {
				ctx.addIssue({
					path: ['title'],
					code: 'custom',
					message: 'That is not the title of the event.',
				})
			}
		}),
	})

	if (submission.intent !== 'submit') {
		return json({ status: 'idle', submission } as const)
	}
	if (!submission.value) {
		return json(
			{
				status: 'error',
				submission,
			} as const,
			{ status: 400 },
		)
	}

	let deletedEvent
	try {
		deletedEvent = await prisma.event.delete({
			where: { id: params.eventId },
		})
	} catch (error) {
		console.log(error)
		return redirectWithToast('/calendar', {
			title: 'Error',
			variant: 'destructive',
			description: 'Failed to delete event',
		})
	}

	return redirectWithToast('/calendar', {
		title: 'Success',
		description: `Deleted event ${deletedEvent.title}`,
	})
}

export default function DeleteEvent() {
	const data = useLoaderData<typeof loader>() || {}
	const actionData = useActionData<typeof action>()
	const [open, setOpen] = useState(true)

	const navigation = useNavigation()
	const formAction = useFormAction()

	const isSubmitting =
		navigation.state === 'submitting' &&
		navigation.formAction === formAction &&
		navigation.formMethod === 'DELETE'

	const navigate = useNavigate()
	const dismissModal = () => {
		setOpen(false)
		navigate('..', { preventScrollReset: true })
	}
	const [form, fields] = useForm({
		id: 'delete-event',
		lastSubmission: actionData?.submission,
		shouldRevalidate: 'onSubmit',
	})

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogContent
				onEscapeKeyDown={dismissModal}
				onPointerDownOutside={dismissModal}
			>
				<DialogHeader>
					<DialogTitle>Delete Event</DialogTitle>
					<DialogDescription>
						Are you sure you want to permanently remove {data.event?.title} from
						the database?.
					</DialogDescription>

					<Form method="DELETE" {...form.props}>
						<Field
							labelProps={{
								htmlFor: fields.title.id,
								children: `To confirm, type out "${data.event?.title}" into the box.`,
							}}
							inputProps={{
								...conform.input(fields.title),
							}}
							errors={fields.title.errors}
						/>
						<DialogFooter className="gap-2 sm:justify-center">
							<StatusButton
								type="submit"
								status={isSubmitting ? 'pending' : actionData?.status ?? 'idle'}
								variant="destructive"
							>
								Confirm Deletion
							</StatusButton>
							<Button type="button" onClick={dismissModal}>
								Cancel
							</Button>
						</DialogFooter>
					</Form>
				</DialogHeader>
				<DialogClose asChild>
					<button
						type="button"
						onClick={dismissModal}
						aria-label="Close"
						className="absolute right-10 top-10"
					>
						<Icon name="cross-1" />
					</button>
				</DialogClose>
			</DialogContent>
		</Dialog>
	)
}
