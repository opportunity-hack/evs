import { conform, useForm } from '@conform-to/react'
import { getFieldsetConstraint, parse } from '@conform-to/zod'
import {
	json,
	redirect,
	type DataFunctionArgs,
	type V2_MetaFunction,
} from '@remix-run/node'
import {
	Form,
	Link,
	useActionData,
	useFormAction,
	useNavigation,
} from '@remix-run/react'
import { z } from 'zod'
import { ErrorList, Field } from '~/components/forms.tsx'
import { StatusButton } from '~/components/ui/status-button.tsx'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '~/components/ui/select.tsx'
import { Label } from '~/components/ui/label.tsx'
import { Separator } from '~/components/ui/separator.tsx'
import { requireAnonymous, signupOrg, authenticator } from '~/utils/auth.server.ts'
import { commitSession, getSession } from '~/utils/session.server.ts'
import {
	nameSchema,
	passwordSchema,
	usernameSchema,
	emailSchema,
} from '~/utils/user-validation.ts'
import { siteName } from '~/data.ts'
import { prisma } from '~/utils/db.server.ts'

const orgSignupSchema = z
	.object({
		orgName: z
			.string()
			.min(2, { message: 'Organization name is too short' })
			.max(80, { message: 'Organization name is too long' }),
		animalType: z.string().min(1, { message: 'Please select an animal type' }),
		name: nameSchema,
		username: usernameSchema,
		email: emailSchema,
		password: passwordSchema,
		confirmPassword: passwordSchema,
	})
	.superRefine(({ confirmPassword, password }, ctx) => {
		if (confirmPassword !== password) {
			ctx.addIssue({
				path: ['confirmPassword'],
				code: 'custom',
				message: 'The passwords did not match',
			})
		}
	})

function slugify(name: string) {
	return name
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9\s-]/g, '')
		.replace(/\s+/g, '-')
		.replace(/-+/g, '-')
		.slice(0, 60)
}

export async function loader({ request }: DataFunctionArgs) {
	await requireAnonymous(request)
	return json({})
}

export const meta: V2_MetaFunction = () => {
	return [{ title: `Register Your Organization | ${siteName}` }]
}

export async function action({ request }: DataFunctionArgs) {
	await requireAnonymous(request)
	const formData = await request.formData()
	const submission = await parse(formData, {
		schema: orgSignupSchema.superRefine(async ({ username, email, orgName }, ctx) => {
			const existingUser = await prisma.user.findFirst({
				where: { OR: [{ username }, { email }] },
				select: { id: true, username: true, email: true },
			})
			if (existingUser?.username === username) {
				ctx.addIssue({
					path: ['username'],
					code: 'custom',
					message: 'A user already exists with this username',
				})
			}
			if (existingUser?.email === email) {
				ctx.addIssue({
					path: ['email'],
					code: 'custom',
					message: 'A user already exists with this email',
				})
			}
			const slug = slugify(orgName)
			const existingOrg = await prisma.organization.findUnique({
				where: { slug },
				select: { id: true },
			})
			if (existingOrg) {
				ctx.addIssue({
					path: ['orgName'],
					code: 'custom',
					message: 'An organization with a similar name already exists',
				})
			}
		}),
		async: true,
	})

	if (submission.intent !== 'submit') {
		return json({ status: 'idle', submission } as const)
	}
	if (!submission.value) {
		return json({ status: 'error', submission } as const, { status: 400 })
	}

	const { orgName, animalType, name, username, email, password } =
		submission.value
	const orgSlug = slugify(orgName)

	const session = await signupOrg({
		orgName,
		orgSlug,
		animalType,
		email,
		username,
		name,
		password,
	})

	const cookieSession = await getSession(request.headers.get('cookie'))
	cookieSession.set(authenticator.sessionKey, session.id)

	return redirect('/calendar', {
		headers: {
			'Set-Cookie': await commitSession(cookieSession, {
				expires: session.expirationDate,
			}),
		},
	})
}

export default function OrgSignup() {
	const actionData = useActionData<typeof action>()
	const navigation = useNavigation()
	const formAction = useFormAction()

	const isSubmitting =
		navigation.state === 'submitting' && navigation.formAction === formAction

	const [form, fields] = useForm({
		id: 'org-signup',
		constraint: getFieldsetConstraint(orgSignupSchema),
		lastSubmission: actionData?.submission,
		shouldRevalidate: 'onBlur',
	})

	return (
		<div className="grid min-h-[calc(100vh-4rem)] lg:grid-cols-[1fr_2fr]">
			{/* Left image panel */}
			<div
				className="hidden bg-indigo-600 bg-cover bg-center lg:block"
				style={{ backgroundImage: 'url(/img/login-bg.jpg)' }}
			/>

			{/* Right form panel */}
			<div className="overflow-y-auto px-4 py-4">
			<div className="mx-auto w-full max-w-2xl">
				<div className="mb-2">
					<h1 className="text-h4">Register Your Organization</h1>
					<p className="mt-1 text-body-sm text-muted-foreground">
						Create your organization account and start coordinating volunteers.
					</p>
				</div>

				<Form method="post" {...form.props} className="space-y-2">
					<div>
						<h2 className="mb-1 text-base font-semibold">Organization Details</h2>
						<div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
							<Field
								className="sm:col-span-2"
								labelProps={{ htmlFor: fields.orgName.id, children: 'Organization Name' }}
								inputProps={conform.input(fields.orgName)}
								errors={fields.orgName.errors}
							/>
							<div className="sm:col-span-2">
								<Label htmlFor="animalType">Primary Animal Type</Label>
								<Select name="animalType" defaultValue="horses">
									<SelectTrigger id="animalType" className="mt-1">
										<SelectValue placeholder="Select animal type" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="horses">Horses</SelectItem>
										<SelectItem value="dogs">Dogs</SelectItem>
										<SelectItem value="cats">Cats</SelectItem>
										<SelectItem value="wildlife">Wildlife</SelectItem>
										<SelectItem value="mixed">Mixed / Other</SelectItem>
									</SelectContent>
								</Select>
								{fields.animalType.errors ? (
									<ErrorList errors={fields.animalType.errors} />
								) : null}
							</div>
						</div>
					</div>

					<Separator />

					<div>
						<h2 className="mb-1 text-base font-semibold">Admin Account</h2>
						<div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
							<Field
								labelProps={{ htmlFor: fields.name.id, children: 'Your Name' }}
								inputProps={conform.input(fields.name)}
								errors={fields.name.errors}
							/>
							<Field
								labelProps={{ htmlFor: fields.username.id, children: 'Username' }}
								inputProps={conform.input(fields.username)}
								errors={fields.username.errors}
							/>
							<Field
								className="sm:col-span-2"
								labelProps={{ htmlFor: fields.email.id, children: 'Email' }}
								inputProps={{ ...conform.input(fields.email), type: 'email' }}
								errors={fields.email.errors}
							/>
							<Field
								labelProps={{ htmlFor: fields.password.id, children: 'Password' }}
								inputProps={{ ...conform.input(fields.password), type: 'password' }}
								errors={fields.password.errors}
							/>
							<Field
								labelProps={{ htmlFor: fields.confirmPassword.id, children: 'Confirm Password' }}
								inputProps={{ ...conform.input(fields.confirmPassword), type: 'password' }}
								errors={fields.confirmPassword.errors}
							/>
						</div>
					</div>

					<ErrorList id={form.errorId} errors={form.errors} />

					<div className="flex items-center justify-between">
						<p className="text-sm text-muted-foreground">
							Already have an account?{' '}
							<Link to="/login" className="underline">
								Log in
							</Link>
						</p>
						<StatusButton
							type="submit"
							status={isSubmitting ? 'pending' : actionData?.status ?? 'idle'}
						>
							Create Organization
						</StatusButton>
					</div>
				</Form>
			</div>
			</div>
		</div>
	)
}
