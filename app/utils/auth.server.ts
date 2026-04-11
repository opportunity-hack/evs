import { type Password, type User } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { Authenticator } from 'remix-auth'
import { FormStrategy } from 'remix-auth-form'
import invariant from 'tiny-invariant'
import { prisma } from '~/utils/db.server.ts'
import { sessionStorage } from './session.server.ts'
import { redirect } from '@remix-run/node'

export type { User }

export const authenticator = new Authenticator<string>(sessionStorage, {
	sessionKey: 'sessionId',
})

const SESSION_EXPIRATION_TIME = 1000 * 60 * 60 * 24 * 30

authenticator.use(
	new FormStrategy(async ({ form }) => {
		const username = form.get('username')
		const password = form.get('password')

		invariant(typeof username === 'string', 'username must be a string')
		invariant(username.length > 0, 'username must not be empty')

		invariant(typeof password === 'string', 'password must be a string')
		invariant(password.length > 0, 'password must not be empty')

		const user = await verifyLogin(username, password)
		if (!user) {
			throw new Error('Invalid username or password')
		}

		await prisma.user.update({
			where: { id: user.id },
			data: { lastLogin: new Date() },
		})

		const session = await prisma.session.create({
			data: {
				expirationDate: new Date(Date.now() + SESSION_EXPIRATION_TIME),
				userId: user.id,
			},
			select: { id: true },
		})

		return session.id
	}),
	FormStrategy.name,
)

export async function requireOrgMember(
	request: Request,
	{ redirectTo }: { redirectTo?: string | null } = {},
) {
	const userId = await requireUserId(request, { redirectTo })
	const user = await prisma.user.findUnique({
		where: { id: userId },
		select: { orgId: true },
	})
	if (!user?.orgId) {
		// User exists but has no org — send them to pick/create one
		throw redirect('/org-setup')
	}
	return { userId, orgId: user.orgId }
}

export async function requireUserId(
	request: Request,
	{ redirectTo }: { redirectTo?: string | null } = {},
) {
	const requestUrl = new URL(request.url)
	redirectTo =
		redirectTo === null
			? null
			: redirectTo ?? `${requestUrl.pathname}${requestUrl.search}`
	const loginParams = redirectTo
		? new URLSearchParams([['redirectTo', redirectTo]])
		: null
	const failureRedirect = ['/login', loginParams?.toString()]
		.filter(Boolean)
		.join('?')
	const sessionId = await authenticator.isAuthenticated(request, {
		failureRedirect,
	})
	const session = await prisma.session.findFirst({
		where: { id: sessionId },
		select: { userId: true, expirationDate: true },
	})
	if (!session) {
		throw redirect(failureRedirect)
	}
	return session.userId
}

export async function getUserId(request: Request) {
	const sessionId = await authenticator.isAuthenticated(request)
	if (!sessionId) return null
	const session = await prisma.session.findUnique({
		where: { id: sessionId },
		select: { userId: true },
	})
	if (!session) {
		// Perhaps their session was deleted?
		await authenticator.logout(request, { redirectTo: '/' })
		return null
	}
	return session.userId
}

export async function requireAnonymous(request: Request) {
	await authenticator.isAuthenticated(request, {
		successRedirect: '/',
	})
}

export async function resetUserPassword({
	username,
	password,
}: {
	username: User['username']
	password: string
}) {
	const hashedPassword = await bcrypt.hash(password, 10)
	return prisma.user.update({
		where: { username },
		data: {
			password: {
				update: {
					hash: hashedPassword,
				},
			},
		},
	})
}

export async function signup({
	email,
	username,
	password,
	name,
	phone,
}: {
	email: User['email']
	username: User['username']
	name: User['name']
	password: string
	phone: string
}) {
	const hashedPassword = await getPasswordHash(password)

	const session = await prisma.session.create({
		data: {
			expirationDate: new Date(Date.now() + SESSION_EXPIRATION_TIME),
			user: {
				create: {
					email,
					username,
					name,
					phone,
					password: {
						create: {
							hash: hashedPassword,
						},
					},
				},
			},
		},
		select: { id: true, expirationDate: true },
	})
	return session
}

export async function getPasswordHash(password: string) {
	const hash = await bcrypt.hash(password, 10)
	return hash
}

export async function verifyLogin(
	usernameOrEmail: string,
	password: Password['hash'],
) {
	const userWithPassword = await prisma.user.findFirst({
		where: {
			OR: [{ username: usernameOrEmail }, { email: usernameOrEmail }],
		},
		select: { id: true, password: { select: { hash: true } } },
	})

	if (!userWithPassword || !userWithPassword.password) {
		return null
	}

	const isValid = await bcrypt.compare(password, userWithPassword.password.hash)

	if (!isValid) {
		return null
	}

	return { id: userWithPassword.id }
}

export async function signupOrg({
	orgName,
	orgSlug,
	animalType,
	email,
	username,
	name,
	password,
}: {
	orgName: string
	orgSlug: string
	animalType: string
	email: string
	username: string
	name: string
	password: string
}) {
	const hashedPassword = await getPasswordHash(password)

	const adminRole = await prisma.role.findFirst({ where: { name: 'admin' } })

	const session = await prisma.session.create({
		data: {
			expirationDate: new Date(Date.now() + SESSION_EXPIRATION_TIME),
			user: {
				create: {
					email,
					username,
					name,
					password: {
						create: { hash: hashedPassword },
					},
					roles: adminRole ? { connect: { id: adminRole.id } } : undefined,
					org: {
						create: {
							name: orgName,
							slug: orgSlug,
							animalType,
						},
					},
				},
			},
		},
		select: { id: true, expirationDate: true, userId: true },
	})

	return session
}

export async function verifySignupPassword(password: string) {
	const signUpPassword = await prisma.signupPassword.findFirst();

	if (!signUpPassword) {
		throw "No signup password has been set"
	}

	const isValid = await bcrypt.compare(password, signUpPassword.hash)
	return isValid
}
