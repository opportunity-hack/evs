import { siteName } from '~/data.ts'
import {
	json,
	type DataFunctionArgs,
	type V2_MetaFunction,
} from '@remix-run/node'
import { useLoaderData, useSearchParams } from '@remix-run/react'
import { GeneralErrorBoundary } from '~/components/error-boundary.tsx'
import { Spacer } from '~/components/spacer.tsx'
import { authenticator, requireAnonymous } from '~/utils/auth.server.ts'
import { commitSession, getSession } from '~/utils/session.server.ts'
import { InlineLogin } from '../resources+/login.tsx'
import { Verifier, unverifiedSessionKey } from '../resources+/verify.tsx'

export async function loader({ request }: DataFunctionArgs) {
	await requireAnonymous(request)
	const session = await getSession(request.headers.get('cookie'))
	const error = session.get(authenticator.sessionErrorKey)
	let errorMessage: string | null = null
	if (typeof error?.message === 'string') {
		errorMessage = error.message
	}
	return json(
		{ formError: errorMessage, unverified: session.has(unverifiedSessionKey) },
		{
			headers: {
				'Set-Cookie': await commitSession(session),
			},
		},
	)
}

export const meta: V2_MetaFunction = () => {
	return [{ title: `Login to ${siteName}` }]
}

export default function LoginPage() {
	const [searchParams] = useSearchParams()
	const data = useLoaderData<typeof loader>()

	const redirectTo = searchParams.get('redirectTo') || '/'

	return (
		<div className="grid min-h-[calc(100vh-4rem)] lg:grid-cols-2">
			{/* Left brand panel */}
			<div
				className="hidden bg-indigo-600 bg-cover bg-center lg:block"
				style={{ backgroundImage: 'url(/img/login-bg.jpg)' }}
			/>

			{/* Right form panel */}
			<div className="flex flex-col items-center justify-center px-4 py-16">
				<div className="w-full max-w-sm">
					<div className="mb-8 flex flex-col gap-2">
						<h1 className="text-h3">Welcome back</h1>
						<p className="text-body-sm text-muted-foreground">
							Sign in to your account to continue.
						</p>
					</div>
					<Spacer size="xs" />
					{data.unverified ? (
						<Verifier redirectTo={redirectTo} />
					) : (
						<InlineLogin redirectTo={redirectTo} formError={data.formError} />
					)}
				</div>
			</div>
		</div>
	)
}

export function ErrorBoundary() {
	return <GeneralErrorBoundary />
}
