import { useState } from "react"
import { Dialog, DialogHeader, DialogContent, DialogDescription, DialogClose, DialogTitle, DialogFooter } from "~/components/ui/dialog.tsx"
import { Icon } from "~/components/ui/icon.tsx"
import { Field } from "~/components/forms.tsx"
import { Form, useLoaderData, useNavigate, useActionData, useNavigation, useFormAction } from "@remix-run/react"
import { json, type DataFunctionArgs } from "@remix-run/node"
import { requireAdmin } from "~/utils/permissions.server.ts"
import { prisma } from "~/utils/db.server.ts"
import invariant from "tiny-invariant"
import { conform, useForm } from '@conform-to/react'
import { parse } from '@conform-to/zod'
import { redirectWithToast } from "~/utils/flash-session.server.ts"
import { StatusButton } from "~/components/ui/status-button.tsx"
import { Button } from "~/components/ui/button.tsx"
import { z } from "zod"

export const loader = async ({ request, params }: DataFunctionArgs) => {
  await requireAdmin(request)
  invariant(params.userId, "Missing user id")
  const user = await prisma.user.findUnique({ where: { id: params.userId } })
  if (!user) {
    throw new Response('not found', { status: 404 })
  }
  return json({ user })
}

export const deleteUserFormSchema = z.object({
  username: z.string().min(1, { message: 'You must enter the username of this user to delete it from the database.' })
})

export async function action({ request, params }: DataFunctionArgs) {
  await requireAdmin(request)
  invariant(params.userId, "Missing user id")
  const formData = await request.formData()
  const user = await prisma.user.findUnique({ where: { id: params.userId } })
  if (!user) {
    throw new Response('not found', { status: 404 })
  }
  const submission = await parse(formData, {
    async: true,
    schema: deleteUserFormSchema.superRefine(
      async ({ username }, ctx) => {
        if (user.username !== username) {
          ctx.addIssue({
            path: ['username'],
            code: 'custom',
            message: 'That is not the correct username.',
          })
        }
      }),
  })

  if (submission.intent !== 'submit') {
    return json({ status: 'idle', submission } as const)
  }
  if (!submission.value) {
    return json(
      {
        status: 'error',
        submission,
      } as const,
      { status: 400 },
    )
  }

  let deletedUser;
  try {
    deletedUser = await prisma.user.delete({
      where: { id: params.userId }
    })
  } catch {
    return redirectWithToast("/admin/users", {
      title: "Error",
      variant: "destructive",
      description: "Failed to delete user",
    })
  }

  return redirectWithToast("/admin/users", {
    title: "Success",
    description: `Deleted user ${deletedUser.username}`,
  })
}
export default function DeleteUser() {
  const data = useLoaderData<typeof loader>() || {}
  const actionData = useActionData<typeof action>()
  const [open, setOpen] = useState(true)

  const navigation = useNavigation()
  const formAction = useFormAction()

  const isSubmitting =
    navigation.state === 'submitting' &&
    navigation.formAction === formAction &&
    navigation.formMethod === "DELETE"

  const navigate = useNavigate()
  const dismissModal = () => {
    setOpen(false)
    navigate('..', { preventScrollReset: true })
  }
  const [form, fields] = useForm({
    id: 'delete-user',
    lastSubmission: actionData?.submission,
    shouldRevalidate: 'onSubmit',
  })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        onEscapeKeyDown={dismissModal}
        onPointerDownOutside={dismissModal}
      >
        <DialogHeader>
          <DialogTitle>Delete User</DialogTitle>
          <DialogDescription>
            Are you sure you want to remove {data.user?.name ?? data.user?.username} from the database? This operation is permanent, and will affect all associated events and assignment relations.
          </DialogDescription>

          <Form method="DELETE" {...form.props}>
            <Field
              labelProps={{
                htmlFor: fields.username.id,
                children: `To confirm, type "${data.user?.username}" into the box.`,
              }}
              inputProps={{
                ...conform.input(fields.username),
                autoComplete: 'off'
              }}
              errors={fields.username.errors}
            />
            <DialogFooter className="gap-2 sm:justify-center">
              <StatusButton
                type="submit"
                status={isSubmitting ? 'pending' : actionData?.status ?? 'idle'}
                variant="destructive"
              >
                Confirm Deletion
              </StatusButton>
              <Button
                type="button"
                onClick={dismissModal}
              >
                Cancel
              </Button>
            </DialogFooter>
          </Form>
        </DialogHeader>
        <DialogClose asChild>
          <button
            type="button"
            onClick={dismissModal}
            aria-label="Close"
            className="absolute right-10 top-10"
          >
            <Icon name="cross-1" />
          </button>
        </DialogClose>
      </DialogContent>
    </Dialog>
  )
}

