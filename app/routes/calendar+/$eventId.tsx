import { differenceInYears, format } from 'date-fns'
import { Card } from '~/components/ui/card.tsx';
import { useLoaderData, json, Link } from '~/remix.ts'
import type { ActionArgs, DataFunctionArgs } from '~/remix.ts'
import { prisma } from '~/utils/db.server.ts';
import { Button } from '~/components/ui/button.tsx'
import { getUserImgSrc, getHorseImgSrc } from '~/utils/misc.ts';

import type { UserData, HorseData, CalEvent } from '~/data.ts'
import { volunteerTypes } from '~/data.ts';
import { clsx } from 'clsx';
import { useFetcher } from '@remix-run/react';
import { z } from 'zod'
import { parse } from '@conform-to/zod';
import { requireAdmin } from '~/utils/permissions.server.ts';
import invariant from 'tiny-invariant';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover.tsx"
import {
  Icon
} from "~/components/ui/icon.tsx"

export async function loader({ request, params }: DataFunctionArgs) {
  await requireAdmin(request)
  const id = params.eventId;
  const event = await prisma.event.findUnique({
    where: {
      id,
    },
    include: {
      instructors: true,
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
  await requireAdmin(request)
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
            <Button className="" variant="default" size="sm">Edit</Button>
          </div>
          <div className="flex gap-x-4 flex-wrap">
            <div className="text-lg">{format(event.start, "MMMM do, y")}</div>
            <div className="text-lg"> {format(event.start, "p")} - {format(event.end, "p")}</div>
          </div>
          <div className="mt-4">
            Instructor{event.instructors.length > 1 ? "s" : null}: {event.instructors.map(instructor => {
            return (
            <VolunteerInfoPopover key={instructor.id} volunteer={instructor} >
            <div className="flex items-center gap-2">
              <img 
              className="h-14 w-14 rounded-full object-cover"
              alt={instructor.name ?? instructor.username}
              src={getUserImgSrc(instructor.imageId)}
              />
              <div>{instructor.name ? instructor.name : instructor.username}</div>
            </div>
            </VolunteerInfoPopover>
            )
            })}
          </div>
          <div className="font-bold uppercase mt-4">Horses:</div>
          <div className="flex gap-4 flex-wrap">
            {event.horses.map(horse => {
            return <HorseInfoPopover key={horse.id} horse={horse}>
            <div className="flex flex-col items-center gap-2">
              <img 
              className="h-14 w-14 rounded-full object-cover"
              alt={horse.name}
              src={getHorseImgSrc(horse.imageId)}
              />
              <div>{horse.name}</div>
            </div>
              </HorseInfoPopover>
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
            <VolunteerListItem key={user.id} user={user} event={event} />
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
  height: null,
  birthdate: null,
  yearsOfExperience: null,
  notes: null,
}

function VolunteerListItem({user = placeHolderUser, event}: VolunteerListItemProps) {
  const isPlaceholder = user.id === "placeholder"
  const assignmentFetcher = useFetcher()

  let assignedHorseId = "none"
  let assignedHorseImageId = ""
  let assignedHorse = null
  for (const assignment of event.horseAssignments) {
    if (assignment.userId === user.id) {
      assignedHorseId = assignment.horseId
    }
  }

  if (assignedHorseId != "none") {
    for (const horse of event.horses) {
      if (horse.id === assignedHorseId && (horse.imageId)) {
        assignedHorseImageId = horse.imageId 
        assignedHorse = horse
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
      <VolunteerInfoPopover volunteer={user}>
      <div className="flex items-center gap-2 w-1/3"><img 
        className="h-14 w-14 rounded-full object-cover"
        alt={user.name ?? user.username}
        src={getUserImgSrc(user.imageId)}
        />{user.name}</div>
      </VolunteerInfoPopover>
      <Icon className="text-body-xl" name="arrow-right" />
      
      <div className="flex gap-2 items-center">
        { isSubmitting ? <span className="inline-block animate-spin">🌀</span> :
        assignedHorse ?
        <HorseInfoPopover horse={assignedHorse}>
        <img 
          className="h-14 w-14 object-cover rounded-full"
          alt="horse"
          src={getHorseImgSrc(assignedHorseImageId)}
          />
         </HorseInfoPopover>
         : 
        <img 
          className="h-14 w-14 object-cover rounded-full"
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

interface HorseInfoPopoverProps {
  children: React.ReactNode
  horse: HorseData
}


function HorseInfoPopover({ children, horse }: HorseInfoPopoverProps) {
  return (
    <Popover>
      <PopoverTrigger asChild className="cursor-pointer">
        {children}
      </PopoverTrigger>
        <PopoverContent side="bottom">
        <div className="text-xl">{horse.name}</div>
        <img 
          className="h-52 w-52 object-cover rounded-full"
          alt="horse"
          src={getHorseImgSrc(horse.imageId)}
        />
       <div><span className="text-xs uppercase font-bold">Status: </span>{horse.status}</div>
       <div><span className="text-xs uppercase font-bold">Notes: </span>{horse.notes}</div>
        </PopoverContent>
    </Popover>
  )
}

interface VolunteerInfoPopoverProps {
  children: React.ReactNode
  volunteer: UserData
}

function VolunteerInfoPopover({ children, volunteer }: VolunteerInfoPopoverProps) {
    return (<Popover>
      <PopoverTrigger asChild className="cursor-pointer">
        {children}
      </PopoverTrigger>
        <PopoverContent side="bottom">
        <div className="flex justify-between">
        <div className="text-xl">{volunteer.name ?? volunteer.username}</div>
        <Link className="hover:underline" to={`/users/${volunteer.username}`} >Profile</Link>
        </div>
        <img 
          className="h-52 w-52 object-cover rounded-full"
          alt="horse"
          src={getHorseImgSrc(volunteer.imageId)}
        />
       <div><span className="text-xs uppercase font-bold">Age: </span>{volunteer.birthdate ? differenceInYears(new Date(), volunteer.birthdate) : null}</div>
       <div><span className="text-xs uppercase font-bold">Height (in): </span>{volunteer.height}</div>
       <div><span className="text-xs uppercase font-bold">Years of Experience: </span>{volunteer.yearsOfExperience}</div>
       <div><span className="text-xs uppercase font-bold">Notes: </span>{volunteer.notes}</div>
        </PopoverContent>
    </Popover>)
}
