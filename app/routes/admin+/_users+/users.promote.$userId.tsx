import { useState } from "react"
import { 
  Dialog,
  DialogHeader,
  DialogContent,
  DialogDescription,
  DialogClose,
  DialogTitle,
  DialogFooter,
} from "~/components/ui/dialog.tsx"
import { Icon } from "~/components/ui/icon.tsx"
import { Form, useActionData, useFormAction, useLoaderData, useNavigate, useNavigation } from "@remix-run/react"
import { requireAdmin } from "~/utils/permissions.server.ts"
import { prisma } from "~/utils/db.server.ts"
import { StatusButton } from "~/components/ui/status-button.tsx"
import { Button } from "~/components/ui/button.tsx"
import { json, type DataFunctionArgs } from "@remix-run/node"
import invariant from "tiny-invariant"
import { parse } from '@conform-to/zod'
import { useForm } from '@conform-to/react'
import { z } from "zod"
import { redirectWithToast } from "~/utils/flash-session.server.ts"

export const loader = async({ request, params }: DataFunctionArgs) => {
  await requireAdmin(request)
  invariant(params.userId, "Missing user id")
  const user = await prisma.user.findUnique({
    where: {id: params.userId},
    include: {
      roles: true
    }
  })
  if (!user) {
    throw new Response('not found', { status: 404 })
  }
  return json({ user })
}

const promoteSchema = z.object({
  _action: z.enum(["promote", "demote"])
})


export const action = async({ request, params }: DataFunctionArgs) => {
  await requireAdmin(request)
  invariant(params.userId, "Missing user id")
  const formData = await request.formData()
  const submission = parse(formData, { schema: promoteSchema })
  if (!submission.value) {
    return json(
      { status: 'error',
        submission,
      } as const,
      { status: 400},
    )
  }
  const adminRole = await prisma.role.findFirst({
    where: {
      name: 'admin'
    }
  })
  if (!adminRole) {
    return redirectWithToast("..", {
      title: "Failed",
      description: "No admin role defined",
      variant: "destructive"
    })
  }

  let user;
  if (submission.value._action === "promote") {
    user = await prisma.user.update({ 
      where: { id: params.userId },
      data: {
        roles: {
          connect: { id: adminRole.id }
        }
      }
    })
    return redirectWithToast("..", {
      title: "Success",
      description: `Promoted user ${user.name ?? user.username} to admin`,
    })
  } else if (submission.value._action === "demote") {
      user = await prisma.user.update({ 
      where: { id: params.userId },
      data: {
        roles: {
          disconnect: { id: adminRole.id }
        }
      }
     })
     return redirectWithToast("..", {
       title: "Success",
       description: `Demoted ${user.name ?? user.username} to normal user`,
     })
  } else {
    return json(
      { status: 'error',
        submission,
      } as const,
      { status: 400},
    )
  }
}

export default function PromotionModal() {
  const data = useLoaderData<typeof loader>() || {}
  const actionData = useActionData<typeof action>()

  const navigation = useNavigation()
  const formAction = useFormAction()

  const isSubmitting =
    navigation.state === 'submitting' &&
    navigation.formAction === formAction &&
    navigation.formMethod === "POST"

  const [open, setOpen] = useState(true)
  const navigate = useNavigate()
	const dismissModal = () => {
		setOpen(false)
		navigate('..', { preventScrollReset: true })
	}

  const userIsAdmin = data.user?.roles.find((role) => role.name == 'admin')

  const [form] = useForm({
    id: 'promote-user',
    shouldRevalidate: "onSubmit",
  })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
				onEscapeKeyDown={dismissModal}
				onPointerDownOutside={dismissModal}
      >
        <DialogHeader>
        <DialogTitle>{userIsAdmin ? "Revoke admin status?" : "Promote user to admin?"}</DialogTitle>
        <DialogDescription>
        Proceeding will{userIsAdmin ? " revoke this user's " : " give this user "}permission to edit user, horse, and event data.
        </DialogDescription>

        <DialogFooter className="gap-2 sm:justify-center">
          <Form method="POST" {...form.props}>
            <StatusButton
              type="submit"
              status={isSubmitting ? 'pending' : actionData?.status ?? 'idle'}
              variant="destructive"
              name="_action"
              value={ userIsAdmin ? "demote" : "promote" }
            >
            Continue
            </StatusButton>
          </Form>
          <Button
            onClick={dismissModal}
          >
            Cancel
          </Button>
        </DialogFooter>
        </DialogHeader>
				<DialogClose asChild>
					<button
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
