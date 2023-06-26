import { format } from 'date-fns'
import { Card } from '~/components/ui/card.tsx';
import { useLoaderData, json, useSubmit } from '~/remix.ts'
import type { LoaderArgs, ActionArgs } from '~/remix.ts'
import { prisma } from '~/utils/db.server.ts';
import { Button } from '~/utils/forms.tsx';
import { getUserImgSrc, getHorseImgSrc } from '~/utils/misc.ts';

import type { UserData, CalEvent } from '~/data.ts'
import { volunteerTypes } from '~/data.ts';
import { ArrowRight, Check } from 'lucide-react';
import { clsx } from 'clsx';
import { useFetcher } from '@remix-run/react';
import { z } from 'zod'
import { useState } from 'react';
import { parse } from '@conform-to/zod';
import { requireAdmin } from '~/utils/permissions.server.ts';
import invariant from 'tiny-invariant';

export async function loader({ params }: LoaderArgs) {
  const id = params.eventId;
  const event = await prisma.event.findUnique({
    where: {
      id,
    },
    include: {
      instructors: {
        select: {
          id: true,
          name: true,
          username: true,
          imageId: true,
        }
      },
      horses: true,
      barnCrew: true,
      pastureCrew: true,
      lessonAssistants: true,
      horseLeaders: true,
      sideWalkers: true,
      horseAssignments: {
        select: {
          userId: true,
          horseId: true,
        },
      },
    }
  })
  if (!event) {
    throw new Response('not found', { status: 404 })
  }
  return json({ event })
}

const assignHorseSchema = z.object({
  user: z.string(),
  horse: z.string(),
})

export const action = async ({ request, params }: ActionArgs) => {
  requireAdmin(request)
  const formData = await request.formData()
  const submission = parse(formData, { schema: () => { return assignHorseSchema } })

  if (!submission.value) {
    return json(
    {
      status: 'error',
      submission,
    } as const,
    { status: 400},
    )
  }

  invariant(params.eventId, "Expected params.eventId")
  const eventId = params.eventId
  const userId = submission.value.user
  const horseId = submission.value.horse

  if (horseId === "none") {
    await prisma.horseAssignment.delete({
        where: {
          eventId_userId: {
            eventId,
            userId,
          }
        }
    })
    return json(
      {
        status: 'ok',
        submission,
      } as const,
      {
        status: 200
      }
    )
  }

  await prisma.horseAssignment.upsert({
    where: {
      eventId_userId: {
        eventId,
        userId,
      }
    },
    update: {
      horse: {
        connect: { id: horseId }
      },
    },
    create: {
      event: {
        connect: { id: eventId }
      },
      volunteer: {
        connect: { id: userId }
      },
      horse: {
        connect: { id: horseId }
      },
    }
  })

  return json(
    {
      status: 'ok',
      submission,
    } as const,
    {
      status: 200
    }
  )
}

export default function() {
   const data = useLoaderData<typeof loader>()
   const event = data.event

   return (
    <div className="container flex flex-wrap w-full">
      <section className="md:sticky md:top-20 h-fit md:w-2/5 pr-2">
          <h1 className="text-h2 uppercase">Event Details</h1>
          <Card className="px-4 py-6">
          <div className="flex justify-between items-center">
            <h2 className="font-bold text-2xl">{event.title}</h2>
            <Button className="" variant="primary" size="sm">Edit</Button>
          </div>
          <div className="flex gap-x-4 flex-wrap">
            <div className="text-lg">{format(event.start, "MMMM do, y")}</div>
            <div className="text-lg"> {format(event.start, "p")} - {format(event.end, "p")}</div>
          </div>
          <div className="mt-4">
            Instructor{event.instructors.length > 1 ? "s" : null}: {event.instructors.map(instructor => {
            return <div className="flex items-center gap-2">
            <img 
            className="h-8 w-8 rounded-full object-cover"
            alt={instructor.name ?? instructor.username}
            src={getUserImgSrc(instructor.imageId)}
            />
              <div>{instructor.name ? instructor.name : instructor.username}</div>
            </div>
            })}
          </div>
          <div className="flex flex-col gap-2 mt-4">
            Horses: {event.horses.map(horse => {
            return <div className="flex items-center gap-2">
            <img 
            className="h-8 w-8 rounded-full object-cover"
            alt={horse.name}
            src={getHorseImgSrc(horse.imageId)}
            />
              <div>{horse.name}</div>
            </div>
            })}
          </div>
        </Card>
      </section>
      <section className="md:w-3/5 flex flex-col">
      <h2 className="text-h2 uppercase">Volunteers</h2>
      <div className="flex flex-wrap gap-4 w-full">
      { volunteerTypes.map((_, i) => {
        return <VolunteerSection key={i} volunteerTypeIdx={i} event={event} />
      }) }
      </div>
      </section>
    </div>
  )
}

interface volunteerSectionProps {
  volunteerTypeIdx: number
  event: CalEvent
}

export function VolunteerSection({ volunteerTypeIdx, event }: volunteerSectionProps) {
  const idx = volunteerTypeIdx
  const vts = volunteerTypes
  const volunteers = event[vts[idx].field]
  const volunteersRequired = event[vts[idx].reqField]

  let unfilled = volunteersRequired - volunteers.length
  let placeholders = []
  for (unfilled; unfilled > 0; unfilled--) {
    placeholders.push(
      <VolunteerListItem event={event} />
    )
  }

  return (
    <Card className="px-4 py-6 w-full max-w-sm">
      <div className="flex justify-between">
        <h3 className="uppercase font-bold">{vts[idx].displayName}</h3>
        <h4 className="text-muted-foreground text-xs">{volunteers.length} registered of {volunteersRequired} required</h4>
      </div>
      <div className="flex flex-col gap-2">
      {
        event[volunteerTypes[idx].field].map(user => {
          return (
            <VolunteerListItem user={user} event={event} />
          )
        })
      }
      {placeholders}
      </div>
    </Card>
  )
}

interface VolunteerListItemProps {
  user?: UserData
  event: CalEvent
}

const placeHolderUser: UserData = {
  id: "placeholder",
  name: "No one yet",
  username: "placeholder",
  imageId: '',
}

function VolunteerListItem({user = placeHolderUser, event}: VolunteerListItemProps) {
  const isPlaceholder = user.id === "placeholder"
  const assignmentFetcher = useFetcher()

  let assignedHorseId = "none"
  let assignedHorseImageId = ""
  for (const assignment of event.horseAssignments) {
    if (assignment.userId === user.id) {
      assignedHorseId = assignment.horseId
    }
  }

  if (assignedHorseId != "none") {
    for (const horse of event.horses) {
      if (horse.id === assignedHorseId && (horse.imageId)) {
        assignedHorseImageId = horse.imageId 
      }
    }
  }

  const isSubmitting = assignmentFetcher.state === "submitting"

  const handleChange = (e: React.SyntheticEvent) => {
    const target = e.target as typeof e.target & {
      value: string
    }
    assignmentFetcher.submit({
      user: user.id,
      horse: target.value
    }, { method: 'post' })
  }

  return ( 
    <div className={clsx("flex justify-between items-center w-full p-1 rounded-md",
      isPlaceholder && "border border-1 border-dashed border-primary opacity-50 dark:bg-slate-800")}>
      <div className="flex items-center gap-2 w-1/3"><img 
        className="h-8 w-8 rounded-full object-cover"
        alt={user.name ?? user.username}
        src={getUserImgSrc(user.imageId)}
        />{user.name}</div>
      <ArrowRight />
      
      <div className="flex gap-2 items-center">
        { isSubmitting ? <span className="inline-block animate-spin">🌀</span> :
        <img 
          className="h-8 w-8 object-cover rounded-full"
          alt="horse"
          src={getHorseImgSrc(assignedHorseImageId)}
          />
        }
        <assignmentFetcher.Form method="post" action={`/calendar/${event.id}`} >
        <input type="hidden" value={user.id} name="user"/>
        <select className="rounded-md pl-2"
                disabled={isPlaceholder}
                name="horse"
                defaultValue={assignedHorseId}
                onChange={handleChange}>
          <option value="none">None</option>
          {event.horses.map(horse => <option key={horse.id} value={horse.id}>{horse.name}</option>)}
        </select>
        </assignmentFetcher.Form>
      </div>
    </div>
  )
}

