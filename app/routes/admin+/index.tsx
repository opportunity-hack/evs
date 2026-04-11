import { redirect, type DataFunctionArgs } from '@remix-run/node'
import { requireAdmin } from '~/utils/permissions.server.ts'

export async function loader({ request }: DataFunctionArgs) {
	await requireAdmin(request)
	throw redirect('/admin/users')
}
