import { type DataFunctionArgs } from '@remix-run/node'
import { Link } from '@remix-run/react'
import { requireUserId } from '~/utils/auth.server.ts'
import { Button } from '~/components/ui/button.tsx'

export async function loader({ request }: DataFunctionArgs) {
	await requireUserId(request)
	return null
}

export default function OrgSetup() {
	return (
		<div className="flex min-h-full flex-col items-center justify-center gap-6 pb-32 pt-20">
			<h1 className="text-h2">No Organization Found</h1>
			<p className="max-w-md text-center text-muted-foreground">
				Your account is not associated with any organization. Ask your
				organization admin to add you, or register a new organization.
			</p>
			<div className="flex gap-4">
				<Button asChild variant="default">
					<Link to="/org-signup">Register Your Organization</Link>
				</Button>
				<Button asChild variant="outline">
					<Link to="/login">Log in with a different account</Link>
				</Button>
			</div>
		</div>
	)
}
