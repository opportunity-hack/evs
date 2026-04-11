import { add, format } from 'date-fns'

interface Animal {
	id: String
	name: String
	cooldownStartDate?: Date | undefined
	cooldownEndDate?: Date | undefined
}

export function isCooldownDateConflict(animal: Animal, date: Date) {
	if (animal.cooldownStartDate && animal.cooldownEndDate) {
		if (
			animal.cooldownStartDate <= date &&
			date < add(animal.cooldownEndDate, { days: 1 })
		)
			return true
	}
	return false
}

export function animalDateConflicts(animal: Animal, datesArr: Array<Date>) {
	let conflictingDatesArr = datesArr.filter(date =>
		isCooldownDateConflict(animal, date),
	)
	if (conflictingDatesArr.length > 0) {
		return { name: animal.name, conflictingDatesArr }
	} else return null
}

export function renderAnimalConflictMessage(
	animalArr: Array<{ name: String; conflictingDatesArr: Array<Date> }>,
) {
	let message = ''
	animalArr.forEach(animal => {
		const datesString = animal.conflictingDatesArr
			.sort((a: Date, b: Date) => a.valueOf() - b.valueOf())
			.map(date => format(date, 'PP'))
			.join(', ')
		message = message + `${animal.name} (${datesString}), `
	})
	return message.slice(0, -2)
}
