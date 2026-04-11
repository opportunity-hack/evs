import { cssBundleHref } from '@remix-run/css-bundle'
import {
	json,
	type DataFunctionArgs,
	type HeadersFunction,
	type LinksFunction,
	type V2_MetaFunction,
} from '@remix-run/node'
import {
	Link,
	Links,
	LiveReload,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration,
	useLoaderData,
} from '@remix-run/react'
import { withSentry } from '@sentry/remix'
import { ThemeSwitch, useTheme } from './routes/resources+/theme/index.tsx'
import { getTheme } from './routes/resources+/theme/theme-session.server.ts'
import fontStylestylesheetUrl from './styles/font.css'
import tailwindStylesheetUrl from './styles/tailwind.css'
import { authenticator, getUserId } from './utils/auth.server.ts'
import { ClientHintCheck, getHints } from './utils/client-hints.tsx'
import { prisma } from './utils/db.server.ts'
import { getEnv } from './utils/env.server.ts'
import { Button } from '~/components/ui/button.tsx'
import { combineHeaders, getDomainUrl } from './utils/misc.ts'
import { useNonce } from './utils/nonce-provider.ts'
import { makeTimings, time } from './utils/timing.server.ts'
import { useOptionalUser } from './utils/user.ts'
import { href as iconsHref } from './components/ui/icon.tsx'
import { Confetti } from './components/confetti.tsx'
import { getFlashSession } from './utils/flash-session.server.ts'
import { useToast } from './utils/useToast.tsx'
import { Toaster } from './components/ui/toaster.tsx'
import { Sidebar } from './components/sidebar.tsx'

export const links: LinksFunction = () => {
	return [
		// Preload svg sprite as a resource to avoid render blocking
		{ rel: 'preload', href: iconsHref, as: 'image' },
		// Preload CSS as a resource to avoid render blocking
		{ rel: 'preload', href: fontStylestylesheetUrl, as: 'style' },
		{ rel: 'preload', href: tailwindStylesheetUrl, as: 'style' },
		cssBundleHref ? { rel: 'preload', href: cssBundleHref, as: 'style' } : null,
		{ rel: 'mask-icon', href: '/favicons/mask-icon.svg' },
		{
			rel: 'alternate icon',
			type: 'image/png',
			href: '/favicons/favicon-32x32.png',
		},
		{ rel: 'apple-touch-icon', href: '/favicons/apple-touch-icon.png' },
		{ rel: 'manifest', href: '/site.webmanifest' },
		{ rel: 'icon', type: 'image/svg+xml', href: '/favicons/favicon.svg' },
		{
			rel: 'icon',
			type: 'image/svg+xml',
			href: '/favicons/favicon-dark.svg',
			media: '(prefers-color-scheme: dark)',
		},
		{ rel: 'stylesheet', href: fontStylestylesheetUrl },
		{ rel: 'stylesheet', href: tailwindStylesheetUrl },
		cssBundleHref ? { rel: 'stylesheet', href: cssBundleHref } : null,
	].filter(Boolean)
}

export const meta: V2_MetaFunction = () => {
	return [
		{ title: 'The Barn' },
		{ name: 'description', content: 'Volunteer scheduling for animal-assisted therapy nonprofits' },
	]
}

export async function loader({ request }: DataFunctionArgs) {
	const timings = makeTimings('root loader')
	const userId = await time(() => getUserId(request), {
		timings,
		type: 'getUserId',
		desc: 'getUserId in root',
	})

	const user = userId
		? await time(
				() =>
					prisma.user.findUnique({
						where: { id: userId },
						select: {
							id: true,
							name: true,
							username: true,
							imageId: true,
							roles: true,
						},
					}),
				{ timings, type: 'find user', desc: 'find user in root' },
		  )
		: null
	if (userId && !user) {
		console.info('something weird happened')
		// something weird happened... The user is authenticated but we can't find
		// them in the database. Maybe they were deleted? Let's log them out.
		await authenticator.logout(request, { redirectTo: '/' })
	}
	const { flash, headers: flasHeaders } = await getFlashSession(request)

	return json(
		{
			user,
			requestInfo: {
				hints: getHints(request),
				origin: getDomainUrl(request),
				path: new URL(request.url).pathname,
				session: {
					theme: await getTheme(request),
				},
			},
			ENV: getEnv(),
			flash,
		},
		{
			headers: combineHeaders(
				new Headers({ 'Server-Timing': timings.toString() }),
				flasHeaders,
			),
		},
	)
}

export const headers: HeadersFunction = ({ loaderHeaders }) => {
	const headers = {
		'Server-Timing': loaderHeaders.get('Server-Timing') ?? '',
	}
	return headers
}

function App() {
	const data = useLoaderData<typeof loader>()
	const nonce = useNonce()
	const user = useOptionalUser()
	const theme = useTheme()
	useToast(data.flash?.toast)

	return (
		<html lang="en" className={`${theme} h-full`}>
			<head>
				<ClientHintCheck nonce={nonce} />
				<Meta />
				<meta charSet="utf-8" />
				<meta name="viewport" content="width=device-width,initial-scale=1" />
				<Links />
			</head>
			<body className="bg-background text-foreground">
				{user ? (
					// Authenticated: sidebar layout
					<div className="flex h-screen overflow-hidden">
						<Sidebar userPreference={data.requestInfo.session.theme} />
						<main className="ml-60 flex-1 overflow-y-auto">
							<Outlet />
						</main>
					</div>
				) : (
					// Unauthenticated: top-nav layout
					<div className="flex min-h-screen flex-col">
						<header className="border-b border-border">
							<div className="flex h-16 w-full items-center justify-between px-8">
								<Link to="/" className="text-h4 font-bold text-sidebar-active">
									The Barn
								</Link>
								<div className="flex items-center gap-3">
									<ThemeSwitch userPreference={data.requestInfo.session.theme} />
									<Button asChild variant="default">
										<Link to="/login">Log In</Link>
									</Button>
								</div>
							</div>
						</header>
						<div className="flex-1">
							<Outlet />
						</div>
					</div>
				)}
				<Confetti confetti={data.flash?.confetti} />
				<Toaster />
				<ScrollRestoration nonce={nonce} />
				<Scripts nonce={nonce} />
				<script
					nonce={nonce}
					dangerouslySetInnerHTML={{
						__html: `window.ENV = ${JSON.stringify(data.ENV)}`,
					}}
				/>
				<LiveReload nonce={nonce} />
			</body>
		</html>
	)
}
export default withSentry(App)
