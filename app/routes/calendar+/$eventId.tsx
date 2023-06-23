import { format } from 'date-fns'
import { useParams, useLoaderData, LoaderArgs, json } from '~/remix.ts'
import { prisma } from '~/utils/db.server.ts';

export async function loader({ params }: LoaderArgs) {
  const id = params.eventId;
  const event = await prisma.event.findUnique({
    where: {
      id,
    },
    include: {
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
    <div className="container">
      <h1 className="text-h1">{event.title}</h1>
      <p>{event.start.toLocaleDateString()}, {format(event.start, "p")} - {format(event.end, "p")}</p>
    </div>
   )
}
