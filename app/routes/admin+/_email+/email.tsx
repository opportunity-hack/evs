import { getFieldsetConstraint, parse } from '@conform-to/zod'
import { type DataFunctionArgs, json, type LoaderArgs } from '@remix-run/node'
import {
	Form,
	useActionData,
	useFormAction,
	useNavigation,
} from '@remix-run/react'
import { z } from 'zod'
import { requireAdmin } from '~/utils/permissions.server.ts'
import { useToast } from '~/components/ui/use-toast.ts'
import { checkboxSchema } from '~/utils/zod-extensions.ts'
import { useResetCallback } from '~/utils/misc.ts'
import { Label } from '~/components/ui/label.tsx'
import { sendEmail } from '~/utils/email.server.ts'
import { prisma } from '~/utils/db.server.ts'
import {
	CheckboxField,
	ErrorList,
	Field,
	TextareaField,
} from '~/components/forms.tsx'
import { conform, useForm } from '@conform-to/react'
import { CustomEmail } from './CustomEmail.server.tsx'
import { StatusButton } from '~/components/ui/status-button.tsx'
import { useRef } from 'react'

const emailFormSchema = z
	.object({
		allVolunteers: checkboxSchema(),
		lessonAssistant: checkboxSchema(),
		horseLeader: checkboxSchema(),
		instructor: checkboxSchema(),
		subject: z
			.string()
			.min(1, { message: 'Your email must include a subject' }),
		message: z
			.string()
			.min(1, { message: 'Your email must include a message' }),
	})
	.refine(object => Object.values(object).includes(true), {
		message: 'Must check at least one checkbox',
	})

export const loader = async ({ request }: LoaderArgs) => {
	await requireAdmin(request)
	return null
}

export async function action({ request, params }: DataFunctionArgs) {
	await requireAdmin(request)
	const formData = await request.formData()
	const submission = parse(formData, { schema: emailFormSchema })
	if (!submission.value) {
		return json({ status: 'error', submission, error: 'error' } as const, {
			status: 400,
		})
	}
	// Get list of people to email
	const roles = [
		'allVolunteers',
		'lessonAssistant',
		'horseLeader',
		'instructor',
	]
	const selectedRoles = roles.filter(role => submission.payload[role] === 'on')
	const recipients = await getRecipientsFromRoles(selectedRoles)
	const upcomingEvents = await getUpcomingEvents(5);

	if (recipients.length === 0) {
		return json(
			{
				status: 'error',
				error: 'no-recipients',
				submission,
				recipients,
			} as const,
			{ status: 400 },
		)
	}

	for (let recipient of recipients) {
		sendEmail({
			to: recipient,
			subject: submission.payload.subject,
			react: <CustomEmail upcomingEvents={upcomingEvents} message={submission.payload.message} />,
		}).then(result => {
			if (result.status === 'error') {
				console.error(
					'There was an error sending emails',
					JSON.stringify(result.error),
				)
				return json({ status: 'error', error: 'error', result } as const, {
					status: 400,
				})
			}
		})
	}
	return json(
		{
			status: 'success',
			submission,
			error: null,
			recipients,
		} as const,
		{ status: 200 },
	)
}

export default function Email() {
	const formAction = useFormAction()
	const navigation = useNavigation()
	const isSubmitting = navigation.formAction === formAction
	const formRef = useRef<HTMLFormElement>(null)
	const actionData = useActionData<typeof action>()
	const [form, fields] = useForm({
		id: 'email-form',
		constraint: getFieldsetConstraint(emailFormSchema),
		lastSubmission: actionData?.submission,
		onValidate({ form, formData }) {
			return parse(formData, { schema: emailFormSchema })
		},
	})
	const { toast } = useToast()
	useResetCallback(actionData, () => {
		if (!actionData) return
		if (actionData?.status === 'success') {
			formRef.current?.reset()
			const recipients = actionData.recipients
			const plural = recipients.length > 1
			toast({
				title: 'Success',
				description: `Sent email${plural ? 's' : ''} to ${
					recipients.length
				} recipient${plural ? 's' : ''}`,
			})
		} else if (actionData?.error === 'no-recipients') {
			toast({
				variant: 'destructive',
				title: 'No recipients',
				description:
					'There are no users with that role that are accepting emails',
			})
		} else {
			toast({
				variant: 'destructive',
				title: 'Error',
				description: 'There was an error sending emails',
			})
		}
	})

	return (
		<div>
			<h1 className="text-center text-5xl">Email</h1>
			<div className="container pt-10">
				<Form
					method="POST"
					{...form.props}
					className="mx-auto max-w-lg"
					ref={formRef}
				>
					<section className="flex flex-col gap-2">
						<Label>To:</Label>
						<CheckboxField
							labelProps={{
								htmlFor: fields.allVolunteers.id,
								children: 'All Volunteers',
							}}
							buttonProps={{
								...conform.input(fields.allVolunteers, { type: 'checkbox' }),
							}}
							errors={fields.allVolunteers.errors}
						/>
						<CheckboxField
							labelProps={{
								htmlFor: fields.lessonAssistant.id,
								children: 'Lesson Assistants',
							}}
							buttonProps={{
								...conform.input(fields.lessonAssistant, { type: 'checkbox' }),
							}}
							errors={fields.lessonAssistant.errors}
						/>
						<CheckboxField
							labelProps={{
								htmlFor: fields.horseLeader.id,
								children: 'Horse Leaders',
							}}
							buttonProps={{
								...conform.input(fields.horseLeader, { type: 'checkbox' }),
							}}
							errors={fields.horseLeader.errors}
						/>
						<CheckboxField
							labelProps={{
								htmlFor: fields.instructor.id,
								children: 'Instructors',
							}}
							buttonProps={{
								...conform.input(fields.instructor, { type: 'checkbox' }),
							}}
							errors={fields.instructor.errors}
						/>
						<div className="min-h-[32px] px-4">
							<ErrorList id={form.errorId} errors={form.errors} />
						</div>
					</section>
					<section className="mt-4">
						<Field
							labelProps={{
								htmlFor: fields.subject.id,
								children: 'Subject',
							}}
							inputProps={conform.input(fields.subject)}
							errors={fields.subject.errors}
						/>
					</section>
					<section className="mt-4">
						<TextareaField
							labelProps={{
								htmlFor: fields.message.id,
								children: 'Message',
							}}
							textareaProps={conform.textarea(fields.message)}
							errors={fields.message.errors}
						/>
					</section>
					<section className="mt-4">
						<StatusButton
							className="w-full"
							status={isSubmitting ? 'pending' : actionData?.status ?? 'idle'}
							type="submit"
							disabled={isSubmitting}
						>
							Submit
						</StatusButton>
					</section>
				</Form>
			</div>
		</div>
	)
}

async function getUpcomingEvents(limit: number) {
	const events = await prisma.event.findMany({
		where: { start: { gt: new Date() } },
		take: limit,
	})
	return events
}


async function getRecipientsFromRoles(roles: string[]) {
	const recipients = new Set<string>()
	if (roles.includes('allVolunteers')) {
		const users = await prisma.user.findMany()
		users
			.filter(user => user.mailingList)
			.map(user => user.email)
			.forEach(email => recipients.add(email))
	} else {
		for (let role of roles) {
			const users = await prisma.user.findMany({
				where: { roles: { some: { name: role } } },
			})
			users
				.filter(user => user.mailingList)
				.map(user => user.email)
				.forEach(email => recipients.add(email))

			// Include admin on all emails
			const admin = await prisma.user.findMany({
				where: { roles: { some: { name: 'admin' } } },
			})
			admin
				.filter(user => user.mailingList)
				.map(user => user.email)
				.forEach(email => recipients.add(email))
		}
	}
	return Array.from(recipients)
}
