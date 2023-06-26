import { format } from 'date-fns'
import { Card } from '~/components/ui/card.tsx';
import { useLoaderData, json } from '~/remix.ts'
import type { LoaderArgs } from '~/remix.ts'
import { prisma } from '~/utils/db.server.ts';
import { Button } from '~/utils/forms.tsx';
import { getUserImgSrc } from '~/utils/misc.ts';

import type { UserData, CalEvent } from '~/data.ts'
import { volunteerTypes } from '~/data.ts';
import { ArrowRight, Check } from 'lucide-react';
import { clsx } from 'clsx';

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
    }
  })
  if (!event) {
    throw new Response('not found', { status: 404 })
  }
  return json({ event })
}

export default function() {
   const data = useLoaderData<typeof loader>()
   const event = data.event

   return (
    <div className="container flex flex-wrap w-full">
      <section className="md:sticky md:top-20 h-fit md:w-2/5 pr-2">
        <h1 className="text-h2 uppercase">Event Details</h1>
        <Card className="px-4 py-6 max-w-sm min-w-sm">
        <h1 className="">Title: {event.title}</h1>
        <div>{format(event.start, "MMMM do, y")}</div>
        <div>{format(event.start, "p")} - {format(event.end, "p")}</div>
        <div>Horses: {event.horses.map(horse => { return horse.name + ', ' })}</div>
        <div>Instructor: {event.instructors.map(instructor => { return instructor.name ? instructor.name : instructor.username })}</div>
          <Button className="" variant="primary" size="sm">Edit</Button>
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
    <Card className="px-4 py-6 max-w-sm w-full">
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
        <img 
          className="h-8 w-8 object-cover"
          alt="horse"
          src="/img/horse.png"
          />
        <select className="rounded-md pl-2" disabled={isPlaceholder}>
          <option>None</option>
          {event.horses.map(horse => <option key={horse.id}>{horse.name}</option>)}
        </select>
        <Check className="text-emerald-500 justify-self-end"/>
      </div>
    </div>
  )
}

