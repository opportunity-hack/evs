import { Fragment, useState } from 'react'
import { Listbox, Transition } from '@headlessui/react'
import { Icon } from '~/components/ui/icon.tsx'

const listboxButtonClassName =
	'flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'

const listBoxOptionsClassname =
	'z-50 absolute mt-1 max-h-60 w-full overflow-auto rounded-md py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm border-input border border-1'

interface HorseData {
	id: string
	name: string
}

interface HorseListboxProps {
	horses: HorseData[]
	name: string
	defaultValues?: HorseData[]
}

export function HorseListbox({
	horses,
	name,
	defaultValues = [],
}: HorseListboxProps) {
	const initialValues = horses.filter(horse => {
		for (const value of defaultValues) {
			if (value.id == horse.id) {
				return true
			}
		}
		return false
	})
	const [selected, setSelected] = useState(initialValues)

	console.log('initial values: ', JSON.stringify(initialValues))
	console.log('default values: ', JSON.stringify(defaultValues))
	console.log('all horses: ', JSON.stringify(horses))

	return (
		<Listbox value={selected} onChange={setSelected} name={name} multiple>
			<div className="relative mt-1">
				<div className={''}>
					<Listbox.Button className={listboxButtonClassName}>
						<span className="block truncate">
							{selected.map(horse => horse.name).join(', ')}
						</span>
						<span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
							<Icon className="text-body-md" name="caret-sort" />
						</span>
					</Listbox.Button>
				</div>
				<Transition
					as={Fragment}
					leave="transition ease-in duration-100"
					leaveFrom="opacity-100"
					leaveTo="opacity-0"
				>
					<Listbox.Options className={listBoxOptionsClassname}>
						{horses.map((horse, horseIdx) => (
							<Listbox.Option
								key={horseIdx}
								className={({ active }) =>
									`relative cursor-default select-none py-2 pl-10 pr-4
									${active ? 'bg-teal-600 text-white' : 'bg-background text-primary'}`
								}
								value={horse}
							>
								{({ selected, active }) => (
									<>
										<span
											className={`block truncate 
											${selected ? 'font-medium' : 'font-normal'}`}
										>
											{horse.name}
										</span>
										{selected ? (
											<span
												className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
													active ? 'text-white' : 'text-teal-600'
												}`}
											>
												<Icon className="text-body-md" name="check" />
											</span>
										) : null}
									</>
								)}
							</Listbox.Option>
						))}
					</Listbox.Options>
				</Transition>
			</div>
		</Listbox>
	)
}

interface UserData {
	id: string
	name: string | null
	username: string
}

interface InstructorListboxProps {
	instructors: UserData[]
	name: string
	defaultValue?: UserData
}

export function InstructorListbox({
	instructors,
	name,
	defaultValue = instructors[0],
}: InstructorListboxProps) {
	const [selected, setSelected] = useState(defaultValue)

	return (
		<Listbox value={selected} onChange={setSelected} name={name}>
			<div className="relative mt-1">
				<Listbox.Button className={listboxButtonClassName}>
					<span className="block truncate">{selected?.name}</span>
					<span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
						<Icon className="text-body-md" name="caret-sort" />
					</span>
				</Listbox.Button>
				<Transition
					as={Fragment}
					leave="transition ease-in duration-100"
					leaveFrom="opacity-100"
					leaveTo="opacity-0"
				>
					<Listbox.Options className={listBoxOptionsClassname}>
						{instructors.map((person, personIdx) => (
							<Listbox.Option
								key={personIdx}
								className={({ active }) =>
									`relative cursor-default select-none py-2 pl-10 pr-4 ${
										active
											? 'bg-teal-600 text-white'
											: 'bg-background text-primary'
									}`
								}
								value={person}
							>
								{({ selected, active }) => (
									<>
										<span
											className={`block truncate ${
												selected ? 'font-medium' : 'font-normal'
											}`}
										>
											{person.name}
										</span>
										{selected ? (
											<span
												className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
													active ? 'text-white' : 'text-teal-600'
												}`}
											>
												<Icon className="text-body-md" name="check" />
											</span>
										) : null}
									</>
								)}
							</Listbox.Option>
						))}
					</Listbox.Options>
				</Transition>
			</div>
		</Listbox>
	)
}
