import { z } from 'zod'

export const checkboxSchema = (msgWhenRequired?: string) => {
	const transformedValue = z
		.literal('on')
		.optional()
		.transform(value => value === 'on')
	return msgWhenRequired
		? transformedValue.refine(_ => _, { message: msgWhenRequired })
		: transformedValue
}

export const optionalDateSchema = z.preprocess(arg =>  {
	if (typeof arg !== 'string') {
		return undefined
	}
	if (arg != '') {
		return new Date(arg)
	}
	return undefined 
}, z.date().optional())

export const optionalDateTimeZoneSchema = z.union([
	z.string()
		.transform(date => date + 'T00:00:00-07:00')
		.pipe(z.coerce.date()),
	z.string()
		.nullish()
		.transform(date => null),
])