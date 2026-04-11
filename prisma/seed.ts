import fs from 'fs'
import { faker } from '@faker-js/faker'
import {
	createPassword,
	createUser,
	createAnimal,
	createEvent,
} from 'tests/db-utils.ts'
import { prisma } from '~/utils/db.server.ts'
import { deleteAllData } from 'tests/setup/utils.ts'
import { getPasswordHash } from '~/utils/auth.server.ts'
import { addMinutes } from 'date-fns'

async function seed() {
	console.log('🌱 Seeding...')
	console.time(`🌱 Database has been seeded`)

	console.time('🧹 Cleaned up the database...')
	deleteAllData()
	console.timeEnd('🧹 Cleaned up the database...')

	console.time(`🏠 Created default organization...`)
	const defaultOrg = await prisma.organization.create({
		data: {
			name: 'Tumbling T Ranch',
			slug: 'tumbling-t-ranch',
			animalType: 'horses',
			description: 'Equestrian therapy nonprofit for individuals with disabilities',
			website: 'https://www.thebarnaz.com',
			isActive: true,
		},
	})
	console.timeEnd(`🏠 Created default organization...`)

	console.time(`👑 Created admin role/permission...`)
	const adminRole = await prisma.role.create({
		data: {
			name: 'admin',
			permissions: {
				create: { name: 'admin' },
			},
		},
	})
	console.timeEnd(`👑 Created admin role/permission...`)

	console.time(`🌐 Created superAdmin role/permission...`)
	const superAdminRole = await prisma.role.create({
		data: {
			name: 'superAdmin',
			permissions: {
				create: { name: 'superAdmin' },
			},
		},
	})
	console.timeEnd(`🌐 Created superAdmin role/permission...`)

	console.time(`Created lesson assistant role/permission...`)
	const lessonAssistantRole = await prisma.role.create({
		data: {
			name: 'lessonAssistant',
			permissions: {
				create: { name: 'lessonAssistant' },
			},
		},
	})
	console.timeEnd(`Created lesson assistant role/permission...`)

	console.time(`Created animal handler role/permission...`)
	const animalHandlerRole = await prisma.role.create({
		data: {
			name: 'animalHandler',
			permissions: {
				create: { name: 'animalHandler' },
			},
		},
	})
	console.timeEnd(`Created animal handler role/permission...`)

	console.time(`Created instructor role/permission...`)
	const instructorRole = await prisma.role.create({
		data: {
			name: 'instructor',
			permissions: {
				create: { name: 'instructor' },
			},
		},
	})
	console.timeEnd(`Created instructor role/permission...`)

	const totalUsers = 40
	console.time(`👤 Created ${totalUsers} users...`)
	const users = await Promise.all(
		Array.from({ length: totalUsers }, async (_, index) => {
			const userData = createUser()
			const user = await prisma.user.create({
				data: {
					...userData,
					org: { connect: { id: defaultOrg.id } },
					password: {
						create: createPassword(userData.username),
					},
					image: {
						create: {
							contentType: 'image/jpeg',
							file: {
								create: {
									blob: await fs.promises.readFile(
										`./tests/fixtures/images/user/${index % 10}.jpg`,
									),
								},
							},
						},
					},
				},
			})
			return user
		}),
	)
	console.timeEnd(`👤 Created ${totalUsers} users...`)

	console.time(
		`🐨 Created user "kody" with the password "kodylovesyou" and admin role`,
	)
	await prisma.user.create({
		data: {
			email: 'kody@kcd.dev',
			username: 'kody',
			name: 'Kody',
			org: { connect: { id: defaultOrg.id } },
			roles: { connect: { id: adminRole.id } },
			image: {
				create: {
					contentType: 'image/png',
					file: {
						create: {
							blob: await fs.promises.readFile(
								'./tests/fixtures/images/user/kody.png',
							),
						},
					},
				},
			},
			password: {
				create: {
					hash: await getPasswordHash('kodylovesyou'),
				},
			},
		},
	})
	console.timeEnd(
		`🐨 Created user "kody" with the password "kodylovesyou" and admin role`,
	)

	console.time(
		`🙍 Created user "Bob" with the password "bobnotadmin" and no role`,
	)
	await prisma.user.create({
		data: {
			email: 'bob@not.admin',
			username: 'bob',
			name: 'Bob',
			org: { connect: { id: defaultOrg.id } },
			image: {
				create: {
					contentType: 'image/png',
					file: {
						create: {
							blob: await fs.promises.readFile(
								'./tests/fixtures/images/user/1.jpg',
							),
						},
					},
				},
			},
			password: {
				create: {
					hash: await getPasswordHash('bobnotadmin'),
				},
			},
		},
	})
	console.timeEnd(
		`🙍 Created user "Bob" with the password "bobnotadmin" and no role`,
	)
	console.time(
		`👩 Created user "Isabelle" with the password "isabelleinstructor" as an instructor`,
	)
	await prisma.user.create({
		data: {
			email: 'isabelle@is.instructor',
			username: 'isabelle',
			name: 'Isabelle',
			org: { connect: { id: defaultOrg.id } },
			roles: { connect: { id: instructorRole.id } },
			image: {
				create: {
					contentType: 'image/png',
					file: {
						create: {
							blob: await fs.promises.readFile(
								'./tests/fixtures/images/user/9.jpg',
							),
						},
					},
				},
			},
			password: {
				create: {
					hash: await getPasswordHash('isabelleinstructor'),
				},
			},
		},
	})
	console.timeEnd(
		`👩 Created user "Isabelle" with the password "isabelleinstructor" as an instructor`,
	)

	const totalHorses = 40
	console.time(`🐴 Created ${totalHorses} horses...`)
	const horses = await Promise.all(
		Array.from({ length: totalHorses }, async (_, index) => {
			const animalData = createAnimal()
			const animal = await prisma.animal.create({
				data: {
					...animalData,
					org: { connect: { id: defaultOrg.id } },
					image: {
						create: {
							contentType: 'image/jpeg',
							file: {
								create: {
									blob: await fs.promises.readFile(
										`./tests/fixtures/images/horse/horse${index % 10}.jpg`,
									),
								},
							},
						},
					},
				},
			})
			return animal
		}),
	)
	console.timeEnd(`🐴 Created ${totalHorses} horses...`)

	const totalEvents = 18
	const today = new Date()
	const year = today.getFullYear()
	const month = today.getMonth()
	console.time(`📅 Created a few events in the current month`)
	const events = await Promise.all(
		Array.from({ length: totalEvents }, async (_, index) => {
			const eventData = await createEvent(
				faker.date.soon({
					days: 30,
					refDate: new Date(year, month, 0),
				}),
			)
			const event = await prisma.event.create({
				data: {
					...eventData,
					org: { connect: { id: defaultOrg.id } },
				},
			})
			return event
		}),
	)
	console.timeEnd(`📅 Created a few events in the current month`)

	console.time(`Setting signup password to "animals are cool"`)
	await prisma.signupPassword.create({
			data: {
				hash: await getPasswordHash('animals are cool'),
			}
	})
	console.timeEnd(`Setting signup password to "animals are cool"`)

	console.timeEnd(`🌱 Database has been seeded`)

}

seed()
	.catch(e => {
		console.error(e)
		process.exit(1)
	})
	.finally(async () => {
		await prisma.$disconnect()
	})

/*
eslint
	@typescript-eslint/no-unused-vars: "off",
*/
