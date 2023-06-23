import { z } from 'zod'
import { requireUserId } from '~/utils/auth.server.ts'
import { parse } from '@conform-to/zod'
import { json, DataFunctionArgs } from '~/remix.ts'
import { prisma } from '~/utils/db.server.ts'

const actions = [
  "register",
  "unregister",
] as const

const volunteerTypes = [
    "barnCrew",
    "pastureCrew",
    "lessonAssistants",
    "sideWalkers",
    "horseLeaders",
] as const

const EventRegistrationSchema = z.object({
  _action: z.enum(actions),
  eventId: z.string(),
  role: z.enum(volunteerTypes)
})

export async function action({ request }: DataFunctionArgs) {
  const userId = await requireUserId(request)
  const formData = await request.formData()
  const submission = parse(formData, {
    schema: EventRegistrationSchema,
    acceptMultipleErrors: () => true,
  })

  if (!submission.value || submission.intent !== 'submit') {
    return json(
      {
        status: 'error',
        submission,
      } as const,
      { status: 400 },
    )
  }

  if (submission.value._action === "unregister") {
    await prisma.event.update({
      where: { 
        id: submission.value.eventId
      },
      data: {
        [submission.value.role]: {
          disconnect: {
            id: userId
          }
        }
      },
    })
    return json(
      {
        status: 'successfully unregistered',
        submission,
      } as const,
      { status: 200 },
    )
  }

  await prisma.event.update({
    where: { 
      id: submission.value.eventId
    },
    data: {
      [submission.value.role]: {
        connect: {
          id: userId
        }
      }
    },
  })
  return json(
    {
      status: 'success',
      submission,
    } as const,
    { status: 200 },
  )
}
