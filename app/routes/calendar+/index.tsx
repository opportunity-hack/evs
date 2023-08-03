import { Link, Form, json, useLoaderData, useActionData } from '~/remix.ts'
import type { ActionArgs, LoaderArgs } from '~/remix.ts'
import { Calendar, dateFnsLocalizer } from 'react-big-calendar'
import format from 'date-fns/format/index.js'
import parse from 'date-fns/parse/index.js'
import startOfWeek from 'date-fns/startOfWeek/index.js'
import getDay from 'date-fns/getDay/index.js'
import enUS from 'date-fns/locale/en-US/index.js'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import { Icon } from '~/components/ui/icon.tsx'

import {
	volunteerTypes,
	type UserData,
	type HorseData,
	type EventWithVolunteers,
} from '~/data.ts'
import { useState } from 'react'

import { prisma } from '~/utils/db.server.ts'
import { requireUserId } from '~/utils/auth.server.ts'
import { useUser } from '~/utils/user.ts'
import { Button } from '~/components/ui/button.tsx'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
	DialogFooter,
	DialogClose,
} from '~/components/ui/dialog.tsx'
import { Input } from '~/components/ui/input.tsx'
import { RadioGroup, RadioGroupItem } from '~/components/ui/radio-group.tsx'
import { Label } from '~/components/ui/label.tsx'

import {
	Popover,
	PopoverTrigger,
	PopoverContent,
} from '@/components/ui/popover.tsx'

import { parse as formParse } from '@conform-to/zod'
import { z } from 'zod'

import { HorseListbox, InstructorListbox } from '~/components/listboxes.tsx'
import { addMinutes, isAfter } from 'date-fns'
import { useFetcher, useFormAction, useNavigation } from '@remix-run/react'
import { useResetCallback } from '~/utils/misc.ts'
import { useToast } from '~/components/ui/use-toast.ts'
import {
	requireAdmin,
	userHasAdminPermissions,
} from '~/utils/permissions.server.ts'
import { Info } from 'lucide-react'
import { Checkbox } from '~/components/ui/checkbox.tsx'
import { conform, useForm } from '@conform-to/react'
import { StatusButton } from '~/components/ui/status-button.tsx'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '~/components/ui/select.tsx'
import { Separator } from '~/components/ui/separator.tsx'
import { CheckboxField, Field } from '~/components/forms.tsx'
import { checkboxSchema } from '~/utils/zod-extensions.ts'

const locales = {
	'en-US': enUS,
}

const localizer = dateFnsLocalizer({
	format,
	parse,
	startOfWeek,
	getDay,
	locales,
})

export const loader = async ({ request }: LoaderArgs) => {
	await requireUserId(request)
	const instructors = await prisma.user.findMany({
		where: { roles: { some: { name: 'instructor' } } },
	})

	let eventsWhere: { isPrivate?: boolean } = { isPrivate: false }
	if (await userHasAdminPermissions(request)) {
		delete eventsWhere.isPrivate
	}
	return json({
		events: await prisma.event.findMany({
			where: eventsWhere,
			include: {
				horses: true,
				instructors: true,
				cleaningCrew: true,
				lessonAssistants: true,
				sideWalkers: true,
				horseLeaders: true,
			},
		}),
		horses: await prisma.horse.findMany(),
		instructors,
	})
}

const horseSchema = z.object({
	id: z.string(),
	name: z.string(),
})

const instructorSchema = z.object({
	id: z.string(),
	name: z.string(),
	username: z.string(),
})

const createEventSchema = z.object({
	title: z.string().min(1, 'Title is required'),
	startDate: z.coerce.date(),
	duration: z.coerce.number().gt(0),
	horses: z.array(horseSchema).optional(),
	instructor: instructorSchema,
	cleaningCrewReq: z.coerce.number().gt(-1),
	lessonAssistantsReq: z.coerce.number().gt(-1),
	sideWalkersReq: z.coerce.number().gt(-1),
	horseLeadersReq: z.coerce.number().gt(-1),
	isPrivate: checkboxSchema(),
})

export async function action({ request }: ActionArgs) {
	await requireAdmin(request)
	const body = await request.formData()
	const submission = formParse(body, {
		schema: () => {
			return createEventSchema
		},
	})
	if (!submission.value) {
		return json(
			{
				status: 'error',
				submission,
			} as const,
			{ status: 400 },
		)
	}

	const title = submission.value.title
	const start = submission.value.startDate
	const end = addMinutes(start, submission.value.duration)

	const instructorId = submission.value.instructor.id
	const horseIds = submission.value.horses?.map(e => {
		return { id: e.id }
	})

	const cleaningCrewReq = submission.value.cleaningCrewReq
	const lessonAssistantsReq = submission.value.lessonAssistantsReq
	const sideWalkersReq = submission.value.sideWalkersReq
	const horseLeadersReq = submission.value.horseLeadersReq

	const isPrivate = submission.value.isPrivate

	await prisma.event.create({
		data: {
			title,
			start,
			end,
			instructors: {
				connect: { id: instructorId },
			},
			horses: {
				connect: horseIds ?? [],
			},
			cleaningCrewReq,
			lessonAssistantsReq,
			sideWalkersReq,
			horseLeadersReq,
			isPrivate,
		},
	})

	return json(
		{
			status: 'success',
			submission,
		},
		{ status: 200 },
	)
}

export default function Schedule() {
	const data = useLoaderData<typeof loader>()
	const events = data.events
	const horses = data.horses
	const instructors = data.instructors
	const user = useUser()
	const userIsAdmin = user.roles.find(role => role.name === 'admin')
	const [registerOpen, setRegisterOpen] = useState(false)
	const [selectedEvent, setSelectedEvent] = useState(events[0])

	const [filterFlag, setFilterFlag] = useState(false)

	const eventsThatNeedHelp = events.filter((event: (typeof events)[number]) => {
		return (
			event.cleaningCrewReq > event.cleaningCrew.length ||
			event.lessonAssistantsReq > event.lessonAssistants.length ||
			event.horseLeadersReq > event.horseLeaders.length ||
			event.sideWalkersReq > event.sideWalkers.length
		)
	})

	const handleSelectEvent = (calEvent: (typeof events)[number]) => {
		setSelectedEvent(calEvent)
		setRegisterOpen(!registerOpen)
	}

	return (
		<div className="grid place-items-center gap-2">
			<h1 className="mb-5 text-5xl">Calendar</h1>
			<div className="flex gap-2">
				<Checkbox
					checked={filterFlag}
					onCheckedChange={() => setFilterFlag(!filterFlag)}
					id="filter"
				/>
				<Label htmlFor="filter">
					Show only events that need more volunteers
				</Label>
			</div>
			<div className="h-screen min-h-[700px] w-screen max-w-6xl">
				<Calendar
					localizer={localizer}
					events={filterFlag ? eventsThatNeedHelp : events}
					startAccessor="start"
					endAccessor="end"
					onSelectEvent={handleSelectEvent}
					style={{
						height: '100%',
						width: '100%',
						backgroundColor: 'white',
						color: 'black',
						padding: 20,
						borderRadius: '1.5rem',
					}}
				/>
			</div>

			<Dialog open={registerOpen} onOpenChange={setRegisterOpen}>
				<RegistrationDialogue
					selectedEventId={selectedEvent?.id}
					events={events}
				/>
			</Dialog>

			{userIsAdmin ? (
				<CreateEventDialog horses={horses} instructors={instructors} />
			) : null}
		</div>
	)
}

interface RegistrationProps {
	events: EventWithVolunteers[]
	selectedEventId: string
}

function RegistrationDialogue({ selectedEventId, events }: RegistrationProps) {
	const registrationFetcher = useFetcher()
	const user = useUser()
	const userIsAdmin = user.roles.find(role => role.name === 'admin')
	const userIsLessonAssistant =
		user.roles.find(role => role.name === 'lessonAssistant') != undefined
	const userIsHorseLeader =
		user.roles.find(role => role.name === 'horseLeader') != undefined

	const isSubmitting = registrationFetcher.state === 'submitting'

	const calEvent = events.find(event => event.id === selectedEventId)
	if (!calEvent) {
		return null
	}

	let isRegistered = false
	let volunteerTypeIdx = 0
	for (const role of volunteerTypes) {
		const found = calEvent[role.field].find(
			volunteer => volunteer.id === user.id,
		)
		if (found) {
			isRegistered = true
			break
		}
		volunteerTypeIdx += 1
	}
	if (!isRegistered) {
		volunteerTypeIdx = 0
	}
	const registeredAs = volunteerTypes[volunteerTypeIdx]

	const helpNeeded =
		calEvent.cleaningCrewReq > calEvent.cleaningCrew.length ||
		calEvent.lessonAssistantsReq > calEvent.lessonAssistants.length ||
		calEvent.horseLeadersReq > calEvent.horseLeaders.length ||
		calEvent.sideWalkersReq > calEvent.sideWalkers.length

	const now = new Date();
	let hasPassed = false;
	if (isAfter(now, calEvent.end)) {
		hasPassed = true;
	}

	return (
		<DialogContent>
			<DialogHeader>
				<DialogTitle className="text-h4">
					{calEvent.title} - Volunteer Registration
				</DialogTitle>
				<div className="flex flex-wrap items-center justify-between">
					<p>
						{calEvent.start.toLocaleDateString()}, {format(calEvent.start, 'p')}{' '}
						- {format(calEvent.end, 'p')}
					</p>
					{userIsAdmin ? (
						<Button asChild size="sm">
							<Link to={`/calendar/${calEvent.id}`}>Manage Event</Link>
						</Button>
					) : null}
				</div>
				{userIsAdmin ? (
					<p>
						This event is{' '}
						{calEvent.isPrivate
							? 'private (can only be seen by administrators)'
							: 'public (can be seen by everyone)'}
					</p>
				) : null}
			</DialogHeader>
			{hasPassed ? <div className="text-2xl">This event has already passed.</div> :
			<>
			<DialogDescription>
				{isRegistered ? 'Manage registration' : 'Select a role to volunteer in'}
			</DialogDescription>
			<registrationFetcher.Form
				method="post"
				action="/resources/event-register"
			>
				<Input type="hidden" name="eventId" value={calEvent.id}></Input>
				<RadioGroup
					name="role"
					defaultValue={
						isRegistered ? volunteerTypes[volunteerTypeIdx].field : undefined
					}
					disabled={isRegistered}
				>
					<ul className="pb-4">
						{volunteerTypes.map(volunteerType => {
							const spotsLeft =
								calEvent[`${volunteerType.field}Req`] -
								calEvent[volunteerType.field].length

							const isFull =
								calEvent[volunteerType.reqField] <=
								calEvent[volunteerType.field].length

							let hasPermissions = true
							if (volunteerType.field == 'lessonAssistants') {
								hasPermissions = userIsLessonAssistant
							} else if (volunteerType.field == 'horseLeaders') {
								hasPermissions = userIsHorseLeader
							}

							return (
								<li
									key={volunteerType.field}
									className="items-left m-2 flex flex-col"
								>
									<div className="flex justify-between">
										<div className="flex items-center">
											<RadioGroupItem
												disabled={isFull || !hasPermissions}
												className="mr-2 aria-disabled:bg-muted"
												id={volunteerType.field}
												value={volunteerType.field}
											/>
											<Label
												htmlFor={volunteerType.field}
												className={
													isFull || !hasPermissions
														? 'text-muted-foreground'
														: ''
												}
											>
												<span className="capitalize">
													{volunteerType.displayName}:
												</span>{' '}
												{spotsLeft === 0
													? 'this position is full'
													: spotsLeft === 1
													? 'there is 1 spot left'
													: `there are ${spotsLeft} spots left`}
											</Label>
										</div>
										<Popover>
											<PopoverTrigger>
												<Info size="20" />
											</PopoverTrigger>
											<PopoverContent side={'top'}>
												<p className="max-w-[250px]">
													{volunteerType.description}
												</p>
											</PopoverContent>
										</Popover>
									</div>
									{!hasPermissions ? (
										<div className="max-w-xs text-xs text-muted-foreground">
											You do not have permission to volunteer in this role.
											<br />
											For more information, speak to the volunteer coordinator.
										</div>
									) : null}
								</li>
							)
						})}
					</ul>
				</RadioGroup>
				{!isRegistered ? null : (
					<>
						<div className="pb-4">
							<input type="hidden" name="role" value={registeredAs.field} />
							You are registered to volunteer in this event as one of the{' '}
							{registeredAs.displayName}.
						</div>
					</>
				)}
				<DialogFooter>
					{isSubmitting ? (
						<div>Processing...</div>
					) : isRegistered ? (
						<Button
							type="submit"
							name="_action"
							value="unregister"
							variant="destructive"
						>
							{' '}
							Unregister
						</Button>
					) : (
						<Button
							className=""
							type="submit"
							name="_action"
							value="register"
							disabled={!helpNeeded}
						>
							Register
						</Button>
					)}
					<DialogClose autoFocus={false} />
				</DialogFooter>
			</registrationFetcher.Form>
</>
			}
		</DialogContent>
	)
}

interface CreateEventDialogProps {
	horses: HorseData[]
	instructors: UserData[]
}

function CreateEventDialog({ horses, instructors }: CreateEventDialogProps) {
	const [open, setOpen] = useState(false)

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button className="mt-5">
					<Icon className="text-body-md" name="plus">
						Create New Event
					</Icon>
				</Button>
			</DialogTrigger>
			<DialogContent className="">
				<DialogHeader>
					<DialogTitle>Create Event</DialogTitle>
					<DialogDescription>
						Submit this form to create a new event. If it is public, volunteers
						will be able to see it on the calendar and to register to help.
					</DialogDescription>
				</DialogHeader>
				<CreateEventForm
					horses={horses}
					instructors={instructors}
					doneCallback={() => setOpen(false)}
				/>
				<DialogClose asChild>
					<button aria-label="Close" className="absolute right-10 top-10">
						<Icon name="cross-1" />
					</button>
				</DialogClose>
			</DialogContent>
		</Dialog>
	)
}

interface EventFormProps extends CreateEventDialogProps {
	doneCallback?: Function
}

function CreateEventForm({
	horses,
	instructors,
	doneCallback,
}: EventFormProps) {
	const actionData = useActionData<typeof action>()
	const { toast } = useToast()

	const navigation = useNavigation()
	const formAction = useFormAction()

	const isSubmitting =
		navigation.state === 'submitting' &&
		navigation.formAction === formAction &&
		navigation.formMethod === 'POST'

	const [form, fields] = useForm({
		id: 'create-event',
		lastSubmission: actionData?.submission,
		defaultValue: {
			cleaningCrewReq: 0,
			horseLeadersReq: 0,
			sideWalkersReq: 0,
			lessonAssistantsReq: 0,
		},
		shouldRevalidate: 'onSubmit',
	})

	useResetCallback(actionData, () => {
		if (!actionData) {
			return
		}
		if (actionData.status == 'success') {
			toast({
				title: 'Success',
				description: `Created event "${actionData.submission?.value?.title}".`,
			})
			if (doneCallback) {
				doneCallback()
			}
		} else {
			toast({
				variant: 'destructive',
				title: 'Error creating event',
				description: 'Failed to create event. There was an unexpected error.',
			})
		}
	})

	return (
		<Form method="post" {...form.props}>
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
					<Select name="duration" defaultValue="30">
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
					<Label htmlFor="horses">Horses</Label>
					<HorseListbox name="horses" horses={horses} />
				</div>
				<div className="col-span-2 sm:col-span-1">
					<Label htmlFor="instructor">Instructor</Label>
					<InstructorListbox name="instructor" instructors={instructors} />
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
						min: 0,
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
						min: 0,
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
						min: 0,
					}}
					errors={fields.sideWalkersReq.errors}
				/>
				<Field
					className="col-span-2 sm:col-span-1"
					labelProps={{
						htmlFor: fields.horseLeadersReq.id,
						children: 'Horse leaders needed',
					}}
					inputProps={{
						...conform.input(fields.horseLeadersReq),
						type: 'number',
						min: 0,
					}}
					errors={fields.horseLeadersReq.errors}
				/>
				<CheckboxField
					className="col-span-2"
					labelProps={{
						htmlFor: fields.isPrivate.id,
						children: 'Private (only visible to admins)',
					}}
					buttonProps={{
						...conform.input(fields.isPrivate),
						defaultChecked: false,
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
	)
}
