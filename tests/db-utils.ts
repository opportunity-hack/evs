import { faker } from '@faker-js/faker'
import bcrypt from 'bcryptjs'
import { UniqueEnforcer } from 'enforce-unique'

const uniqueUsernameEnforcer = new UniqueEnforcer()

export function createUser() {
	const firstName = faker.person.firstName()
	const lastName = faker.person.lastName()

	const username = uniqueUsernameEnforcer
		.enforce(() => {
			return faker.internet.userName({
				firstName: firstName.toLowerCase(),
				lastName: lastName.toLowerCase(),
			})
		})
		.slice(0, 20)
		.replace(/[^a-z0-9_]/g, '_')
	return {
		username,
		name: `${firstName} ${lastName}`,
		email: `${username}@example.com`,
    instructor: faker.datatype.boolean(),
	}
}

export function createPassword(username: string = faker.internet.userName()) {
	return {
		hash: bcrypt.hashSync(username, 10),
	}
}

export function createHorse() {
    const name = faker.person.firstName()

    const exampleStatuses = [
      "Ready and raring to go",
      "Ok",
      "Unwell",
      "Tired",
    ]
    const exampleNotes = [
      "A little ornery; needs experienced, careful riders and handlers.",
      "Very easy going. Good for beginner handlers and riders.",
      "Easily spooked, riders and handlers need to be aware of their surroundings.",
      "Very social. Needs a firm handler",
    ]

    const notes = exampleNotes[Math.floor(Math.random() * exampleNotes.length)]
    const status = exampleStatuses[Math.floor(Math.random() * exampleStatuses.length)]

    return {
      name,
      notes,
      status,
    }
}
