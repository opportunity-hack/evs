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

  const notes = [
    "Great with horses. A real horse whisperer.",
    "Very enthusiastic, does well with more active horses.",
    "Very gentle, works well with timid horses. ",
    "Still a bit afraid of horses, needs some support from others.",
  ]

	return {
		username,
		name: `${firstName} ${lastName}`,
		email: `${username}@example.com`,
    instructor: faker.datatype.boolean(),
    birthdate: faker.date.birthdate(),
    height: faker.number.int({ min: 60, max: 80 }),
    yearsOfExperience: faker.number.int({ min: 1, max: 10 }),
    notes: faker.helpers.arrayElement(notes)
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
      "Seems very happy",
      "Ready and raring to go",
      "Doing ok",
      "Unwell, needs rest.",
      "Restless, lots of energy.",
      "Tired. Don't schedule for consecutive events.",
    ]
    const exampleNotes = [
      "A little ornery; needs experienced, careful riders and handlers.",
      "Very easy going. Good for beginner handlers and riders.",
      "Easily spooked, riders and handlers need to be aware of their surroundings.",
      "Very social. Needs a firm handler.",
      "Is a very big and active horse.",
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
    const horses = faker.helpers.arrayElements(allHorses, { min: 3, max: 5})
    const duration = faker.helpers.arrayElement([30, 60, 90])

    const instructor = users.find(user => user.instructor)
		if (!instructor) {
			throw new Error("no instructors in database")
		}

		const reqs: number[] = Array.from({length: 4}, (_) => faker.number.int(4))

    let volunteers = users.filter(user => !user.instructor).sort(
		() => 0.5 - Math.random())

		let assignments: { id: string }[][] = Array.from({length: 4}, (_) => [])
		for (let req = 0; req < 4; req++) {
			for (let i = Math.floor(reqs[req]/2); i > 0; i--) {
				const volunteer = volunteers.pop()
				if (volunteer != undefined) {
				  assignments[req].push({ id: volunteer.id})
				}
			}
		}

    const eventTypes = ["Traditional Lesson", "Adaptive Lesson", "Therapy Group", "Birthday"]

    return {
          title: faker.helpers.arrayElement(eventTypes),
          start,
          end: addMinutes(start, duration),
					instructors: {
						connect: {id: instructor.id }
					},
          horses: {
            connect: horses.map(horse => {return {id: horse.id}}) 
          },
					cleaningCrewReq: reqs[0],
					lessonAssistantsReq: reqs[1],
					horseLeadersReq: reqs[2],
					sideWalkersReq: reqs[3],

					cleaningCrew: {
						connect: assignments[0]
					},
					lessonAssistants: {
						connect: assignments[1]
					},
					horseLeaders: {
						connect: assignments[2]
					},
					sideWalkers: {
						connect: assignments[3]
					},
			}
}
