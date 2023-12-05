import { type ReactElement } from 'react'
import { renderAsync } from '@react-email/components'
import { siteEmailAddressWithName } from '~/data.ts'
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail({
	react,
	...options
}: {
	to: string | string[]
	subject: string
	attachments?: { filename?: string, path?: string, content?: string | Buffer }[]
} & (
	| { html: string; text: string; react?: never }
	| { react: ReactElement; html?: never; text?: never }
)) {
	// TODO: find out what email address to use here
	const from = siteEmailAddressWithName

	const email = {
		from,		
		...options,
		...(react ? await renderReactEmail(react) : null),
	}

	// feel free to remove this condition once you've set up resend
	if (!process.env.RESEND_API_KEY && !process.env.MOCKS) {
		console.error(`RESEND_API_KEY not set and we're not in mocks mode.`)
		console.error(
			`To send emails, set the RESEND_API_KEY environment variable.`,
		)
		console.error(`Would have sent the following email:`, JSON.stringify(email))
		return {
			status: 'success',
			data: { id: 'mocked' },
		} as const
	}

	// Make HTML an empty string if it's not provided
	if (!email.html) {
		email.html = ''
	}
	// Make text an empty string if it's not provided
	if (!email.text) {
		email.text = ''
	}
	// Log the email contents
	console.info('🔶 sending email:', JSON.stringify(email))

	try {
		const response = await resend.emails.send({
			from: email.from,
			to: email.to,
			subject: email.subject,
			html: email.html,
			text: email.text,
			attachments: email.attachments,
		});

		return {
			status: 'success',
			data: response,
		} as const

		// Catch full exception
	} catch (e : any) {
		console.error('🔴 error sending email:', JSON.stringify(email))		
		return {
				status: 'error',
				error: {
					message: e.message || 'Unknown error',
					code: e.code || 'Unknown code',
					response: e.response || 'Unknown response',
				}								
			}
	}
}

async function renderReactEmail(react: ReactElement) {
	const [html, text] = await Promise.all([
		renderAsync(react),
		renderAsync(react, { plainText: true }),
	])
	return { html, text }
}
