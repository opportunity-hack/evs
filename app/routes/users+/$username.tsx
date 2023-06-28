import { siteName } from '~/data.ts'
import {
	json,
	type DataFunctionArgs,
	type V2_MetaFunction,
  useLoaderData,
  Form
} from '~/remix.ts'
import { differenceInYears } from 'date-fns'
import invariant from 'tiny-invariant'
import { GeneralErrorBoundary } from '~/components/error-boundary.tsx'
import { Spacer } from '~/components/spacer.tsx'
import { prisma } from '~/utils/db.server.ts'
import { Button, ButtonLink } from '~/utils/forms.tsx'
import { getUserImgSrc } from '~/utils/misc.ts'
import { useOptionalUser } from '~/utils/user.ts'

export async function loader({ params }: DataFunctionArgs) {
	invariant(params.username, 'Missing username')
	const user = await prisma.user.findUnique({
		where: { username: params.username },
		select: {
			id: true,
			username: true,
			name: true,
      birthdate: true,
      height: true,
      yearsOfExperience: true,
			imageId: true,
			createdAt: true,
		},
	})
	if (!user) {
		throw new Response('not found', { status: 404 })
	}
	return json({ user, userJoinedDisplay: user.createdAt.toLocaleDateString() })
}

export default function UsernameIndex() {
	const data = useLoaderData<typeof loader>()
	const user = data.user
	const userDisplayName = user.name ?? user.username
	const loggedInUser = useOptionalUser()
	const isLoggedInUser = data.user.id === loggedInUser?.id

  let age = null
  if (data.user.birthdate) {
    age = differenceInYears(new Date(), data.user.birthdate)
  }
  console.log(age)

	return (
		<div className="container mx-auto mb-48 mt-36 flex flex-col items-center justify-center">
			<Spacer size="4xs" />

			<div className="container mx-auto flex flex-col items-center rounded-3xl bg-muted p-12">
				<div className="relative w-52">
					<div className="absolute -top-40">
						<div className="relative">
							<img
								src={getUserImgSrc(data.user.imageId)}
								alt={userDisplayName}
								className="h-52 w-52 rounded-full object-cover"
							/>
						</div>
					</div>
				</div>

				<Spacer size="sm" />

				<div className="flex flex-col items-center">
					<div className="flex flex-wrap items-center justify-center gap-4">
						<h1 className="text-center text-h2">{userDisplayName}</h1>
					</div>
					<p className="mt-2 text-center muted-foreground">
						Joined {data.userJoinedDisplay}
					</p>
          {age ? 
          <p className="">
          {`Age: ${age}`}
          </p> 
          : null}
          {data.user.height ? 
          <p className="">
          {`Height: ${data.user.height}`}
          </p>
         : null}
          { data.user.yearsOfExperience !== null ? 
          <p className="">
          {`Years of experience: ${data.user.yearsOfExperience}`}
          </p> 
          : null}
					{isLoggedInUser ? (
						<Form action="/logout" method="POST" className="mt-3">
							<Button type="submit" variant="secondary" size="pill">
								Logout
							</Button>
						</Form>
					) : null}
					<div className="mt-10 flex gap-4">
						{isLoggedInUser ? (
							<>
								<ButtonLink
									to="/settings/profile"
									variant="secondary"
									size="md"
									prefetch="intent"
								>
									Edit profile
								</ButtonLink>
							</>
						) : (
							null
						)}
					</div>
				</div>
			</div>
		</div>
	)
}

export function ErrorBoundary() {
	return (
		<GeneralErrorBoundary
			statusHandlers={{
				404: ({ params }) => (
					<p>No user with the username "{params.username}" exists</p>
				),
			}}
		/>
	)
}

export const meta: V2_MetaFunction = ({ params }) => {
  // Can't use type TypedMetaFunction from remix-typedjson here to load the user's name
  // because it relies on the old V1_HtmlMetaDescriptor type.
	const displayName = params.username
	return [
		{ title: `${displayName} | ${siteName}` },
		{
			name: 'description',
			content: `Profile of ${displayName} on ${siteName}`,
		},
	]
}
