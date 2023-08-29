import { ActionArgs, LoaderArgs, json } from '@remix-run/node'
import { useFetcher } from '@remix-run/react';
import { Field } from '~/components/forms.tsx';
import { StatusButton } from '~/components/ui/status-button.tsx';
import { getPasswordHash } from '~/utils/auth.server.ts';
import { prisma } from '~/utils/db.server.ts';
import { requireAdmin } from '~/utils/permissions.server.ts'

export async function action({ request }: ActionArgs) {
	await requireAdmin(request)
  const formData = await request.formData()
  const password = formData.get("new_signup_password")?.toString()

  if (!password || password == "") {
    return json({ status: 'error', message: "no password provided"} as const)
  }

  const deleteOldPasswordOperation = prisma.signupPassword.deleteMany()
  const createNewPassword = prisma.signupPassword.create({
      data: {
        hash: await getPasswordHash(password)
    }
  })

  try {
    await prisma.$transaction([deleteOldPasswordOperation, createNewPassword])
    return json({ status: 'success', message: "successfully set signup password" } as const)
  } catch {
    return json({ status: 'error', message: "internal server error. Failed to update password." } as const)
  }
}

export function SetSignupPasswordForm() {
  const fetcher = useFetcher<typeof action>();
  const data = fetcher.data

  return (
    <fetcher.Form
      action="/resources/signup_password"
      method="PUT"
    >
      <div className="flex items-center gap-2">
        <Field
          labelProps={{
            children: 'Set sign-up secret'
          }}
          inputProps={{
            name: "new_signup_password"
          }}
          className="max-w-sm"
        />
        <StatusButton
          type="submit"
          status={
              fetcher.state === 'submitting'
              ? 'pending'
              : fetcher.data?.status
          }
          disabled={fetcher.state !== 'idle'}
        >
          submit
        </StatusButton>
        <p>{data?.message}</p>
      </div>
    </fetcher.Form>
  )
}
