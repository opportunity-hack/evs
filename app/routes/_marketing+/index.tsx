import type { V2_MetaFunction } from '@remix-run/node'
import { horseMountains, ohack } from './logos/logos.ts'
import { Link } from '@remix-run/react'
import { Button } from '~/components/ui/button.tsx'
import { useOptionalUser } from '~/utils/user.ts'

export const meta: V2_MetaFunction = () => [
	{ title: 'Girard Training Stables' },
]

export default function Index() {
	const user = useOptionalUser()
	return (
		<main className="relative min-h-screen sm:flex sm:items-center sm:justify-center">
			<div className="relative sm:pb-16 sm:pt-8">
				<div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
					<div className="relative shadow-xl sm:overflow-hidden sm:rounded-2xl">
						<div className="absolute inset-0">
							<img
								className="h-full w-full object-cover"
								src={horseMountains}
								alt=""
							/>
							<div className="absolute inset-0 bg-[color:rgba(27,167,254,0.5)] mix-blend-multiply" />
						</div>
						<div className="lg:pt-18 relative flex flex-col items-center px-4 pb-8 pt-8 sm:px-6 sm:pb-14 sm:pt-16 lg:px-8 lg:pb-20">
							<h1 className="text-center text-5xl font-extrabold tracking-tight sm:text-8xl lg:text-9xl">
								<a
									className="block uppercase text-brand-secondary drop-shadow-md"
									href="https://www.thebarnaz.com"
								>
									The Barn: Volunteer Portal
								</a>
							</h1>
							<p className="mx-auto mt-6 max-w-lg bg-slate-500 px-5 text-center text-xl font-semibold text-white sm:max-w-3xl">
								Equestrian Volunteer Scheduling Application
							</p>
							<div className="mt-8 flex justify-center">
								{user ? (
									<Button
										asChild
										size="wide"
										variant="default"
										className="font-bold"
									>
										<Link to="/calendar">🐴 Go to Calendar</Link>
									</Button>
								) : (
									<Button asChild size="wide" variant="default">
										<Link to="/signup">Sign up to Volunteer</Link>
									</Button>
								)}
							</div>
						</div>
					</div>
				</div>

				<div className="mx-auto mt-8 max-w-7xl px-4 py-2 sm:px-6 lg:px-8">
					<div className="flex flex-col flex-wrap items-center justify-center gap-8 rounded-3xl bg-slate-100 py-4 dark:bg-slate-200">
						<div className="text-center text-black">
							<b>
								<a href="https://trottrack.org">Trot Track</a>
							</b>{' '}
							is built by:
							<a
								key="ohack.dev"
								href="http://ohack.dev"
								className="flex h-24 justify-center p-1 grayscale transition hover:grayscale-0 focus:grayscale-0"
							>
								<img
									alt="opportunity hack logo"
									src={ohack}
									className="mb-0 mt-0 object-contain"
								/>
							</a>
						</div>
					</div>
				</div>
			</div>
		</main>
	)
}
