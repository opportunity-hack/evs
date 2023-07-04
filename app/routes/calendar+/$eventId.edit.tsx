import { json, type DataFunctionArgs } from "@remix-run/node";
import { Form, useActionData, useFormAction, useLoaderData, useNavigate, useNavigation } from "@remix-run/react";
import { useState } from "react";
import invariant from "tiny-invariant";
import { parse } from '@conform-to/zod';
import { z } from "zod";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "~/components/ui/dialog.tsx";
import { Icon } from "~/components/ui/icon.tsx";
import { prisma } from "~/utils/db.server.ts";
import { requireAdmin } from "~/utils/permissions.server.ts";
import { HorseListbox, InstructorListbox } from '~/components/listboxes.tsx'
import { addMinutes, differenceInMinutes, format } from "date-fns";
import { redirectWithToast } from "~/utils/flash-session.server.ts";
import { conform, useForm } from "@conform-to/react";
import { Field } from "~/components/forms.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select.tsx";
import { Label } from "~/components/ui/label.tsx";
import { Separator } from "@radix-ui/react-dropdown-menu";
import { StatusButton } from "~/components/ui/status-button.tsx";

export const loader = async ({ request, params }: DataFunctionArgs) => {
  await requireAdmin(request)
  invariant(params.eventId, "Missing event id")

  const instructors = await prisma.user.findMany({ 
    where: { instructor: true, }
  })
  const horses = await prisma.horse.findMany()
  const event = await prisma.event.findUnique({
    where: { id: params.eventId },
    include: {
      horses: true,
      instructors: true,
    }
  })

  if (!event) {
    throw new Response('not found', { status: 404 })
  }
  return json({ event, horses, instructors })
}

const horseSchema = z.object({
  id: z.string(),
  name: z.string(),
})

const instructorSchema = z.object({
  id: z.string(),
  name: z.string(),
  username: z.string(),
})

const editEventSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  startDate: z.coerce.date(),
  duration: z.coerce.number().gt(0),
  horses: z.array(horseSchema),
  instructor: instructorSchema,
  barnCrewReq: z.coerce.number().gt(-1),
  pastureCrewReq: z.coerce.number().gt(-1),
  lessonAssistantsReq: z.coerce.number().gt(-1),
  sideWalkersReq: z.coerce.number().gt(-1),
  horseLeadersReq: z.coerce.number().gt(-1),
});

export async function action({ request, params }: DataFunctionArgs) {
  await requireAdmin(request)
  invariant(params.eventId, "Missing event id")
  const formData = await request.formData();
  const submission = parse(formData, { schema: () => { return editEventSchema } })
  if (!submission.value) {
    return json(
      {
        status: 'error',
        submission,
      } as const,
      { status: 400 },
    )
  }

  const title = submission.value.title
  const start = submission.value.startDate
  const end = addMinutes(start, submission.value.duration)

  const instructorId = submission.value.instructor.id
  const horseIds = submission.value.horses.map(e => { return {id: e.id} })

  const barnCrewReq = submission.value.barnCrewReq
  const pastureCrewReq = submission.value.pastureCrewReq
  const lessonAssistantsReq = submission.value.lessonAssistantsReq
  const sideWalkersReq = submission.value.sideWalkersReq
  const horseLeadersReq = submission.value.horseLeadersReq

  const updatedEvent = await prisma.event.update({
    where: {
      id: params.eventId
    },
    data: {
      title,
      start,
      end,
      instructors: {
        set: { id: instructorId }
      },
      horses: {
        set: horseIds
      },
      barnCrewReq,
      pastureCrewReq,
      lessonAssistantsReq,
      sideWalkersReq,
      horseLeadersReq,
    }
  })

  if (!updatedEvent) {
    return redirectWithToast("..",
    {
      title: `Error`,
      variant: "destructive",
      description: `Failed to update event`,
    })
  }

  return redirectWithToast("..", {
    title: "Success", 
    description: `Updated event ${updatedEvent.title}` 
  })
}

export default function EventEditor() {
  const data = useLoaderData<typeof loader>() || {}
  const actionData = useActionData<typeof action>()
  const [open, setOpen] = useState(true)

  const navigation = useNavigation()
  const formAction = useFormAction()

  const isSubmitting =
    navigation.state === 'submitting' &&
    navigation.formAction === formAction &&
    navigation.formMethod === "PUT"

  const navigate = useNavigate()
	const dismissModal = () => {
		setOpen(false)
		navigate('..', { preventScrollReset: true })
	}

  const defaultDuration = data.event ? differenceInMinutes(
          new Date(data.event.end), new Date(data.event.start)) : 30

  const [form, fields] = useForm({
    id: 'edit-horse',
    lastSubmission: actionData?.submission,
    defaultValue: {
      title: data.event?.title,
      startDate: data.event ? format(new Date(data.event.start), "yyyy-MM-dd'T'HH:mm:00") : '',
      duration: defaultDuration,
      horses: data.event?.horses,
      instructor: data.event?.instructors[0],
      barnCrewReq: data.event?.barnCrewReq,
      pastureCrewReq: data.event?.pastureCrewReq,
      horseLeadersReq: data.event?.horseLeadersReq,
      sideWalkersReq: data.event?.sideWalkersReq,
      lessonAssistantsReq: data.event?.lessonAssistantsReq,
    },
    shouldRevalidate: 'onSubmit',
  })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        onEscapeKeyDown={dismissModal}
        onPointerDownOutside={dismissModal}
      >
        <DialogHeader>
          <DialogTitle>
            Edit Event - {data.event?.title}
          </DialogTitle>
        <DialogDescription>
          Edit the event using this form. Click save to save your changes.
        </DialogDescription>
        </DialogHeader>
        <Form className="grid grid-cols-2 gap-x-2 gap-y-4" method="PUT" {...form.props}>
          <Field
            className="col-span-2"
            labelProps={{
              htmlFor: fields.title.id,
              children: 'Title'
            }}
            inputProps={conform.input(fields.title)}
            errors={fields.title.errors}
          />
          <Field
            labelProps={{
              htmlFor: fields.startDate.id,
              children: 'Start Date'
            }}
            inputProps={{
            ...conform.input(fields.startDate),
            type: "datetime-local"
            }}
            errors={fields.startDate.errors}
          />
          <div>
          <Label htmlFor="duration">Duration</Label>
          <Select name="duration" defaultValue={defaultDuration.toString()}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30">30 minutes</SelectItem>
              <SelectItem value="60">60 minutes</SelectItem>
              <SelectItem value="90">90 minutes</SelectItem>
            </SelectContent>
          </Select>
          </div>
          <div>
            <Label htmlFor="horses">Horses</Label>
            <HorseListbox name="horses" horses={data.horses} defaultValues={data.event?.horses} />
          </div>
          <div>
            <Label htmlFor="instructor">Instructor</Label>
            <InstructorListbox name="instructor" instructors={data.instructors} defaultValue={data.event?.instructors[0]} />
          </div>
          <Separator className="col-span-2 border" />
          <Field
            labelProps={{ htmlFor: fields.barnCrewReq.id, children: 'Barn crew needed' }}
            inputProps={{
              ...conform.input(fields.barnCrewReq),
              type: "number"
            }}
            errors={fields.barnCrewReq.errors}
          />
          <Field
            labelProps={{ htmlFor: fields.pastureCrewReq.id, children: 'Pasture crew needed' }}
            inputProps={{
              ...conform.input(fields.pastureCrewReq),
              type: "number"
            }}
            errors={fields.pastureCrewReq.errors}
          />
          <Field
            labelProps={{ htmlFor: fields.lessonAssistantsReq.id, children: 'Lesson assistants needed' }}
            inputProps={{
              ...conform.input(fields.lessonAssistantsReq),
              type: "number"
            }}
            errors={fields.lessonAssistantsReq.errors}
          />
          <Field
            labelProps={{ htmlFor: fields.sideWalkersReq.id, children: 'Sidewalkers needed' }}
            inputProps={{
              ...conform.input(fields.sideWalkersReq),
              type: "number"
            }}
            errors={fields.sideWalkersReq.errors}
          />
          <Field
            labelProps={{ htmlFor: fields.horseLeadersReq.id, children: 'Horse leaders needed' }}
            inputProps={{
              ...conform.input(fields.horseLeadersReq),
              type: "number"
            }}
            errors={fields.horseLeadersReq.errors}
          />
						<StatusButton
              className="relative top-6 max-w-[125px] mx-auto"
							type="submit"
							status={isSubmitting ? "pending" : actionData?.status ?? "idle"}
						>
							Save
						</StatusButton>
        </Form>
        <DialogFooter>
        </DialogFooter>
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
