import { faker } from '@faker-js/faker'
import bcrypt from 'bcryptjs'
import { addMinutes } from 'date-fns'
import { UniqueEnforcer } from 'enforce-unique'
import { prisma } from '~/utils/db.server.ts'

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

export async function createEvent(start: Date) {
    const users = await prisma.user.findMany()
    const allHorses = await prisma.horse.findMany()
    const horses = faker.helpers.arrayElements(allHorses, { min: 1, max: 5})
    const duration = faker.helpers.arrayElement([30, 60, 90])

    const instructor = users.find(user => user.instructor)
		if (!instructor) {
			throw new Error("no instructors in database")
		}

		const reqs: number[] = Array.from({length: 5}, (_) => faker.number.int(4))

    let volunteers = users.filter(user => !user.instructor).sort(
		() => 0.5 - Math.random())

		let assignments: { id: string }[][] = Array.from({length: 5}, (_) => [])
		for (let req of reqs) {
			for (let i = Math.floor(req/2); i > 0; i--) {
				const volunteer = volunteers.pop()
				if (volunteer != undefined) {
				  assignments[req].push({ id: volunteer.id})
				}
			}
		}
    await prisma.event.create({
      data: {
          title: faker.lorem.sentence(5),
          start,
          end: addMinutes(start, duration),
					instructors: {
						connect: {id: instructor.id }
					},
          horses: {
            connect: horses.map(horse => {return {id: horse.id}}) 
          },
					barnCrewReq: reqs[0],
					pastureCrewReq: reqs[1],
					lessonAssistantsReq: reqs[2],
					horseLeadersReq: reqs[3],
					sideWalkersReq: reqs[4],

					barnCrew: {
						connect: assignments[0]
					},
					pastureCrew: {
						connect: assignments[1]
					},
					lessonAssistants: {
						connect: assignments[2]
					},
					horseLeaders: {
						connect: assignments[3]
					},
					sideWalkers: {
						connect: assignments[4]
					},
			}
    })
}
