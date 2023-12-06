import { getFieldsetConstraint, parse } from '@conform-to/zod'
import { type DataFunctionArgs, json } from '@remix-run/node'
import { Form, useActionData } from '@remix-run/react'
import { z } from 'zod'
import { Button } from '~/components/ui/button.tsx'
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

const emailFormSchema = z
	.object({
		allVolunteers: checkboxSchema(),
		lessonAssistant: checkboxSchema(),
		horseLeader: checkboxSchema(),
		instructor: checkboxSchema(),
		admin: checkboxSchema(),
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

export async function action({ request, params }: DataFunctionArgs) {
	await requireAdmin(request)
	const formData = await request.formData()
	const submission = parse(formData, { schema: emailFormSchema })
	if (!submission.value) {
		return json({ status: 'error', submission } as const, { status: 400 })
	}
	console.log('submission', submission)
	// Get list of people to email
	const roles = [
		'allVolunteers',
		'lessonAssistant',
		'horseLeader',
		'instructor',
		'admin',
	]
	const selectedRoles = roles.filter(role => submission.payload[role] === 'on')
	const recipients = await getRecipientsFromRoles(selectedRoles)
	console.log('resulting list of recipients', recipients)

	for (let recipient of recipients) {
		sendEmail({
			to: recipient,
			subject: submission.payload.subject,
			react: <>{submission.payload.message}</>,
		}).then(result => {
			if (result.status === 'error') {
				console.error(
					'There was an error sending emails',
					JSON.stringify(result.error),
				)
			}
		})
	}
	return json(
		{
			status: 'ok',
			submission,
		},
		{ status: 200 },
	)
}

export default function Email() {
	const actionData = useActionData<typeof action>()
	const [form, fields] = useForm({
		id: 'email-form',
		constraint: getFieldsetConstraint(emailFormSchema),
		lastSubmission: actionData?.submission,
	})
	const { toast } = useToast()
	useResetCallback(actionData, () => {
		if (!actionData) return
		if (actionData?.status === 'ok') {
			toast({
				title: 'Emails sent!',
			})
		} else {
			if (actionData.submission.error.needRecipients) {
				toast({
					variant: 'destructive',
					title: 'Error sending emails',
				})
			}
		}
	})

	return (
		<div>
			<h1 className="text-center text-5xl">Email</h1>
			<div className="container pt-10">
				<Form method="POST" {...form.props} className="mx-auto max-w-lg">
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
						<CheckboxField
							labelProps={{
								htmlFor: fields.admin.id,
								children: 'Administrators',
							}}
							buttonProps={{
								...conform.input(fields.admin, { type: 'checkbox' }),
							}}
							errors={fields.admin.errors}
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
						<Button type="submit">Send</Button>
					</section>
				</Form>
			</div>
		</div>
	)
}

async function getRecipientsFromRoles(roles: string[]) {
	const recipients = new Set<string>()
	if (roles.includes('allVolunteers')) {
		const users = await prisma.user.findMany()
		users.map(user => user.email).forEach(email => recipients.add(email))
	} else {
		for (let role of roles) {
			const users = await prisma.user.findMany({
				where: { roles: { some: { name: role } } },
			})
			users.map(user => user.email).forEach(email => recipients.add(email))
		}
	}
	return recipients
}
