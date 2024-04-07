import { z } from 'zod'
import { requireUserId } from '~/utils/auth.server.ts'
import { parse } from '@conform-to/zod'
import { json, type DataFunctionArgs } from '~/remix.ts'
import { prisma } from '~/utils/db.server.ts'
import { sendEmail } from '~/utils/email.server.ts'
import {
	RegistrationEmail,
	RegistrationNoticeForAdmins,
} from './registration-emails.server.tsx'
import { UnregistrationEmail } from './unregistration-emails.server.tsx'
import { createEvent, type DateArray } from 'ics'
import type { User, Event } from '@prisma/client'
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

	const user = await prisma.user.findUnique({
		where: { id: userId },
		include: { roles: true },
	})
	if (!user) {
		throw json({ error: 'No user found' }, { status: 404 })
	}

	if (submission.value._action === 'unregister') {
		const event = await prisma.event.update({
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

		sendEmail({
			to: user.email,
			subject: `Event Unregistration Notification`,
			attachments: [],
			react: <UnregistrationEmail event={event} role={submission.value.role} />,
		}).then(result => {
			if (result.status == 'error') {
				// TODO: think through this case and how to handle it properly
				console.error(
					'There was an error sending an event registration email: ',
					JSON.stringify(result.error),
				)
			}
		})

		notifyAdmins({
			user: user,
			event: event,
			role: submission.value.role,
			action: 'unregister',
		})
		return json(
			{
				status: 'successfully unregistered',
				submission,
			} as const,
			{ status: 200 },
		)
	}

	if (submission.value.role == 'lessonAssistants') {
		if (!user.roles.find(role => role.name === 'lessonAssistant')) {
			throw json({ error: 'Missing permissions' }, { status: 403 })
		}
	}
	if (submission.value.role == 'horseLeaders') {
		if (!user.roles.find(role => role.name === 'horseLeader')) {
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

	if (invite === '') {
		console.error(
			'There was an error generating an invite for the following event:',
			JSON.stringify(event),
		)
		return json(
			{
				status: 'error',
				message: 'Error generating event invite',
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

	notifyAdmins({
		user: user,
		event: event,
		role: submission.value.role,
		action: 'register',
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

	const endDate = new Date(event.start.getTime() + duration * 60000)

	let icalEvent = {
		start: [year, month, day, hour, minute] as DateArray,
		end: [
			endDate.getFullYear(),
			endDate.getMonth() + 1,
			endDate.getDate(),
			endDate.getHours(),
			endDate.getMinutes(),
		] as DateArray,
		// duration: { minutes: duration }, // Not sure this is used
		title: event.title,
		organizer: { name: 'Volunteer Coordinator', email: siteEmailAddress },
	}

	const invite = createEvent(icalEvent)
	if (invite.error) {
		console.error(invite.error)
		return ''
	}
	// Log the event as a string
	console.log('Calendar invite: ' + invite.value)

	// Check if invite.value is a string
	if (typeof invite.value === 'string') {
		// Convert to a buffer
		const inviteBuffer = Buffer.from(invite.value)
		return inviteBuffer
	}

	return ''
}

async function notifyAdmins({
	event,
	role,
	action,
	user,
}: {
	event: Event
	role: 'cleaningCrew' | 'lessonAssistants' | 'sideWalkers' | 'horseLeaders'
	action: 'register' | 'unregister'
	user: User
}) {
	const admins = await prisma.user.findMany({
		where: { roles: { some: { name: 'admin' } } },
	})

	for (const admin of admins) {
		sendEmail({
			to: admin.email,
			subject: `${user.name} ${action}ed as a volunteer for ${event.title}`,
			react: (
				<RegistrationNoticeForAdmins
					user={user}
					event={event}
					role={role}
					action={action}
				/>
			),
		}).then(result => {
			if (result.status == 'error') {
				// TODO: think through this case and how to handle it properly
				console.error(
					'There was an error sending an volunteer registration notification email: ',
					JSON.stringify(result.error),
				)
			}
		})
	}
}
