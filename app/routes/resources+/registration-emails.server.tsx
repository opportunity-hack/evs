import type { Event, User } from '@prisma/client'
import { Container, Html, Tailwind, Text } from '@react-email/components'
import tailwindConfig from '~/../tailwind.config.ts'
import { format } from 'date-fns'
import { volunteerTypes } from '~/data.ts'

export function RegistrationEmail({
	event,
	role,
}: {
	event: Event
	role: 'cleaningCrew' | 'lessonAssistants' | 'sideWalkers' | 'horseLeaders'
}) {
	let roleName
	for (let v of volunteerTypes) {
		if (v.field == role) {
			roleName = v.displayName
		}
	}

	return (
		<Tailwind config={tailwindConfig}>
			<Html lang="en" dir="ltr">
				<Container>
					<h1>
						<Text>Thanks for volunteering!</Text>
					</h1>
					<p>
						<Text>
							You've registered to volunteer{' '}
							{roleName ? `as one of the ${roleName}` : ''} to help with the
							following event:
						</Text>
						<Text>{event.title}</Text>
						<Text>On: {format(event.start, 'MMMM do, y')}</Text>
						<Text>
							From: {format(event.start, 'p')} - {format(event.end, 'p')}
						</Text>
					</p>
				</Container>
			</Html>
		</Tailwind>
	)
}
export function RegistrationNoticeForAdmins({
	event,
	role,
	action,
	user,
}: {
	event: Event
	role: 'cleaningCrew' | 'lessonAssistants' | 'sideWalkers' | 'horseLeaders',
	action: 'register' | 'unregister';
	user: User;
}) {
	let roleName
	for (let v of volunteerTypes) {
		if (v.field == role) {
			roleName = v.displayName
		}
	}

	return (
		<Tailwind config={tailwindConfig}>
			<Html lang="en" dir="ltr">
				<Container>
					<h1>
						<Text>Someone {action}ed as a volunteer</Text>
					</h1>
					<p>
						<Text>
							{user.name} has {action}ed {roleName ? `as one of the ${roleName}` : ''} for the following event:
						</Text>
						<Text>{event.title}</Text>
						<Text>On: {format(event.start, 'MMMM do, y')}</Text>
						<Text>
							From: {format(event.start, 'p')} - {format(event.end, 'p')}
						</Text>
					</p>
				</Container>
			</Html>
		</Tailwind>
	)
}