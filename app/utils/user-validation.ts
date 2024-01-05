import { z } from 'zod'
import { convertFeetInchesIntoInches } from './length-conversions.ts'

export const usernameSchema = z
	.string()
	.min(3, { message: 'Username is too short' })
	.max(20, { message: 'Username is too long' })
	.regex(/^[a-zA-Z0-9_]+$/, {
		message: 'Username can only include letters, numbers, and underscores',
	})

export const passwordSchema = z
	.string()
	.min(6, { message: 'Password is too short' })
	.max(100, { message: 'Password is too long' })

export const nameSchema = z
	.string()
	.min(3, { message: 'Name is too short' })
	.max(40, { message: 'Name is too long' })

export const emailSchema = z
	.string()
	.email({ message: 'Email is invalid' })
	.min(3, { message: 'Email is too short' })
	.max(100, { message: 'Email is too long' })
	.transform(email => email.toLowerCase())

export const phoneSchema = z
	.string()
	.regex(/^\(?\d{3}\)?\s?-?\d{3}-?\d{4}$/, {
		message: 'Phone number must be ten digits',
	})
	.transform(phone => phone.replaceAll(/\D/g, ''))

export const yearsOfExperienceSchema = z
	.number({ invalid_type_error: 'Must input valid number' })
	.int({ message: 'must be integer' })
	.min(0)
	.nullish()
	.transform(value => (value === undefined ? null : value))

export const heightSchema = z
	.object({
		heightFeet: z
			.number({ invalid_type_error: 'Feet must be a number' })
			.int({ message: 'Feet must be an integer' })
			.min(0, { message: 'Feet must be between 0 and 8' })
			.max(8, { message: 'Feet must be between 0 and 8' })
			.optional()
			.transform(val => {
				if (val === undefined) return null
				else return val
			}),
		heightInches: z
			.number({ invalid_type_error: 'Inches must be a number' })
			.int({ message: 'Inches must be an integer' })
			.min(0, { message: 'Inches must be between 0 and 11' })
			.max(11, { message: 'Inches must be between 0 and 11' })
			.optional()
			.transform(val => {
				if (val === undefined) return null
				else return val
			}),
	})
	.refine(
		obj => {
			console.log('refine', obj.heightFeet, obj.heightInches)
			return (
				(typeof obj.heightFeet === 'number' &&
					typeof obj.heightInches === 'number') ||
				(!obj.heightFeet && !obj.heightInches)
			)
		},
		{ message: 'You must enter both feet and inches for height' },
	)
	.transform(val => {
		if (
			typeof val.heightFeet === 'number' &&
			typeof val.heightInches === 'number'
		) {
			return convertFeetInchesIntoInches(val.heightFeet, val.heightInches)
		} else return null
	})
