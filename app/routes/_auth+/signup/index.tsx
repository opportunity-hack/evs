import { siteName } from '~/data.ts'
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
	useActionData,
	useFormAction,
	useNavigation,
} from '@remix-run/react'
import { z } from 'zod'
import { GeneralErrorBoundary } from '~/components/error-boundary.tsx'
import { prisma } from '~/utils/db.server.ts'
import { sendEmail } from '~/utils/email.server.ts'
import { ErrorList, Field } from '~/components/forms.tsx'
import { StatusButton } from '~/components/ui/status-button.tsx'
import { getDomainUrl } from '~/utils/misc.ts'
import { generateTOTP } from '~/utils/totp.server.ts'
import { emailSchema } from '~/utils/user-validation.ts'
import { SignupEmail } from './email.server.tsx'
import { verifySignupPassword } from '~/utils/auth.server.ts'

export const onboardingOTPQueryParam = 'code'
export const onboardingEmailQueryParam = 'email'
export const verificationType = 'onboarding'

const signupSchema = z.object({
	email: emailSchema,
	signupPassword: z.string().min(1, {
		message:
			'Please fill this in with the password given to you by the volunteer coordinator.',
	}),
})

export async function action({ request }: DataFunctionArgs) {
	const formData = await request.formData()
	const submission = await parse(formData, {
		schema: () => {
			return signupSchema.superRefine(async (data, ctx) => {
				const existingUser = await prisma.user.findUnique({
					where: { email: data.email },
					select: { id: true },
				})
				if (existingUser) {
					ctx.addIssue({
						path: ['email'],
						code: z.ZodIssueCode.custom,
						message: 'A user already exists with this email',
					})
					return
				}

				const validSignupPassword = await verifySignupPassword(
					data.signupPassword,
				)
				if (!validSignupPassword) {
					ctx.addIssue({
						path: ['signupPassword'],
						code: z.ZodIssueCode.custom,
						message: 'Incorrect signup password',
					})
					return
				}
			})
		},

		async: true,
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

	const { email } = submission.value

	const thirtyMinutesInSeconds = 30 * 60
	const { otp, secret, algorithm, period, digits } = generateTOTP({
		algorithm: 'sha256',
		period: thirtyMinutesInSeconds,
	})
	// delete old verifications. Users should not have more than one verification
	// of a specific type for a specific target at a time.
	await prisma.verification.deleteMany({
		where: { type: verificationType, target: email },
	})
	await prisma.verification.create({
		data: {
			type: verificationType,
			target: email,
			algorithm,
			secret,
			period,
			digits,
			expiresAt: new Date(Date.now() + period * 1000),
		},
	})
	const onboardingUrl = new URL(`${getDomainUrl(request)}/signup/verify`)
	onboardingUrl.searchParams.set(onboardingEmailQueryParam, email)
	const redirectTo = new URL(onboardingUrl.toString())

	// add the otp to the url we'll email the user.
	onboardingUrl.searchParams.set(onboardingOTPQueryParam, otp)

	const response = await sendEmail({
		to: email,
		subject: `Welcome to ${siteName}!`,
		react: <SignupEmail onboardingUrl={onboardingUrl.toString()} otp={otp} />,
	})

	if (response.status === 'success') {
		return redirect(redirectTo.pathname + redirectTo.search)
	} else {
		submission.error[''] =
			'There was an error sending the email.' + response.error
		if (response.error?.message) {
			submission.error[''] += ' ' + response.error.message
		}

		return json(
			{
				status: 'error',
				submission,
			} as const,
			{ status: 500 },
		)
	}
}

export const meta: V2_MetaFunction = () => {
	return [{ title: `Sign Up | ${siteName}` }]
}

export default function SignupRoute() {
	const actionData = useActionData<typeof action>()
	const formAction = useFormAction()
	const navigation = useNavigation()
	const isSubmitting = navigation.formAction === formAction
	const [form, fields] = useForm({
		id: 'signup-form',
		constraint: getFieldsetConstraint(signupSchema),
		lastSubmission: actionData?.submission,
		onValidate({ formData }) {
			const result = parse(formData, { schema: signupSchema })
			return result
		},
		shouldRevalidate: 'onBlur',
	})

	return (
		<div className="container mx-auto flex flex-col justify-center pb-32 pt-20">
			<div className="text-center">
				<h1 className="text-4xl sm:text-h1">Let's saddle up!</h1>
				<p className="mt-3 text-body-md text-muted-foreground">
					Please enter your email and the secret password given to you by the
					volunteer coordinator.
				</p>
			</div>
			<Form
				method="POST"
				className="mx-auto mt-16 w-full max-w-sm"
				{...form.props}
			>
				<Field
					labelProps={{
						htmlFor: fields.email.id,
						children: 'Email',
					}}
					inputProps={{ ...conform.input(fields.email), autoFocus: true }}
					errors={fields.email.errors}
				/>
				<Field
					labelProps={{
						htmlFor: fields.signupPassword.id,
						children: 'Secret',
					}}
					inputProps={{
						...conform.input(fields.signupPassword),
						autoFocus: true,
					}}
					errors={fields.signupPassword.errors}
				/>
				<ErrorList errors={form.errors} id={form.errorId} />
				<StatusButton
					className="w-full"
					status={isSubmitting ? 'pending' : actionData?.status ?? 'idle'}
					type="submit"
					disabled={isSubmitting}
				>
					Submit
				</StatusButton>
			</Form>
		</div>
	)
}

export function ErrorBoundary() {
	return <GeneralErrorBoundary />
}
