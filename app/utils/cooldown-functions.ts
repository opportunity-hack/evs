import { add, format } from 'date-fns'

interface Horse {
	id: String
	name: String
	cooldownStartDate?: Date | undefined
	cooldownEndDate?: Date | undefined
}

export function isCooldownDateConflict(horse: Horse, date: Date) {
	if (horse.cooldownStartDate && horse.cooldownEndDate) {
		if (
			horse.cooldownStartDate <= date &&
			date < add(horse.cooldownEndDate, { days: 1 })
		)
			return true
	}
	return false
}

export function horseDateConflicts(horse: Horse, datesArr: Array<Date>) {
	let conflictingDatesArr = datesArr.filter(date =>
		isCooldownDateConflict(horse, date),
	)
	if (conflictingDatesArr.length > 0) {
		return { name: horse.name, conflictingDatesArr }
	} else return null
}

export function renderHorseConflictMessage(
	horseArr: Array<{ name: String; conflictingDatesArr: Array<Date> }>,
) {
	let message = ''
	horseArr.forEach(horse => {
		const datesString = horse.conflictingDatesArr
			.sort((a:Date, b:Date) => a.valueOf() - b.valueOf())
			.map(date => format(date, 'PP'))
			.join(', ')
		message = message + `${horse.name} (${datesString}), `
	})
	return message.slice(0, -2);
}
