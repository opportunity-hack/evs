import { conform, useFieldset, useForm } from '@conform-to/react'
import { getFieldsetConstraint, parse } from '@conform-to/zod'
import {
	json,
	redirect,
	type DataFunctionArgs,
	Form,
	Link,
	Outlet,
	useActionData,
	useFormAction,
	useLoaderData,
	useNavigation,
} from '~/remix.ts'
import { z } from 'zod'
import {
	authenticator,
	getPasswordHash,
	requireUserId,
	verifyLogin,
} from '~/utils/auth.server.ts'
import { prisma } from '~/utils/db.server.ts'
import {
	CheckboxField,
	ErrorList,
	Field,
	HeightField,
} from '~/components/forms.tsx'
import { Button } from '~/components/ui/button.tsx'
import { StatusButton } from '~/components/ui/status-button.tsx'
import { getUserImgSrc } from '~/utils/misc.ts'
import {
	emailSchema,
	nameSchema,
	passwordSchema,
	phoneSchema,
	usernameSchema,
} from '~/utils/user-validation.ts'
import { twoFAVerificationType } from './profile.two-factor.tsx'
import { Icon } from '~/components/ui/icon.tsx'
import { format } from 'date-fns'
import {
	checkboxSchema,
	optionalDateTimeZoneSchema,
} from '~/utils/zod-extensions.ts'
import {
	convertFeetInchesIntoInches,
	convertInchesToHeightObj,
} from '~/utils/length-conversions.ts'

const profileFormSchema = z.object({
	name: nameSchema.optional(),
	username: usernameSchema,
	email: emailSchema.optional(),
	mailingList: checkboxSchema(),
	birthdate: optionalDateTimeZoneSchema.optional(),
	phone: phoneSchema,
	yearsOfExperience: z.coerce.number().int().min(0).optional(),
	currentPassword: z
		.union([passwordSchema, z.string().min(0).max(0)])
		.optional(),
	newPassword: z.union([passwordSchema, z.string().min(0).max(0)]).optional(),
	height: z
		.object({
			heightFeet: z.coerce
				.number({ invalid_type_error: 'Feet must be a number' })
				.int({ message: 'Feet must be an integer' })
				.min(0, { message: 'Feet must be between 0 and 8' })
				.max(8, { message: 'Feet must be between 0 and 8' })
				.optional(),
			heightInches: z.coerce
				.number({ invalid_type_error: 'Inches must be a number' })
				.int({ message: 'Inches must be an integer' })
				.min(0, { message: 'Inches must be between 0 and 12' })
				.max(12, { message: 'Inches must be between 0 and 12' })
				.optional(),
		})
		.refine(
			obj => {
				return (
					(obj.heightFeet && obj.heightInches) ||
					(!obj.heightFeet && !obj.heightInches)
				)
			},
			{ message: 'You must enter both feet and inches for height' },
		)
		.transform(val => {
			if (val.heightFeet && val.heightInches) {
				return convertFeetInchesIntoInches(val.heightFeet, val.heightInches)
			} else return null
		}),
})

export async function loader({ request }: DataFunctionArgs) {
	const userId = await requireUserId(request)
	const user = await prisma.user.findUnique({
		where: { id: userId },
		select: {
			id: true,
			name: true,
			username: true,
			phone: true,
			birthdate: true,
			height: true,
			yearsOfExperience: true,
			email: true,
			mailingList: true,
			imageId: true,
		},
	})
	const twoFactorVerification = await prisma.verification.findFirst({
		where: { type: twoFAVerificationType, target: userId },
		select: { id: true },
	})
	if (!user) {
		throw await authenticator.logout(request, { redirectTo: '/' })
	}
	return json({ user, isTwoFactorEnabled: Boolean(twoFactorVerification) })
}

export async function action({ request }: DataFunctionArgs) {
	const userId = await requireUserId(request)
	const formData = await request.formData()
	const submission = await parse(formData, {
		async: true,
		schema: profileFormSchema.superRefine(
			async ({ username, currentPassword, newPassword }, ctx) => {
				if (newPassword && !currentPassword) {
					ctx.addIssue({
						path: ['newPassword'],
						code: 'custom',
						message: 'Must provide current password to change password.',
					})
				}
				if (currentPassword && newPassword) {
					const user = await verifyLogin(username, currentPassword)
					if (!user) {
						ctx.addIssue({
							path: ['currentPassword'],
							code: 'custom',
							message: 'Incorrect password.',
						})
					}
				}
			},
		),
		acceptMultipleErrors: () => true,
	})
	if (submission.intent !== 'submit') {
		return json({ status: 'idle', submission } as const)
	}
	if (!submission.value) {
		return json(
			{
				status: 'error',
				submission,
			} as const,
			{ status: 400 },
		)
	}
	const {
		name,
		username,
		email,
		mailingList,
		phone,
		birthdate,
		height,
		yearsOfExperience,
		newPassword,
	} = submission.value

	if (email) {
		// TODO: send a confirmation email
	}

	const updatedUser = await prisma.user.update({
		select: { id: true, username: true },
		where: { id: userId },
		data: {
			name,
			username,
			phone,
			mailingList,
			birthdate: birthdate ?? null,
			height,
			yearsOfExperience,
			password: newPassword
				? {
						update: {
							hash: await getPasswordHash(newPassword),
						},
				  }
				: undefined,
		},
	})

	return redirect(`/users/${updatedUser.username}`, { status: 302 })
}

export default function EditUserProfile() {
	const data = useLoaderData<typeof loader>()
	const actionData = useActionData<typeof action>()
	const navigation = useNavigation()
	const formAction = useFormAction()

	const isSubmitting =
		navigation.state === 'submitting' &&
		navigation.formAction === formAction &&
		navigation.formMethod === 'POST'

	let formattedBirthdate = null
	if (data.user.birthdate) {
		formattedBirthdate = format(data.user.birthdate, 'yyyy-MM-dd')
	}

	let userHeight
	if (data.user.height) {
		userHeight = convertInchesToHeightObj(data.user.height)
	}

	const [form, fields] = useForm({
		id: 'edit-profile',
		constraint: getFieldsetConstraint(profileFormSchema),
		lastSubmission: actionData?.submission,
		onValidate({ formData }) {
			return parse(formData, { schema: profileFormSchema })
		},
		defaultValue: {
			username: data.user.username,
			name: data.user.name ?? '',
			email: data.user.email,
			mailingList: data.user.mailingList ? 'on' : undefined,
			phone: data.user.phone,
			birthdate: formattedBirthdate ?? '',
			height: userHeight ?? undefined,
			yearsOfExperience: data.user.yearsOfExperience ?? '',
		},
		shouldRevalidate: 'onBlur',
	})
	const { heightFeet, heightInches } = useFieldset(form.ref, fields.height)

	return (
		<div className="container m-auto mb-36 mt-16 max-w-3xl">
			<div className="flex gap-3">
				<Link
					className="text-muted-foreground"
					to={`/users/${data.user.username}`}
				>
					Profile
				</Link>
				<span className="flex items-center text-muted-foreground">
					<Icon className="text-body-md" name="arrow-right" />
				</span>
				<span>Edit Profile</span>
			</div>
			<div className="mt-16 flex flex-col gap-12">
				<div className="flex justify-center">
					<div className="relative h-52 w-52">
						<img
							src={getUserImgSrc(data.user.imageId)}
							alt={data.user.username}
							className="h-full w-full rounded-full object-cover"
						/>
						<Button
							asChild
							variant="outline"
							className="absolute -right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full p-0"
						>
							<Link
								preventScrollReset
								to="photo"
								title="Change profile photo"
								aria-label="Change profile photo"
							>
								<Icon name="camera" className="h-4 w-4" />
							</Link>
						</Button>
					</div>
				</div>
				<Form method="POST" {...form.props}>
					<div className="grid grid-cols-6 gap-x-10">
						<legend className="col-span-6 pb-6 text-lg text-night-200">
							Account
						</legend>
						<Field
							className="col-span-6 sm:col-span-3"
							labelProps={{
								htmlFor: fields.username.id,
								children: 'Username',
							}}
							inputProps={conform.input(fields.username)}
							errors={fields.username.errors}
						/>
						<Field
							className="col-span-6 sm:col-span-3"
							labelProps={{ htmlFor: fields.name.id, children: 'Name' }}
							inputProps={conform.input(fields.name)}
							errors={fields.name.errors}
						/>
						<Field
							className="col-span-6 sm:col-span-3"
							labelProps={{ htmlFor: fields.email.id, children: 'Email' }}
							inputProps={{
								...conform.input(fields.email),
								// TODO: support changing your email address
								disabled: true,
							}}
							errors={fields.email.errors}
						/>
						<Field
							className="col-span-6 sm:col-span-3"
							labelProps={{
								htmlFor: fields.phone.id,
								children: 'Phone Number',
							}}
							inputProps={{
								...conform.input(fields.phone, { type: 'tel' }),
							}}
							errors={fields.phone.errors}
						/>
						<CheckboxField
							className="col-span-6"
							labelProps={{
								htmlFor: fields.mailingList.id,
								children: 'Subscribed to all emails',
							}}
							buttonProps={conform.input(fields.mailingList, {
								type: 'checkbox',
							})}
							errors={fields.mailingList.errors}
						/>
						<div className="col-span-3"></div>

						<div className="col-span-6 mb-6 mt-6 h-1 border-b-[1.5px]" />
						<legend className="col-span-6 pb-6 text-lg text-night-200">
							Additional Information
						</legend>
						<Field
							className="col-span-6 sm:col-span-3"
							labelProps={{
								htmlFor: fields.birthdate.id,
								children: 'Birthdate',
							}}
							inputProps={{
								...conform.input(fields.birthdate),
								type: 'date',
							}}
							errors={fields.birthdate.errors}
						/>
						<div className="col-span-6 sm:col-span-3">
							<label
								htmlFor="heightFieldset"
								className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
							>
								Height
							</label>
							<fieldset
								id="heightFieldset"
								className="grid grid-cols-2 gap-x-4"
							>
								<HeightField
									className="relative"
									labelProps={{
										htmlFor: heightFeet.id,
										children: 'feet',
										className: 'absolute right-4 top-3 text-primary/70 z-50',
									}}
									inputProps={{
										...conform.input(heightFeet),
										type: 'number',
										className: 'heightField',
									}}
									errors={heightFeet.errors}
								/>
								<HeightField
									className="relative"
									labelProps={{
										htmlFor: heightInches.id,
										children: 'inches',
										className: 'absolute right-4 top-3 text-primary/70',
									}}
									inputProps={{
										...conform.input(heightInches),
										type: 'number',
										className: 'heightField',
									}}
									errors={heightInches.errors}
								/>
								<div className="col-span-2 min-h-[32px] px-4 pb-3 pt-1">
									{fields.height.errors && (
										<ErrorList
											id={fields.height.id}
											errors={fields.height.errors}
										/>
									)}
									{heightFeet.errors && (
										<ErrorList id={heightFeet.id} errors={heightFeet.errors} />
									)}
									{heightInches.errors && (
										<ErrorList
											id={heightInches.id}
											errors={heightInches.errors}
										/>
									)}
								</div>
							</fieldset>
						</div>
						<Field
							className="col-span-6 sm:col-span-3"
							labelProps={{
								htmlFor: fields.yearsOfExperience.id,
								children: 'Years of experience with horses',
							}}
							inputProps={{
								...conform.input(fields.yearsOfExperience),
								type: 'number',
							}}
							errors={fields.yearsOfExperience.errors}
						/>

						<div className="col-span-6 mb-6 mt-6 h-1 border-b-[1.5px]" />
						<fieldset className="col-span-6">
							<legend className="pb-6 text-lg text-night-200">
								Change password
							</legend>
							<div className="flex flex-col justify-between gap-x-10 sm:flex-row">
								<Field
									className="flex-1"
									labelProps={{
										htmlFor: fields.currentPassword.id,
										children: 'Current Password',
									}}
									inputProps={{
										...conform.input(fields.currentPassword, {
											type: 'password',
										}),
										autoComplete: 'current-password',
									}}
									errors={fields.currentPassword.errors}
								/>
								<Field
									className="flex-1"
									labelProps={{
										htmlFor: fields.newPassword.id,
										children: 'New Password',
									}}
									inputProps={{
										...conform.input(fields.newPassword, { type: 'password' }),
										autoComplete: 'new-password',
									}}
									errors={fields.newPassword.errors}
								/>
							</div>
						</fieldset>
						<Link
							preventScrollReset
							to="two-factor"
							className="col-span-full flex gap-1"
						>
							{data.isTwoFactorEnabled ? (
								<>
									<Icon name="lock-closed" /> 2FA is enabled
								</>
							) : (
								<>
									<Icon name="lock-open-1" /> Enable 2FA
								</>
							)}
						</Link>
					</div>

					<ErrorList errors={form.errors} id={form.errorId} />

					<div className="mt-8 flex justify-center">
						<StatusButton
							type="submit"
							size="wide"
							status={isSubmitting ? 'pending' : actionData?.status ?? 'idle'}
						>
							Save changes
						</StatusButton>
					</div>
				</Form>
			</div>
			<Outlet />
		</div>
	)
}
