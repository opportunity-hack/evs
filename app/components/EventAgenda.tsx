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

	const positionFilled =
		event[volunteerType.field].length >= event[volunteerType.reqField]
	const containerClass = `grid grid-cols-2 gap-4 ${
		positionFilled ? 'text-muted-foreground' : ''
	}`

	const userIsRegistered = event[volunteerType.field]
		.map(user => user.id)
		.includes(user.id)
	const volunteerTypeClass = `capitalize ${
		userIsRegistered ? 'before:content-["✅"] before:pr-1' : ''
	}`

	const spotsLeft =
		event[volunteerType.reqField] - event[volunteerType.field].length

	if (event[volunteerType.reqField] > 0)
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
	return (
		<div className="flex min-w-[20rem] gap-4">
			<div className="grow basis-40">{event.title}</div>
			<div className="flex shrink-0 basis-72 flex-col text-sm">
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
