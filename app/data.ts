// TODO: get accurate descriptions of each role
export const volunteerTypes = [
  {
    displayName: "barn crew",
    field: "barnCrew",
    reqField: "barnCrewReq",
    description: "Barn Crew volunteers help with the daily care of the horses. This includes feeding, watering, and cleaning stalls. Barn Crew volunteers must be at least 16 years old."
  },
  {
    displayName: "pasture crew",
    field: "pastureCrew",
    reqField: "pastureCrewReq",
    description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."
  },
  {
    displayName: "lesson assistants",
    field: "lessonAssistants",
    reqField: "lessonAssistantsReq",
    description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."
  },
  {
    displayName: "horse leaders",
    field: "horseLeaders",
    reqField: "horseLeadersReq",
    description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."
  },
  {
    displayName: "side walkers",
    field: "sideWalkers",
    reqField: "sideWalkersReq",
    description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."
  },
] as const

export interface UserData {
  id: string
  name: string | null
  username: string
  imageId: string | null
}

export interface HorseData {
  id: string
  name: string
}

export interface CalEvent {
  id: string
  title: string
  start: Date
  end: Date

  instructors: UserData[]
  horses: HorseData[]

  barnCrewReq: number
  pastureCrewReq: number
  lessonAssistantsReq: number
  horseLeadersReq: number
  sideWalkersReq: number

  barnCrew: UserData[]
  pastureCrew: UserData[]
  lessonAssistants: UserData[]
  horseLeaders: UserData[]
  sideWalkers: UserData[]
}

