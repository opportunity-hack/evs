import { useUser } from '~/utils/user.ts'
import { volunteerTypes, type EventWithVolunteers } from '~/data.ts'

type VolunteerTypes = typeof volunteerTypes
type VolunteerType = VolunteerTypes[number]

interface PositionStatusProps {
	event: EventWithVolunteers
	volunteerType: VolunteerType
}

function PositionStatus({ volunteerType, event }: PositionStatusProps) {
	const user = useUser()

	const filled =
		event[volunteerType.field].length >= event[volunteerType.reqField]
	const registeredUsers = event[volunteerType.field].map(user => user.id)
	const userIsRegistered = registeredUsers.includes(user.id)
	const className = `flex gap-4 justify-between ${
		filled ? 'text-muted-foreground' : ''
	}`
	const volunteerTypeClass = `capitalize ${
		userIsRegistered ? 'before:content-["✅"] before:pr-1' : ''
	}`

	if (event[volunteerType.reqField] > 0)
		return (
			<div className={className}>
				<div className={volunteerTypeClass}>{volunteerType.displayName}</div>
				<div className="whitespace-nowrap">
					{event[volunteerType.field].length} / {event[volunteerType.reqField]}
				</div>
			</div>
		)
}

export function EventAgenda({ event }: { event: EventWithVolunteers }) {
	return (
		<div className="flex min-w-[20rem] gap-4">
			<div className="basis-40">{event.title}</div>
			<div className="flex shrink-0 basis-40 flex-col text-sm">
				{volunteerTypes.map(volunteerType => (
					<PositionStatus
						key={volunteerType.field}
						volunteerType={volunteerType}
						event={event}
					/>
				))}
			</div>
		</div>
	)
}
