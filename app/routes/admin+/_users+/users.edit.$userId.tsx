import { useState } from 'react'
import {
	Dialog,
	DialogHeader,
	DialogContent,
	DialogDescription,
	DialogClose,
	DialogTitle,
	DialogFooter,
} from '~/components/ui/dialog.tsx'
import { Icon } from '~/components/ui/icon.tsx'
import { CheckboxField, Field } from '~/components/forms.tsx'
import {
	Form,
	useLoaderData,
	useNavigate,
	useActionData,
	useNavigation,
	useFormAction,
} from '@remix-run/react'
import { json, type DataFunctionArgs } from '@remix-run/node'
import { requireAdmin } from '~/utils/permissions.server.ts'
import { prisma } from '~/utils/db.server.ts'
import invariant from 'tiny-invariant'
import { conform, useForm } from '@conform-to/react'
import { parse } from '@conform-to/zod'
import { redirectWithToast } from '~/utils/flash-session.server.ts'
import { StatusButton } from '~/components/ui/status-button.tsx'

import { z } from 'zod'

import {
	emailSchema,
	nameSchema,
	phoneSchema,
	usernameSchema,
} from '~/utils/user-validation.ts'
import { checkboxSchema, optionalDateSchema } from '~/utils/zod-extensions.ts'
import { format } from 'date-fns'

const editUserSchema = z.object({
	name: nameSchema.optional(),
	username: usernameSchema,
	email: emailSchema.optional(),
	phone: phoneSchema,
	birthdate: optionalDateSchema,
	height: z.coerce.number().min(0).optional(),
	yearsOfExperience: z.coerce.number().min(0).optional(),
	isInstructor: checkboxSchema(),
	isLessonAssistant: checkboxSchema(),
	isHorseLeader: checkboxSchema(),
})

export const loader = async ({ request, params }: DataFunctionArgs) => {
	await requireAdmin(request)
	invariant(params.userId, 'Missing user id')
	const user = await prisma.user.findUnique({
		where: { id: params.userId },
		include: { roles: true },
	})
	if (!user) {
		throw new Response('not found', { status: 404 })
	}
	return json({ user })
}

export async function action({ request, params }: DataFunctionArgs) {
	await requireAdmin(request)
	invariant(params.userId, 'Missing user id')
	const formData = await request.formData()
	const submission = await parse(formData, {
		async: true,
		schema: editUserSchema,
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
		birthdate,
		phone,
		height,
		yearsOfExperience,
		isInstructor,
		isHorseLeader,
		isLessonAssistant,
	} = submission.value

	const updatedUser = await prisma.user.update({
		where: { id: params.userId },
		data: {
			name,
			username,
			phone,
			birthdate: birthdate ?? null,
			height: height ?? null,
			yearsOfExperience: yearsOfExperience ?? null,
			instructor: isInstructor,
			roles: {
				[isHorseLeader ? 'connect' : 'disconnect']: { name: 'horseLeader' },
				[isLessonAssistant ? 'connect' : 'disconnect']: { name: 'lessonAssistant' },
			},
		},
	})

	if (!updatedUser) {
		return redirectWithToast(`/admin/users`, {
			title: `Error`,
			variant: 'destructive',
			description: `Failed to update user`,
		})
	}

	return redirectWithToast(`/admin/users`, {
		title: `Success`,
		description: `Updated ${updatedUser.name ?? updatedUser.username}`,
	})
}

export default function EditUser() {
	const data = useLoaderData<typeof loader>() || {}
	const actionData = useActionData<typeof action>()
	const [open, setOpen] = useState(true)

	const navigation = useNavigation()
	const formAction = useFormAction()

	const isSubmitting =
		navigation.state === 'submitting' &&
		navigation.formAction === formAction &&
		navigation.formMethod === 'PUT'

	const navigate = useNavigate()
	const dismissModal = () => {
		setOpen(false)
		navigate('..', { preventScrollReset: true })
	}

	let formattedBirthdate = null
	if (data.user.birthdate) {
		formattedBirthdate = format(new Date(data.user.birthdate), 'yyyy-MM-dd')
	}

	const [form, fields] = useForm({
		id: 'edit-user',
		lastSubmission: actionData?.submission,
		onValidate({ formData }) {
			return parse(formData, { schema: editUserSchema })
		},
		defaultValue: {
			name: data.user?.name ?? '',
			username: data.user?.username ?? '',
			email: data.user?.email,
			phone: data.user?.phone,
			birthdate: formattedBirthdate ?? '',
			height: data.user?.height ?? '',
			yearsOfExperience: data.user?.yearsOfExperience ?? '',
		},
		shouldRevalidate: 'onSubmit',
		onSubmit: dismissModal,
	})

	let isLessonAssistant = false
	let isHorseLeader = false
	for (const role of data.user?.roles) {
		if (role.name == 'lessonAssistant') {
			isLessonAssistant = true
		}
		if (role.name == 'horseLeader') {
			isHorseLeader = true
		}
	}

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogContent
				onEscapeKeyDown={dismissModal}
				onPointerDownOutside={dismissModal}
			>
				<DialogHeader>
					<DialogTitle>Edit User: {data.user?.name}</DialogTitle>
					<DialogDescription>
						Click save to save your changes.
					</DialogDescription>
				</DialogHeader>
				<Form method="PUT" {...form.props}>
					<div className="grid grid-cols-6 gap-x-10">
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
							labelProps={{ htmlFor: fields.phone.id, children: 'Phone' }}
							inputProps={{
								...conform.input(fields.phone),
							}}
							errors={fields.phone.errors}
						/>
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
						<Field
							className="col-span-6 sm:col-span-3"
							labelProps={{
								htmlFor: fields.height.id,
								children: 'Height (inches)',
							}}
							inputProps={{
								...conform.input(fields.height),
								type: 'number',
							}}
							errors={fields.height.errors}
						/>
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
						<div className="col-span-6 grid grid-col-1">
							<CheckboxField
								labelProps={{
									htmlFor: fields.isInstructor.id,
									children: 'Instructor',
								}}
								buttonProps={conform.input(fields.isInstructor, {
									type: 'checkbox',
								})}
								errors={fields.isInstructor.errors}
							/>
							<CheckboxField
								labelProps={{
									htmlFor: fields.isLessonAssistant.id,
									children: 'Lesson Assistant',
								}}
								buttonProps={{
									...conform.input(fields.isLessonAssistant, {
										type: 'checkbox',
									}),
									defaultChecked: isLessonAssistant,
								}}
								errors={fields.isLessonAssistant.errors}
							/>
							<CheckboxField
								labelProps={{
									htmlFor: fields.isHorseLeader.id,
									children: 'Horse Leader',
								}}
								buttonProps={{
									...conform.input(fields.isHorseLeader, {
										type: 'checkbox',
									}),
									defaultChecked: isHorseLeader,
								}}
								errors={fields.isHorseLeader.errors}
							/>
						</div>
					</div>
					<DialogFooter className="mt-4">
						<StatusButton
							type="submit"
							status={isSubmitting ? 'pending' : actionData?.status ?? 'idle'}
						>
							Save
						</StatusButton>
					</DialogFooter>
				</Form>
				<DialogClose asChild>
					<button
						onClick={dismissModal}
						aria-label="Close"
						className="absolute right-10 top-10"
					>
						<Icon name="cross-1" />
					</button>
				</DialogClose>
			</DialogContent>
		</Dialog>
	)
}
