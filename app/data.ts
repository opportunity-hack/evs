import { Prisma } from '@prisma/client'
import { getRoleLabels, getRoleDescriptions } from '~/utils/role-labels.ts'

export const siteName = 'The Barn Volunteer Portal'
export const siteEmailAddress = 'hello@thebarnaz.com'
export const siteEmailAddressWithName =
	siteName + ' <hello@thebarnaz.com>'
export const siteBaseUrl = 'https://thebarnaz.com'

/** Volunteer role field names — stable identifiers used in schema and forms */
export const volunteerFields = [
	'cleaningCrew',
	'sideWalkers',
	'lessonAssistants',
	'animalHandlers',
] as const

export type VolunteerField = (typeof volunteerFields)[number]

export const volunteerReqFields = {
	cleaningCrew: 'cleaningCrewReq',
	sideWalkers: 'sideWalkersReq',
	lessonAssistants: 'lessonAssistantsReq',
	animalHandlers: 'animalHandlersReq',
} as const

export type VolunteerReqField =
	(typeof volunteerReqFields)[VolunteerField]

/**
 * Returns volunteer type metadata with display names and descriptions
 * adapted to the organization's animal type. Falls back to generic labels
 * when no animalType is provided.
 */
export function getVolunteerTypes(animalType?: string | null) {
	const labels = getRoleLabels(animalType)
	const descriptions = getRoleDescriptions(animalType)

	return volunteerFields.map(field => ({
		displayName: labels[field],
		field,
		reqField: volunteerReqFields[field],
		description: descriptions[field],
	}))
}

/** Type-safe volunteer type entry for use in components that index into events */
export interface VolunteerTypeEntry {
	displayName: string
	field: VolunteerField
	reqField: VolunteerReqField
	description: string
}

/**
 * Default volunteer types using horse-specific labels for backward
 * compatibility with the existing equestrian customer. Use
 * getVolunteerTypes(animalType) when org context is available.
 */
export const volunteerTypes: VolunteerTypeEntry[] = getVolunteerTypes()

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

/** Safely index into an event by volunteer field name */
export function getVolunteers<
	T extends Record<VolunteerField, unknown[]>,
>(event: T, field: VolunteerField): T[VolunteerField] {
	return event[field]
}

/** Safely index into an event by volunteer req field name */
export function getVolunteerReq<
	T extends Record<VolunteerReqField, number>,
>(event: T, reqField: VolunteerReqField): number {
	return event[reqField]
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
