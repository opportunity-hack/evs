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


export const loader = async({ request, params }: DataFunctionArgs) => {
  await requireAdmin(request)
  invariant(params.horseId, "Missing horse id")
  const horse = await prisma.horse.findUnique({ where: {id: params.horseId} })
  if (!horse) {
    throw new Response('not found', { status: 404 })
  }
  return json({ horse })
};

export const deleteHorseFormSchema = z.object({
  name: z.string().min(1, {message: 'You must enter the name of this horse to delete it from the database.'})
})

export async function action({ request, params }: DataFunctionArgs) {
  await requireAdmin(request)
  invariant(params.horseId, "Missing horse id")
  const formData = await request.formData()
  const horse = await prisma.horse.findUnique({ where: { id: params.horseId }}) 
  if (!horse) {
      throw new Response('not found', { status: 404 })
  }
  const submission = await parse(formData, {
    async: true,
    schema: deleteHorseFormSchema.superRefine(
      async({ name }, ctx) => {
        if (horse.name != name) {
          ctx.addIssue({
            path: ['name'],
            code: 'custom',
            message: 'That is not the correct name.',
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

  let deletedHorse;
  try {
    deletedHorse = await prisma.horse.delete({
      where: { id: params.horseId }
    })
  } catch {
    return redirectWithToast("/admin/horses", { 
      title: "Error", 
      variant: "destructive",
      description: "Failed to delete horse",
    })
  }

  return redirectWithToast("/admin/horses", { 
    title: "Success", 
    description: `Deleted horse ${deletedHorse.name}`,
  })
}

export default function DeleteHorse() {
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
    id: 'edit-horse',
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
        <DialogTitle>Delete Horse</DialogTitle>
        <DialogDescription>
          Are you sure you want to remove {data.horse?.name} from the database? This will affect all associated events and assignments.
        </DialogDescription>

        <Form method="DELETE" {...form.props}>
            <Field
              labelProps={{
                htmlFor: fields.name.id,
                children: `To confirm, type "${data.horse?.name}" into the box.`,
              }}
              inputProps={{
                ...conform.input(fields.name)
              }}
              errors={fields.name.errors}
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
