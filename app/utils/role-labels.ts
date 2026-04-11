/**
 * Maps the internal volunteer slot field names to human-readable display names
 * based on the organization's animal type. This allows orgs working with
 * different animals to see contextually appropriate role names without
 * changing the underlying schema.
 */

interface RoleLabels {
	cleaningCrew: string
	sideWalkers: string
	lessonAssistants: string
	animalHandlers: string
}

const defaultLabels: RoleLabels = {
	cleaningCrew: 'cleaning crew',
	sideWalkers: 'support volunteers',
	lessonAssistants: 'session assistants',
	animalHandlers: 'animal handlers',
}

const labelsByAnimalType: Record<string, Partial<RoleLabels>> = {
	horses: {
		sideWalkers: 'side walkers',
		lessonAssistants: 'lesson assistants',
		animalHandlers: 'horse leaders',
	},
	dogs: {
		sideWalkers: 'dog walkers',
		lessonAssistants: 'activity assistants',
		animalHandlers: 'dog handlers',
	},
	cats: {
		sideWalkers: 'socialization helpers',
		lessonAssistants: 'session assistants',
		animalHandlers: 'cat handlers',
	},
	wildlife: {
		sideWalkers: 'habitat assistants',
		lessonAssistants: 'program assistants',
		animalHandlers: 'wildlife handlers',
	},
}

export function getRoleLabels(animalType?: string | null): RoleLabels {
	const overrides = animalType ? labelsByAnimalType[animalType] : undefined
	return { ...defaultLabels, ...overrides }
}

interface RoleDescription {
	cleaningCrew: string
	sideWalkers: string
	lessonAssistants: string
	animalHandlers: string
}

const defaultDescriptions: RoleDescription = {
	cleaningCrew:
		'Cleaning crew volunteers help maintain the facility, check waterers, sweep common areas, and handle other miscellaneous cleaning tasks. No prior experience with animals is required.',
	sideWalkers:
		'Support volunteers assist participants during sessions. No prior experience with animals needed.',
	lessonAssistants:
		'Session assistants should have 1+ years of experience with the animals. They assist instructors and communicate effectively with both participants and staff.',
	animalHandlers:
		'Animal handlers guide and manage animals during sessions. Should have 1+ years of experience with animals.',
}

const descriptionsByAnimalType: Record<string, Partial<RoleDescription>> = {
	horses: {
		sideWalkers:
			'Side walkers walk alongside riders helping to support them during lessons. No prior experience with horses needed. Must be able to walk on uneven surfaces.',
		lessonAssistants:
			'Lesson assistants should have 1+ years of experience with horses. They must be able to groom and tack horses, and to communicate effectively with both students and instructors.',
		animalHandlers:
			'Horse leaders lead horses during lessons. Should have 1+ years of experience with horses, and must be able to walk on uneven surfaces.',
	},
	dogs: {
		sideWalkers:
			'Dog walkers take dogs on scheduled walks and help with socialization activities. Must be comfortable handling dogs of varying sizes.',
		lessonAssistants:
			'Activity assistants help run training sessions and enrichment programs. Should have experience with dog behavior and basic commands.',
		animalHandlers:
			'Dog handlers manage dogs during adoption events and therapy visits. Should have 1+ years of experience with dogs.',
	},
}

export function getRoleDescriptions(
	animalType?: string | null,
): RoleDescription {
	const overrides = animalType
		? descriptionsByAnimalType[animalType]
		: undefined
	return { ...defaultDescriptions, ...overrides }
}
