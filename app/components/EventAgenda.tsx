import { useUser } from '~/utils/user.ts'
import {
	volunteerTypes,
	getVolunteers,
	getVolunteerReq,
	type EventWithVolunteers,
	type VolunteerTypeEntry,
} from '~/data.ts'

interface PositionStatusProps {
	event: EventWithVolunteers
	volunteerType: VolunteerTypeEntry
}

function PositionStatus({ volunteerType, event }: PositionStatusProps) {
	const user = useUser()

	const volunteers = getVolunteers(event, volunteerType.field)
	const required = getVolunteerReq(event, volunteerType.reqField)
	const positionFilled = volunteers.length >= required
	const containerClass = `grid grid-cols-2 gap-4 ${
		positionFilled ? 'text-muted-foreground' : ''
	}`

	const userIsRegistered = (volunteers as { id: string }[])
		.map(u => u.id)
		.includes(user.id)
	const volunteerTypeClass = `capitalize ${
		userIsRegistered ? 'before:content-["✅"] before:pr-1' : ''
	}`

	const spotsLeft = required - volunteers.length

	if (required > 0)
		return (
			<div className={containerClass}>
				<div className={volunteerTypeClass}>{volunteerType.displayName}</div>
				<div className="whitespace-nowrap">
					{spotsLeft} spot{spotsLeft === 1 ? '' : 's'} left
				</div>
			</div>
		)
}

export function EventAgenda({ event }: { event: EventWithVolunteers }) {
	const eventIsUpcoming = event.end.valueOf() > new Date().valueOf()

	return (
		<div className="flex min-w-[25rem] gap-4">
			<div className="shrink-0 grow basis-40">{event.title}</div>
			<div className="flex shrink-0 grow basis-72 flex-col text-sm">
				<div className="max-w-sm">
					{eventIsUpcoming &&
						volunteerTypes.map(volunteerType => (
							<PositionStatus
								key={volunteerType.field}
								volunteerType={volunteerType}
								event={event}
							/>
						))}
				</div>
			</div>
		</div>
	)
}
