import type { V2_MetaFunction } from '@remix-run/node'
import { Link } from '@remix-run/react'
import { Calendar, Users, Footprints, Building2 } from 'lucide-react'
import { Button } from '~/components/ui/button.tsx'
import { useOptionalUser } from '~/utils/user.ts'
import { siteName } from '~/data.ts'

export const meta: V2_MetaFunction = () => {
	return [
		{ title: `${siteName} — Volunteer Scheduling for Nonprofits` },
		{
			name: 'description',
			content:
				'The Barn helps animal-assisted therapy nonprofits coordinate volunteers, manage animals, and schedule events — all in one place.',
		},
	]
}

const features = [
	{
		icon: <Calendar size={32} />,
		title: 'Event Scheduling',
		description:
			'Create and manage therapy sessions, assign animals, and set volunteer slots with a visual calendar.',
	},
	{
		icon: <Users size={32} />,
		title: 'Volunteer Management',
		description:
			'Volunteers self-register for roles. Admins see who is coming, assign handlers, and send bulk emails.',
	},
	{
		icon: <Footprints size={32} />,
		title: 'Animal Tracking',
		description:
			'Track your animals, manage cooldown periods between events, and prevent scheduling conflicts automatically.',
	},
	{
		icon: <Building2 size={32} />,
		title: 'Multi-Org Support',
		description:
			'Each organization gets its own isolated workspace. Data never crosses between organizations.',
	},
]

export default function Index() {
	const user = useOptionalUser()

	return (
		<div className="flex flex-col">
			{/* Hero */}
			<section className="flex flex-col items-center justify-center px-4 pb-72 pt-24 text-center sm:pb-96 sm:pt-36">
				<span className="mb-4 inline-block rounded-full bg-indigo-50 px-4 py-1.5 text-body-xs font-semibold uppercase tracking-wider text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
					Volunteer Scheduling for Nonprofits
				</span>
				<h1 className="max-w-3xl text-h2 font-extrabold tracking-tight sm:text-h1">
					Coordinate volunteers.{' '}
					<span className="text-indigo-600">Simplify scheduling.</span>
				</h1>
				<p className="mx-auto mt-6 max-w-xl text-body-md text-muted-foreground">
					The Barn gives your organization a dedicated space to manage events,
					track animals, and keep volunteers in sync — with zero spreadsheets.
				</p>
				<div className="mt-10 flex flex-wrap justify-center gap-4">
					{user ? (
						<Button asChild size="wide" className="bg-indigo-600 hover:bg-indigo-700">
							<Link to="/calendar">Go to Calendar</Link>
						</Button>
					) : (
						<>
							<Button asChild size="wide" className="bg-indigo-600 hover:bg-indigo-700 text-white">
								<Link to="/org-signup">Register Your Organization</Link>
							</Button>
							<Button asChild size="wide" variant="outline">
								<Link to="/login">Log In</Link>
							</Button>
						</>
					)}
				</div>
			</section>

			{/* Features */}
			<section className="border-t border-border bg-muted/40 px-4 py-20">
				<div className="mx-auto max-w-5xl">
					<h2 className="mb-12 text-center text-h4">
						Everything your org needs
					</h2>
					<div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
						{features.map(f => (
							<div
								key={f.title}
								className="rounded-xl border border-border bg-background p-6"
							>
								<div className="mb-4 text-foreground">{f.icon}</div>
								<h3 className="mb-2 text-h6">{f.title}</h3>
								<p className="text-body-xs text-muted-foreground">{f.description}</p>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* CTA strip */}
			<section className="px-4 py-20 text-center">
				<h2 className="mb-4 text-h4">Ready to get started?</h2>
				<p className="mb-8 text-body-md text-muted-foreground">
					Set up your organization in minutes. No credit card required.
				</p>
				{!user && (
					<Button asChild size="wide" className="bg-indigo-600 hover:bg-indigo-700 text-white">
						<Link to="/org-signup">Create Free Account</Link>
					</Button>
				)}
			</section>
		</div>
	)
}
