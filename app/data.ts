export const siteEmailAddress = "hello@email.trottrack.org"
export const siteName = "The Barn: Volunteer Portal"

export const volunteerTypes = [
  {
    displayName: "cleaning crew",
    field: "cleaningCrew",
    reqField: "cleaningCrewReq",
    description: "Cleaning crew volunteers help clean all pastures and stalls in the barn, check automatic waterers, sweep the feed room and tack room, and handle other miscellaneous cleaning jobs. No prior experience with horses is required."
  },
  {
    displayName: "lesson assistants",
    field: "lessonAssistants",
    reqField: "lessonAssistantsReq",
    description: "Lesson assistants should have 1+ years of experience with horses. They must be able to groom and tack horses, and to communicate effectively with both students and instructors."
  },
  {
    displayName: "horse leaders",
    field: "horseLeaders",
    reqField: "horseLeadersReq",
    description: "Leads horses during lessons. Should have 1+ years of experiences with horses, and must be able to walk on uneven surfaces."
  },
  {
    displayName: "side walkers",
    field: "sideWalkers",
    reqField: "sideWalkersReq",
    description: "Side walkers walk alongside students helping to support them during lessons.No prior experience with horses needed. Must be able to walk on uneven surfaces."
  },
] as const

export interface UserData {
  id: string
  name: string | null
  username: string
  imageId: string | null

  notes: string | null
  birthdate: Date | null
  height: number | null
  yearsOfExperience: number | null
}

export interface HorseData {
  id: string
  name: string
  imageId: string | null
  status: string | null
  notes: string | null
}

export interface HorseAssignment {
  userId: string
  horseId: string
}

export interface CalEvent {
  id: string
  title: string
  start: Date
  end: Date

  instructors: UserData[]
  horses: HorseData[]

  cleaningCrewReq: number
  lessonAssistantsReq: number
  horseLeadersReq: number
  sideWalkersReq: number

  cleaningCrew: UserData[]
  lessonAssistants: UserData[]
  horseLeaders: UserData[]
  sideWalkers: UserData[]

  horseAssignments: HorseAssignment[]
}

