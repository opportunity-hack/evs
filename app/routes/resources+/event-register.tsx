import { z } from 'zod'
import { requireUserId } from '~/utils/auth.server.ts'
import { parse } from '@conform-to/zod'
import { json, type DataFunctionArgs } from '~/remix.ts'
import { prisma } from '~/utils/db.server.ts'
import { sendEmail } from '~/utils/email.server.ts'
import { RegistrationEmail } from './registration-emails.server.tsx'
import { createEvent, type DateArray } from 'ics'
import { type Event } from '@prisma/client'
import { differenceInMinutes } from 'date-fns'
import { siteEmailAddress } from '~/data.ts'

const actions = ['register', 'unregister'] as const

const volunteerTypes = [
	'cleaningCrew',
	'lessonAssistants',
	'sideWalkers',
	'horseLeaders',
] as const

const EventRegistrationSchema = z.object({
	_action: z.enum(actions),
	eventId: z.string(),
	role: z.enum(volunteerTypes),
})

export async function action({ request }: DataFunctionArgs) {
	const userId = await requireUserId(request)
	const formData = await request.formData()
	const submission = parse(formData, {
		schema: EventRegistrationSchema,
		acceptMultipleErrors: () => true,
	})

	if (!submission.value || submission.intent !== 'submit') {
		return json(
			{
				status: 'error',
				submission,
			} as const,
			{ status: 400 },
		)
	}

	if (submission.value._action === 'unregister') {
		await prisma.event.update({
			where: {
				id: submission.value.eventId,
			},
			data: {
				[submission.value.role]: {
					disconnect: {
						id: userId,
					},
				},
			},
		})
		return json(
			{
				status: 'successfully unregistered',
				submission,
			} as const,
			{ status: 200 },
		)
	}

	const user = await prisma.user.findUnique({
		where: { id: userId },
		select: { email: true, username: true, roles: true },
	})
	if (!user) {
		throw json({ error: 'No user found' }, { status: 404 })
	}

	if (submission.value.role == 'lessonAssistants') {
		if (!user.roles.find(role => role.name === 'lessonAssistant')) {
			throw json({ error: 'Missing permissions' }, { status: 403 })
		}
	}
	if (submission.value.role == 'horseLeaders') {
		if (!user.roles.find(role => role.name === 'horseleader')) {
			throw json({ error: 'Missing permissions' }, { status: 403 })
		}
	}

	const event = await prisma.event.update({
		where: {
			id: submission.value.eventId,
		},
		data: {
			[submission.value.role]: {
				connect: {
					id: userId,
				},
			},
		},
	})
	if (!event) {
		throw json({ error: 'No event found' }, { status: 404 })
	}

	const invite = generateInvite(event)
	if (invite === "") {
		console.error(
			'There was an error generating an invite for the following event:',
			JSON.stringify(event),
		)
		return json(
			{
				status: 'error',
				message: "Error generating event invite",
				submission,
			} as const,
			{ status: 500 },
		)
	}
	
	sendEmail({
		to: user.email,
		subject: `Event Registration Notification`,
		attachments: [{ filename: 'invite.ics', content: invite }],
		react: <RegistrationEmail event={event} role={submission.value.role} />,
	}).then(result => {
		if (result.status == 'error') {
			// TODO: think through this case and how to handle it properly
			console.error(
				'There was an error sending an event registration email: ',
				JSON.stringify(result.error),
			)
		}
	})

	return json(
		{
			status: 'success',
			submission,
		} as const,
		{ status: 200 },
	)
}

function generateInvite(event: Event) {

	const year = event.start.getFullYear()
	const month = event.start.getMonth() + 1 // JS Date months are 0 indexed)
	const day = event.start.getDate()
	const hour = event.start.getHours()
	const minute = event.start.getMinutes()

	const duration = differenceInMinutes(event.end, event.start)
	
	let icalEvent = {
	  start: [year, month, day, hour, minute] as DateArray,
	  duration: { minutes: duration },
	  title: event.title,
	  organizer: { name: 'Volunteer Coordinator', email: siteEmailAddress },
	};

	let invite: string = "";
	createEvent(icalEvent, (error, value) => {
		if (error) {
			console.log(error);
			return;
		}
		invite = value;
	})

	return invite
}
