import { useInputEvent } from '@conform-to/react'
import React, { useId, useRef } from 'react'
import { Input } from '~/components/ui/input.tsx'
import { Label } from '~/components/ui/label.tsx'
import { Checkbox, type CheckboxProps } from '~/components/ui/checkbox.tsx'
import { Textarea } from '~/components/ui/textarea.tsx'
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '~/components/ui/popover.tsx'
import { Button } from '~/components/ui/button.tsx'
import { Calendar } from '~/components/ui/calendar.tsx'
import { cn } from '~/utils/misc.ts'
import { format } from 'date-fns'
import { Calendar as CalendarIcon } from 'lucide-react'

export type ListOfErrors = Array<string | null | undefined> | null | undefined

export function ErrorList({
	id,
	errors,
}: {
	errors?: ListOfErrors
	id?: string
}) {
	const errorsToRender = errors?.filter(Boolean)
	if (!errorsToRender?.length) return null
	return (
		<ul id={id} className="space-y-1">
			{errorsToRender.map(e => (
				<li key={e} className="text-[10px] text-foreground-danger">
					{e}
				</li>
			))}
		</ul>
	)
}

export function Field({
	labelProps,
	inputProps,
	errors,
	className,
}: {
	labelProps: Omit<React.LabelHTMLAttributes<HTMLLabelElement>, 'className'>
	inputProps: Omit<React.InputHTMLAttributes<HTMLInputElement>, 'className'>
	errors?: ListOfErrors
	className?: string
}) {
	const fallbackId = useId()
	const id = inputProps.id ?? fallbackId
	const errorId = errors?.length ? `${id}-error` : undefined
	return (
		<div className={className}>
			<Label htmlFor={id} {...labelProps} />
			<Input
				id={id}
				aria-invalid={errorId ? true : undefined}
				aria-describedby={errorId}
				{...inputProps}
			/>
			<div className="min-h-[32px] px-4 pb-3 pt-1">
				{errorId ? <ErrorList id={errorId} errors={errors} /> : null}
			</div>
		</div>
	)
}

export function DatePickerField({
	labelProps,
	errors,
	className,
}: {
	labelProps: Omit<React.LabelHTMLAttributes<HTMLLabelElement>, 'className'>
	errors?: ListOfErrors
	className?: string
}) {
	const fallbackId = useId()
	const id = fallbackId
	const errorId = errors?.length ? `${id}-error` : undefined
	const [dates, setDates] = React.useState<Date[] | undefined>()

	return (
		<div className={className}>
			<Label htmlFor={id} {...labelProps} />
			<Popover>
				<PopoverTrigger asChild>
					<Button
						variant={'outline'}
						className={cn(
							'w-full justify-start text-left font-normal',
							!dates && 'text-muted-foreground',
						)}
					>
						<CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
						<span className="overflow-hidden text-ellipsis whitespace-nowrap">
							{dates
								? dates.map(date => format(date, 'P')).join(', ')
								: 'Pick dates'}
						</span>
					</Button>
				</PopoverTrigger>
				<PopoverContent className="w-auto p-0">
					<Calendar
						mode="multiple"
						selected={dates}
						onSelect={setDates}
						initialFocus
					/>
				</PopoverContent>
			</Popover>
			<input
				type="hidden"
				name="dates"
				value={dates?.map(date => format(date, 'yyyy-MM-dd')).join(', ') ?? ''}
			/>
			<div className="min-h-[32px] px-4 pb-3 pt-1">
				{errorId ? <ErrorList id={errorId} errors={errors} /> : null}
			</div>
		</div>
	)
}

export function TextareaField({
	labelProps,
	textareaProps,
	errors,
	className,
}: {
	labelProps: React.LabelHTMLAttributes<HTMLLabelElement>
	textareaProps: React.InputHTMLAttributes<HTMLTextAreaElement>
	errors?: ListOfErrors
	className?: string
}) {
	const fallbackId = useId()
	const id = textareaProps.id ?? textareaProps.name ?? fallbackId
	const errorId = errors?.length ? `${id}-error` : undefined
	return (
		<div className={className}>
			<Label htmlFor={id} {...labelProps} />
			<Textarea
				id={id}
				aria-invalid={errorId ? true : undefined}
				aria-describedby={errorId}
				{...textareaProps}
			/>
			<div className="px-4 pb-3 pt-1">
				{errorId ? <ErrorList id={errorId} errors={errors} /> : null}
			</div>
		</div>
	)
}

export function CheckboxField({
	labelProps,
	buttonProps,
	errors,
	className,
}: {
	labelProps: JSX.IntrinsicElements['label']
	buttonProps: CheckboxProps
	errors?: ListOfErrors
	className?: string
}) {
	const fallbackId = useId()
	const buttonRef = useRef<HTMLButtonElement>(null)
	// To emulate native events that Conform listen to:
	// See https://conform.guide/integrations
	const control = useInputEvent({
		// Retrieve the checkbox element by name instead as Radix does not expose the internal checkbox element
		// See https://github.com/radix-ui/primitives/discussions/874
		ref: () =>
			buttonRef.current?.form?.elements.namedItem(buttonProps.name ?? ''),
		onFocus: () => buttonRef.current?.focus(),
	})
	const id = buttonProps.id ?? buttonProps.name ?? fallbackId
	const errorId = errors?.length ? `${id}-error` : undefined
	return (
		<div className={className}>
			<div className="flex gap-2">
				<Checkbox
					id={id}
					ref={buttonRef}
					aria-invalid={errorId ? true : undefined}
					aria-describedby={errorId}
					{...buttonProps}
					onCheckedChange={state => {
						control.change(Boolean(state.valueOf()))
						buttonProps.onCheckedChange?.(state)
					}}
					onFocus={event => {
						control.focus()
						buttonProps.onFocus?.(event)
					}}
					onBlur={event => {
						control.blur()
						buttonProps.onBlur?.(event)
					}}
					type="button"
				/>
				<label
					htmlFor={id}
					{...labelProps}
					className="self-center text-body-xs text-primary"
				/>
			</div>
			<div className="px-4 pb-3 pt-1">
				{errorId ? <ErrorList id={errorId} errors={errors} /> : null}
			</div>
		</div>
	)
}
