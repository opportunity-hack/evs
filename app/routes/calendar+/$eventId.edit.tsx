import { json, type DataFunctionArgs } from '@remix-run/node'
import {
	Form,
	useActionData,
	useFormAction,
	useLoaderData,
	useNavigate,
	useNavigation,
} from '@remix-run/react'
import { useState } from 'react'
import invariant from 'tiny-invariant'
import { parse } from '@conform-to/zod'
import { z } from 'zod'
import {
	Dialog,
	DialogHeader,
	DialogTitle,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogClose,
} from '~/components/ui/dialog.tsx'
import { Icon } from '~/components/ui/icon.tsx'
import { prisma } from '~/utils/db.server.ts'
import { requireAdmin } from '~/utils/permissions.server.ts'
import { requireOrgMember } from '~/utils/auth.server.ts'
import { AnimalListbox, InstructorListbox } from '~/components/listboxes.tsx'
import { addMinutes, differenceInMinutes, format, add } from 'date-fns'
import { redirectWithToast } from '~/utils/flash-session.server.ts'
import { conform, useForm } from '@conform-to/react'
import { CheckboxField, Field } from '~/components/forms.tsx'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '~/components/ui/select.tsx'
import { Label } from '~/components/ui/label.tsx'
import { Separator } from '@radix-ui/react-dropdown-menu'
import { StatusButton } from '~/components/ui/status-button.tsx'
import { useToast } from '~/components/ui/use-toast.ts'
import { checkboxSchema, optionalDateSchema } from '~/utils/zod-extensions.ts'
import { useResetCallback } from '~/utils/misc.ts'

export const loader = async ({ request, params }: DataFunctionArgs) => {
	await requireAdmin(request)
	const { orgId } = await requireOrgMember(request)
	invariant(params.eventId, 'Missing event id')

	const instructors = await prisma.user.findMany({
		where: { orgId, roles: { some: { name: 'instructor' } } },
	})
	const animals = await prisma.animal.findMany({ where: { orgId } })
	const event = await prisma.event.findFirst({
		where: { id: params.eventId, orgId },
		include: {
			animals: true,
			instructors: true,
		},
	})

	if (!event) {
		throw new Response('not found', { status: 404 })
	}
	return json({ event, animals, instructors })
}

const animalSchema = z.object({
	id: z.string(),
	name: z.string(),
	cooldownStartDate: optionalDateSchema,
	cooldownEndDate: optionalDateSchema,
})

const instructorSchema = z
	.object({
		id: z.string(),
		name: z.string(),
		username: z.string(),
	})
	.optional()

const editEventSchema = z.object({
	title: z.string().min(1, 'Title is required'),
	startDate: z.coerce.date(),
	duration: z.coerce.number().gt(0),
	animals: z.array(animalSchema).optional(),
	instructor: instructorSchema,
	cleaningCrewReq: z.coerce.number().gt(-1),
	lessonAssistantsReq: z.coerce.number().gt(-1),
	sideWalkersReq: z.coerce.number().gt(-1),
	animalHandlersReq: z.coerce.number().gt(-1),
	isPrivate: checkboxSchema(),
})

export async function action({ request, params }: DataFunctionArgs) {
	await requireAdmin(request)
	const { orgId } = await requireOrgMember(request)
	invariant(params.eventId, 'Missing event id')
	const formData = await request.formData()
	const submission = parse(formData, {
		schema: () => {
			return editEventSchema
		},
	})
	if (!submission.value) {
		return json(
			{
				status: 'error',
				submission,
				message: null,
			} as const,
			{ status: 400 },
		)
	}

	const title = submission.value.title
	const start = submission.value.startDate
	const end = addMinutes(start, submission.value.duration)

	const instructorId = submission.value.instructor?.id
	let instructorData: { id: string }[] = []
	if (instructorId) {
		instructorData = [{ id: instructorId }]
	}
	const animalIds = submission.value.animals?.map(e => {
		return { id: e.id }
	})

	// check that animals selected are not in cooldown period
	if (submission.value.animals) {
		const selectedAnimalsArray = submission.value.animals
		const errorAnimals = selectedAnimalsArray.filter(animal => {
			if (animal.cooldownStartDate && animal.cooldownEndDate) {
				return (
					animal.cooldownStartDate <= start &&
					start < add(animal.cooldownEndDate, { days: 1 })
				)
			} else return false
		})
		const listOfAnimals = errorAnimals.map(a => a.name).join(', ')
		if (errorAnimals.length > 0) {
			return json({
				status: 'animal-error',
				submission,
				message: listOfAnimals,
			} as const)
		}
	}

	const cleaningCrewReq = submission.value.cleaningCrewReq
	const lessonAssistantsReq = submission.value.lessonAssistantsReq
	const sideWalkersReq = submission.value.sideWalkersReq
	const animalHandlersReq = submission.value.animalHandlersReq

	const isPrivate = submission.value.isPrivate

	const existingEvent = await prisma.event.findFirst({ where: { id: params.eventId, orgId } })
	if (!existingEvent) throw new Response('not found', { status: 404 })

	const updatedEvent = await prisma.event.update({
		where: {
			id: params.eventId,
		},
		data: {
			title,
			start,
			end,
			instructors: {
				set: instructorData,
			},
			animals: {
				set: animalIds ?? [],
			},
			cleaningCrewReq,
			lessonAssistantsReq,
			sideWalkersReq,
			animalHandlersReq,
			isPrivate,
		},
	})

	if (!updatedEvent) {
		return redirectWithToast('..', {
			title: `Error`,
			variant: 'destructive',
			description: `Failed to update event`,
		})
	}

	return redirectWithToast('..', {
		title: 'Success',
		description: `Updated event ${updatedEvent.title}`,
	})
}

export default function EventEditor() {
	const data = useLoaderData<typeof loader>() || {}
	const actionData = useActionData<typeof action>()
	const { toast } = useToast()
	const [open, setOpen] = useState(true)

	const navigation = useNavigation()
	const formAction = useFormAction()

	const isSubmitting =
		navigation.state === 'submitting' &&
		navigation.formAction === formAction &&
		navigation.formMethod === 'PUT'

	const navigate = useNavigate()
	const dismissModal = () => {
		setOpen(false)
		navigate('..', { preventScrollReset: true })
	}

	const defaultDuration = data.event
		? differenceInMinutes(new Date(data.event.end), new Date(data.event.start))
		: 30

	const defaultIsPrivate = data.event?.isPrivate ?? false

	const [form, fields] = useForm({
		id: 'edit-event',
		lastSubmission: actionData?.submission,
		defaultValue: {
			title: data.event?.title,
			startDate: data.event
				? format(new Date(data.event.start), "yyyy-MM-dd'T'HH:mm:00")
				: '',
			duration: defaultDuration,
			animals: data.event?.animals,
			instructor: data.event?.instructors[0],
			cleaningCrewReq: data.event?.cleaningCrewReq,
			animalHandlersReq: data.event?.animalHandlersReq,
			sideWalkersReq: data.event?.sideWalkersReq,
			lessonAssistantsReq: data.event?.lessonAssistantsReq,
		},
		shouldRevalidate: 'onSubmit',
	})

	useResetCallback(actionData, () => {
		if (!actionData) {
			return
		}
		if (actionData.status === 'animal-error') {
			toast({
				variant: 'destructive',
				title:
					'The following animals are scheduled for cooldown on the selected dates:',
				description: actionData.message,
			})
		}
	})

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogContent
				onEscapeKeyDown={dismissModal}
				onPointerDownOutside={dismissModal}
			>
				<DialogHeader>
					<DialogTitle>Edit Event - {data.event?.title}</DialogTitle>
					<DialogDescription>
						Edit the event using this form. Click save to save your changes.
					</DialogDescription>
				</DialogHeader>
				<Form method="PUT" {...form.props}>
					<div className="grid grid-cols-2 gap-x-2 gap-y-4">
						<Field
							className="col-span-2"
							labelProps={{
								htmlFor: fields.title.id,
								children: 'Title',
							}}
							inputProps={conform.input(fields.title)}
							errors={fields.title.errors}
						/>
						<Field
							className="col-span-2 sm:col-span-1"
							labelProps={{
								htmlFor: fields.startDate.id,
								children: 'Start Date',
							}}
							inputProps={{
								...conform.input(fields.startDate),
								type: 'datetime-local',
							}}
							errors={fields.startDate.errors}
						/>
						<div className="col-span-2 sm:col-span-1">
							<Label htmlFor="duration">Duration</Label>
							<Select name="duration" defaultValue={defaultDuration.toString()}>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="30">30 minutes</SelectItem>
									<SelectItem value="60">60 minutes</SelectItem>
									<SelectItem value="90">90 minutes</SelectItem>
									<SelectItem value="120">120 minutes</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div className="col-span-2 sm:col-span-1">
							<Label htmlFor="animals">Animals</Label>
							<AnimalListbox
								name="animals"
								animals={data.animals}
								defaultValues={data.event?.animals}
								error={actionData?.status === 'animal-error' ?? false}
							/>
						</div>
						<div className="col-span-2 sm:col-span-1">
							<Label htmlFor="instructor">Instructor</Label>
							<InstructorListbox
								name="instructor"
								instructors={data.instructors}
								defaultValue={data.event?.instructors[0]}
							/>
						</div>
						<Separator className="col-span-2 border" />
						<Field
							className="col-span-2 sm:col-span-1"
							labelProps={{
								htmlFor: fields.cleaningCrewReq.id,
								children: 'cleaning crew needed',
							}}
							inputProps={{
								...conform.input(fields.cleaningCrewReq),
								type: 'number',
							}}
							errors={fields.cleaningCrewReq.errors}
						/>
						<Field
							className="col-span-2 sm:col-span-1"
							labelProps={{
								htmlFor: fields.lessonAssistantsReq.id,
								children: 'Lesson assistants needed',
							}}
							inputProps={{
								...conform.input(fields.lessonAssistantsReq),
								type: 'number',
							}}
							errors={fields.lessonAssistantsReq.errors}
						/>
						<Field
							className="col-span-2 sm:col-span-1"
							labelProps={{
								htmlFor: fields.sideWalkersReq.id,
								children: 'Sidewalkers needed',
							}}
							inputProps={{
								...conform.input(fields.sideWalkersReq),
								type: 'number',
							}}
							errors={fields.sideWalkersReq.errors}
						/>
						<Field
							className="col-span-2 sm:col-span-1"
							labelProps={{
								htmlFor: fields.animalHandlersReq.id,
								children: 'Animal handlers needed',
							}}
							inputProps={{
								...conform.input(fields.animalHandlersReq),
								type: 'number',
							}}
							errors={fields.animalHandlersReq.errors}
						/>
						<CheckboxField
							className="col-span-2"
							labelProps={{
								htmlFor: fields.isPrivate.id,
								children: 'Private (only visible to admins)',
							}}
							buttonProps={{
								...conform.input(fields.isPrivate),
								defaultChecked: defaultIsPrivate,
							}}
						/>
					</div>
					<DialogFooter>
						<StatusButton
							className="mr-5"
							type="submit"
							status={
								isSubmitting
									? 'pending'
									: actionData?.status == 'error'
									? 'error'
									: 'idle'
							}
						>
							Save
						</StatusButton>
					</DialogFooter>
				</Form>
				<DialogClose asChild>
					<button
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
