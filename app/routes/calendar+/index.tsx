import { Link, Form, json , useLoaderData , useActionData } from '~/remix.ts';
import type { ActionArgs , LoaderArgs } from '~/remix.ts'
import { Calendar, dateFnsLocalizer } from 'react-big-calendar'
import format from 'date-fns/format/index.js'
import parse from 'date-fns/parse/index.js'
import startOfWeek from 'date-fns/startOfWeek/index.js'
import getDay from 'date-fns/getDay/index.js'
import enUS from 'date-fns/locale/en-US/index.js'
import "react-big-calendar/lib/css/react-big-calendar.css";
import { Icon } from '~/components/ui/icon.tsx';

import { volunteerTypes, type UserData, type HorseData, type CalEvent } from '~/data.ts'
import { useState } from 'react'

import { prisma } from "~/utils/db.server.ts";
import { requireUserId } from '~/utils/auth.server.ts'
import { useUser } from '~/utils/user.ts'
import { Button } from '~/components/ui/button.tsx'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "~/components/ui/dialog.tsx"
import { Input } from '~/components/ui/input.tsx'
import { RadioGroup, RadioGroupItem } from '~/components/ui/radio-group.tsx'
import { Label } from '~/components/ui/label.tsx'

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip.tsx"

import { parse as formParse } from '@conform-to/zod'
import { z } from 'zod'

import { HorseListbox, InstructorListbox } from '~/components/listboxes.tsx'
import { addMinutes } from 'date-fns'
import { useFetcher } from '@remix-run/react'
import { useResetCallback } from '~/utils/misc.ts'
import { useToast } from '~/components/ui/use-toast.ts'
import { requireAdmin } from '~/utils/permissions.server.ts'
import { Info } from 'lucide-react'
import { Checkbox } from '~/components/ui/checkbox.tsx';

const locales = {
  'en-US': enUS,
}

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
})

export const loader = async ({ request }: LoaderArgs) => {
  await requireUserId(request)
  const instructors = await prisma.user.findMany({ 
    where: { instructor: true, }
  })
  return json({
   events: await prisma.event.findMany({ include:
   { 
     horses: true, 
     instructors: true,  
     cleaningCrew: true,  
     lessonAssistants: true,  
     sideWalkers: true,  
     horseLeaders: true,  
   } 
   }),
   horses: await prisma.horse.findMany(),
   instructors,
  });
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

const createEventSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  day: z.coerce.date(),
  duration: z.coerce.number().gt(0),
  horses: z.array(horseSchema),
  instructor: instructorSchema,
  cleaningCrewReq: z.coerce.number().gt(-1),
  lessonAssistantsReq: z.coerce.number().gt(-1),
  sideWalkersReq: z.coerce.number().gt(-1),
  horseLeadersReq: z.coerce.number().gt(-1),
});

export async function action({ request }: ActionArgs) {
  await requireAdmin(request)
  const body = await request.formData();
  const submission = formParse(body, { schema: () => {return createEventSchema} })
  if (!submission.value) {
    return json(
    {
      status: 'error',
      submission,
    } as const,
    { status: 400},
    ) 
  }

  const title = submission.value.title
  const start = submission.value.day
  const end = addMinutes(start, submission.value.duration)

  const instructorId = submission.value.instructor.id
  const horseIds = submission.value.horses.map(e => { return {id: e.id} })

  const cleaningCrewReq = submission.value.cleaningCrewReq
  const lessonAssistantsReq = submission.value.lessonAssistantsReq
  const sideWalkersReq = submission.value.sideWalkersReq
  const horseLeadersReq = submission.value.horseLeadersReq

  await prisma.event.create({
    data: {
      title,
      start,
      end,
      instructors: {
        connect: { id: instructorId }
      },
      horses: {
        connect: horseIds
      },
      cleaningCrewReq,
      lessonAssistantsReq,
      sideWalkersReq,
      horseLeadersReq,
    }
  })

  return json(
  {
    status: 'ok',
    submission,
  },
  { status: 200},
  )
}

export default function Schedule() {
  const data = useLoaderData<typeof loader>()
  const events = data.events
  const horses = data.horses
  const instructors = data.instructors
  const user = useUser()
  const userIsAdmin = user.roles.find(role => role.name === 'admin')
  const [registerOpen, setRegisterOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(events[0]);

  const [filterFlag, setFilterFlag] = useState(false)

  const eventsThatNeedHelp = events.filter((event: typeof events[number]) => {
    return event.cleaningCrewReq > event.cleaningCrew.length || 
           event.lessonAssistantsReq > event.lessonAssistants.length ||
           event.horseLeadersReq > event.horseLeaders.length || 
           event.sideWalkersReq > event.sideWalkers.length;
  })

  const handleSelectEvent = (calEvent: typeof events[number]) => {
    setSelectedEvent(calEvent)
    setRegisterOpen(!registerOpen)
  }


  return (
  <div className="grid place-items-center">
    <h1 className="text-5xl mb-5">Calendar</h1>
      <div className="flex gap-2">
        <Checkbox 
          checked={filterFlag}
          onCheckedChange={ () => setFilterFlag(!filterFlag) }
          id="filter"
        />
        <Label htmlFor="filter">
          Show only events that need more volunteers
        </Label>
      </div>
    <div className="container sm:h-[80vh] sm:w-[80vw] h-screen w-screen">
    <Calendar
      localizer={localizer}
      events={filterFlag ? eventsThatNeedHelp : events}
      startAccessor="start"
      endAccessor="end"
      onSelectEvent={handleSelectEvent}
      style={{ height: '100%', width: '100%', backgroundColor: "white", color: "black", padding: 20, borderRadius: "1.5rem"  }}
    />
    </div>

    <Dialog open={registerOpen} onOpenChange={setRegisterOpen}>
      <RegistrationDialogue selectedEventId={selectedEvent?.id} events={events} />      
    </Dialog>

    { userIsAdmin ? <CreateEventDialog horses={horses} instructors={instructors} />
    : null }
  </div>
  )
}

interface RegistrationProps {
  events: CalEvent[]
  selectedEventId: string
}

function RegistrationDialogue({selectedEventId, events}: RegistrationProps) {
  const registrationFetcher = useFetcher();
  const user = useUser();
  const userIsAdmin = user.roles.find(role => role.name === 'admin')

  const isSubmitting = registrationFetcher.state === "submitting"

  const calEvent = events.find(event => event.id === selectedEventId)
    if (!calEvent) {
      return null
    }

  let isRegistered = false;
  let volunteerTypeIdx = 0;
  for (const role of volunteerTypes) {
    const found = calEvent[role.field].find(volunteer => volunteer.id === user.id)
    if (found) {
      isRegistered = true;
      break;
    }
    volunteerTypeIdx += 1;
  }
  if (!isRegistered) {
    volunteerTypeIdx = 0;
  }
  const registeredAs = volunteerTypes[volunteerTypeIdx]

  const helpNeeded = calEvent.cleaningCrewReq > calEvent.cleaningCrew.length || 
             calEvent.lessonAssistantsReq > calEvent.lessonAssistants.length ||
             calEvent.horseLeadersReq > calEvent.horseLeaders.length || 
             calEvent.sideWalkersReq > calEvent.sideWalkers.length;
  return (
  <DialogContent>
      <DialogHeader>
        <DialogTitle className="text-h4">{calEvent.title} - Volunteer Registration</DialogTitle>
        <div className="flex items-center justify-between">
        <p>{calEvent.start.toLocaleDateString()}, {format(calEvent.start, "p")} - {format(calEvent.end, "p")}</p>
        {userIsAdmin ? <Button asChild size="sm"><Link to={`/calendar/${calEvent.id}`}>Manage Event</Link></Button> : null}
        </div>
      </DialogHeader>
          <DialogDescription>
            {isRegistered ? "Manage registration" : "Select a role to volunteer in"}
          </DialogDescription>
        <registrationFetcher.Form method="post" action="/resources/event-register">
          <Input type="hidden" name="eventId" value={calEvent.id}></Input>
        <RadioGroup name="role" defaultValue={volunteerTypes[volunteerTypeIdx].field} disabled={isRegistered}>
        <ul className="">

        {volunteerTypes.map((volunteerType) => {
        const isFull = (calEvent[volunteerType.reqField] <= calEvent[volunteerType.field].length)

          return (
            <li key ={volunteerType.field} className="flex flex-col items-left m-2">
                <div className="flex w-[80%] justify-between">
                  <div className="flex items-center">
                  <RadioGroupItem disabled={isFull} className="mr-2 aria-disabled:bg-muted" id={volunteerType.field} value={volunteerType.field}/>
                    <Label htmlFor={volunteerType.field} className={isFull ? "text-muted-foreground" : ""}>
                      <span className="capitalize">{volunteerType.displayName}:</span> {calEvent[volunteerType.field].length} registered of {calEvent[`${volunteerType.field}Req`]} needed.
                    </Label>
                  </div>
              <TooltipProvider>
              <Tooltip>
              <TooltipTrigger asChild>
                  <Info size="20" className="mr-1"/>
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-[250px]">{volunteerType.description}</p>
              </TooltipContent>
                </Tooltip>
              </TooltipProvider>
                </div>
                {isFull ? <div className="text-destructive/80 ml-7">This position is full</div> : null}
            </li>
            )
            }
          )}
            </ul>
          </ RadioGroup>
        {!isRegistered ? null
          : <>
          <div>
          <input type="hidden" name="role" value={registeredAs.field}/>
            You are registered to volunteer in this event as one of the {registeredAs.displayName}.
          </div>
          </>}
        <DialogFooter> 
          {isSubmitting ? <div>Processing...</div> :
           isRegistered ? 
            <Button type="submit" name="_action" value="unregister" variant="destructive"> Unregister</Button>
            : <Button className="" type="submit" name="_action" value="register" disabled={!helpNeeded}>Register</Button>}
        <DialogClose />
        </DialogFooter>
        </registrationFetcher.Form>
      </DialogContent>
    )
}

interface CreateEventDialogProps {
  horses: HorseData[]
  instructors: UserData[]
}

function CreateEventDialog({horses, instructors}: CreateEventDialogProps) {
    const [open, setOpen] = useState(false);

    return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="mt-5">
          <Icon className="text-body-md" name="plus">
          Create New Event
          </Icon>
        </Button>
      </DialogTrigger>
      <DialogContent className="">
        <DialogHeader>
          <DialogTitle>Create Event</DialogTitle>
          <DialogDescription>
                Submit this form to create a new event. Volunteers will be able to see it on the calendar and be able to register to help.
          </DialogDescription>
        </DialogHeader>
        <CreateEventForm horses={horses} instructors={instructors} doneCallback={() => setOpen(false)} />

      </DialogContent>
    </Dialog> 
    )
}

interface EventFormProps extends CreateEventDialogProps {
  doneCallback?: Function
}

function CreateEventForm({ horses, instructors, doneCallback }: EventFormProps) {
    const actionData = useActionData<typeof action>() 
    const { toast } = useToast();

    useResetCallback(actionData, () => {
        if (!actionData) {
          return
        }
        if (actionData.status == "ok") {
          toast({
            title: "Success",
            description: `Created event "${actionData.submission?.value?.title}".`
          })
          if (doneCallback) {
            doneCallback()
          }
        } else {
          toast({
            variant: "destructive",
            title: "Error creating event",
            description: "Failed to create event. There was an unexpected error."
          })
        }
    })

    return ( <Form method="post" className="mx-auto grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Label htmlFor='title'>Event Title</Label>
            <Input type="text" name="title" required/>
          </div>

          <div>
          <Label htmlFor='day' className="mx-auto">When will the event start?</Label>
            <Input type="datetime-local" name="day" required />
          </div>
          <div>
          <Label htmlFor='duration' className="mx-auto">How long will it run for?</Label>
          <RadioGroup required name="duration" className="flex flex-col space-y-1" defaultValue="30">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="30" id="30" />
              <Label htmlFor="30">30 Minutes</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="60" id="60" />
              <Label htmlFor="60">60 Minutes</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="90" id="90" />
              <Label htmlFor="90">90 Minutes</Label>
            </div>
          </RadioGroup>
          </div>

          <div>
          <Label htmlFor='horses'>Horses</Label>
          <HorseListbox horses={horses} name="horses"/>
          </div>

          <div>
          <Label htmlFor='instructor'>Instructor</Label>
          <InstructorListbox instructors={instructors} name="instructor"/>
          </div>

          <div>
          <Label htmlFor='cleaningCrewReq' className="mx-auto"># Cleaning crew needed</Label>
          <Input type="number" name="cleaningCrewReq" defaultValue={0} inputMode="numeric" required min="0"/>
          </div>

          <div>
          <Label htmlFor='lessonAssistantsReq' className="mx-auto"># Lesson Assistants needed</Label>
          <Input type="number" name="lessonAssistantsReq" defaultValue={0} inputMode="numeric" required min="0"/>
          </div>

          <div>
          <Label htmlFor='sideWalkersReq' className="mx-auto"># Sidewalkers needed</Label>
          <Input type="number" name="sideWalkersReq" defaultValue={0} inputMode="numeric" required min="0"/>
          </div>

          <div>
          <Label htmlFor='horseLeadersReq' className="mx-auto"># Horse Leaders needed</Label>
          <Input type="number" name="horseLeadersReq" defaultValue={0} inputMode="numeric" required min="0"/>
          </div>

          <Button className="relative top-6 max-w-[125px] mx-auto" type="submit">Save</Button>
        </Form> )
}
