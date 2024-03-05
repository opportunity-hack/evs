export function convertFeetInchesIntoInches(
	feet: number,
	inches: number,
): number {
	return feet * 12 + inches
}

export function convertInchesToHeightObj(height: number) {
	const heightFeet = Math.floor(height / 12)
	const heightInches = height % 12
	return {
		heightFeet,
		heightInches,
	}
}

export function displayHeightFromInches(height: number) {
	const heightObj = convertInchesToHeightObj(height)
	return `${heightObj.heightFeet}'${heightObj.heightInches}"`
}
