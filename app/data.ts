import { Prisma } from '@prisma/client'

export const siteName = 'The Barn Volunteer Portal'
export const siteEmailAddress = 'hello@thebarnaz.com'
export const siteEmailAddressWithName =
	siteName + ' <hello@thebarnaz.com>'
export const siteBaseUrl = 'https://thebarnaz.com'

export const volunteerTypes = [
	{
		displayName: 'cleaning crew',
		field: 'cleaningCrew',
		reqField: 'cleaningCrewReq',
		description:
			'Cleaning crew volunteers help maintain the facility, check waterers, sweep common areas, and handle other miscellaneous cleaning tasks. No prior experience with animals is required.',
	},
	{
		displayName: 'side walkers',
		field: 'sideWalkers',
		reqField: 'sideWalkersReq',
		description:
			'Side walkers walk alongside participants helping to support them during sessions. No prior experience with animals needed. Must be able to walk on uneven surfaces.',
	},
	{
		displayName: 'lesson assistants',
		field: 'lessonAssistants',
		reqField: 'lessonAssistantsReq',
		description:
			'Lesson assistants should have 1+ years of experience with the animals. They assist instructors and communicate effectively with both participants and staff.',
	},
	{
		displayName: 'animal handlers',
		field: 'animalHandlers',
		reqField: 'animalHandlersReq',
		description:
			'Animal handlers guide and manage animals during sessions. Should have 1+ years of experience with animals, and must be able to walk on uneven surfaces.',
	},
] as const

export interface UserData {
	id: string
	name: string | null
	username: string
	imageId: string | null
	phone: string | null
	notes: string | null
	birthdate: Date | null
	height: number | null
	yearsOfExperience: number | null
}

export interface AnimalData {
	id: string
	name: string
	imageId: string | null
	status: string | null
	notes: string | null
	cooldown: boolean
	cooldownStartDate: Date | null
	cooldownEndDate: Date | null
}

export interface AnimalAssignment {
	userId: string
	animalId: string
}

export interface CalEvent {
	id: string
	title: string
	start: Date
	end: Date

	instructors: UserData[]
	animals: AnimalData[]

	cleaningCrewReq: number
	lessonAssistantsReq: number
	animalHandlersReq: number
	sideWalkersReq: number

	cleaningCrew: UserData[]
	lessonAssistants: UserData[]
	animalHandlers: UserData[]
	sideWalkers: UserData[]
}

const EventWithAllRelations = Prisma.validator<Prisma.EventArgs>()({
	include: {
		animals: true,
		instructors: true,
		cleaningCrew: true,
		lessonAssistants: true,
		animalHandlers: true,
		sideWalkers: true,
		animalAssignments: true,
	},
})

export type EventWithAllRelations = Prisma.EventGetPayload<
	typeof EventWithAllRelations
>
const EventWithVolunteers = Prisma.validator<Prisma.EventArgs>()({
	include: {
		animals: true,
		instructors: true,
		cleaningCrew: true,
		lessonAssistants: true,
		animalHandlers: true,
		sideWalkers: true,
	},
})

export type EventWithVolunteers = Prisma.EventGetPayload<
	typeof EventWithVolunteers
>
