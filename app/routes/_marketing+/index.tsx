import type { V2_MetaFunction } from '@remix-run/node'
import { horseMountains, ohack} from './logos/logos.ts'
import { ButtonLink } from '~/utils/forms.tsx'
import { useOptionalUser } from '~/utils/user.ts'

export const meta: V2_MetaFunction = () => [{ title: 'Girard Training Stables' }]

export default function Index() {
  const user = useOptionalUser()
	return (
		<main className="relative min-h-screen sm:flex sm:items-center sm:justify-center">
			<div className="relative sm:pb-16 sm:pt-8">
				<div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
					<div className="relative shadow-xl sm:overflow-hidden sm:rounded-2xl">
						<div className="absolute inset-0">
							<img className="h-full w-full object-cover" src={horseMountains} alt="" />
							<div className="absolute inset-0 bg-[color:rgba(27,167,254,0.5)] mix-blend-multiply" />
						</div>
						<div className="lg:pt-18 relative px-4 pb-8 pt-8 sm:px-6 sm:pb-14 sm:pt-16 lg:px-8 lg:pb-20">
							<h1 className="text-center text-mega font-extrabold tracking-tight sm:text-8xl lg:text-9xl">
								<a
									className="block uppercase text-brand-tertiary drop-shadow-md"
									href="https://www.thebarnaz.com"
								>
									Girard Training Stables
								</a>
							</h1>
							<p className="mx-auto mt-6 max-w-lg text-center text-xl text-white sm:max-w-3xl font-semibold bg-slate-500">
								Equestrian Volunteer Scheduling Application
							</p>
              { user ? 
              <ButtonLink className="px-4 max-w-[200px] mx-auto mt-4" to="/calendar" size="sm" variant="primary">
                Go to Calendar
              </ButtonLink>
              :
              <ButtonLink className="px-4 max-w-[100px] mx-auto mt-4" to="/login" size="sm" variant="primary">
                Log In
              </ButtonLink>
              }
						</div>
					</div>
				</div>

				<div className="mx-auto mt-8 max-w-7xl px-4 py-2 sm:px-6 lg:px-8">
					<div className="flex flex-wrap justify-center gap-8 rounded-3xl bg-day-300 py-4">
              <div className='text-black'>Built by:</div>
							<a
								key="ohack.dev"
								href="http://ohack.dev"
								className="flex h-24 justify-center p-1 grayscale transition hover:grayscale-0 focus:grayscale-0"
							>
								<img alt="opportunity hack logo" src={ohack} className="object-contain" />
							</a>
					</div>
				</div>
			</div>
		</main>
	)
}
