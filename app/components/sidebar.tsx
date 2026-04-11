import { useRef, useState } from 'react'
import { Form, Link, NavLink } from '@remix-run/react'
import { Cat, Menu, X } from 'lucide-react'
import { Icon } from '~/components/ui/icon.tsx'
import { ThemeSwitch } from '~/routes/resources+/theme/index.tsx'
import { useUser } from '~/utils/user.ts'
import { getUserImgSrc } from '~/utils/misc.ts'

export function Sidebar({
	userPreference,
}: {
	userPreference: 'light' | 'dark' | null
}) {
	const user = useUser()
	const formRef = useRef<HTMLFormElement>(null)
	const userIsAdmin = user?.roles.find(r => r.name === 'admin')
	const [mobileOpen, setMobileOpen] = useState(false)

	const navLinkClass = ({ isActive }: { isActive: boolean }) =>
		`flex items-center gap-3 rounded-md px-3 py-2 text-body-sm font-medium transition-colors ${
			isActive
				? 'bg-sidebar-active text-sidebar-active-foreground'
				: 'text-sidebar-foreground hover:bg-sidebar-border'
		}`

	const sidebarContent = (
		<>
			{/* Logo */}
			<div className="flex h-16 shrink-0 items-center justify-between border-b border-sidebar-border px-5">
				<Link to="/" className="flex items-center gap-2">
					<span className="text-h6 font-bold text-sidebar-active">The Barn</span>
				</Link>
				{/* Close button on mobile */}
				<button
					className="rounded p-1 text-muted-foreground hover:text-sidebar-foreground lg:hidden"
					onClick={() => setMobileOpen(false)}
					aria-label="Close menu"
				>
					<X className="h-5 w-5" />
				</button>
			</div>

			{/* Navigation */}
			<nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4">
				<NavLink
					to="/calendar"
					className={navLinkClass}
					onClick={() => setMobileOpen(false)}
				>
					<Icon name="calendar" className="h-4 w-4 shrink-0" />
					Calendar
				</NavLink>

				{userIsAdmin ? (
					<>
						<p className="mt-5 px-3 pb-1 text-body-2xs font-semibold uppercase tracking-wider text-muted-foreground">
							Admin
						</p>
						<NavLink
							to="/admin/users"
							className={navLinkClass}
							onClick={() => setMobileOpen(false)}
						>
							<Icon name="person" className="h-4 w-4 shrink-0" />
							Users
						</NavLink>
						<NavLink
							to="/admin/animals"
							className={navLinkClass}
							onClick={() => setMobileOpen(false)}
						>
							<Cat className="h-4 w-4 shrink-0" />
							Animals
						</NavLink>
						<NavLink
							to="/admin/email"
							className={navLinkClass}
							onClick={() => setMobileOpen(false)}
						>
							<Icon name="email" className="h-4 w-4 shrink-0" />
							Email
						</NavLink>
					</>
				) : null}
			</nav>

			{/* Footer: theme toggle + user */}
			<div className="shrink-0 border-t border-sidebar-border p-3">
				<div className="mb-2 flex items-center justify-between px-2">
					<span className="text-body-2xs text-muted-foreground">Theme</span>
					<ThemeSwitch userPreference={userPreference} />
				</div>
				<div className="flex items-center gap-3 rounded-md px-2 py-2">
					<img
						className="h-8 w-8 shrink-0 rounded-full object-cover"
						alt={user.name ?? user.username}
						src={getUserImgSrc(user.imageId)}
					/>
					<div className="flex min-w-0 flex-1 flex-col">
						<span className="truncate text-body-xs font-semibold text-sidebar-foreground">
							{user.name ?? user.username}
						</span>
						<Link
							to={`/users/${user.username}`}
							className="truncate text-body-2xs text-muted-foreground hover:underline"
						>
							View profile
						</Link>
					</div>
					<Form action="/logout" method="POST" ref={formRef}>
						<button
							type="submit"
							className="rounded p-1 text-muted-foreground hover:text-sidebar-foreground"
							aria-label="Logout"
						>
							<Icon name="exit" className="h-4 w-4" />
						</button>
					</Form>
				</div>
			</div>
		</>
	)

	return (
		<>
			{/* Mobile hamburger button */}
			<button
				className="fixed left-4 top-4 z-50 rounded-md border border-border bg-background p-2 shadow-sm lg:hidden"
				onClick={() => setMobileOpen(true)}
				aria-label="Open menu"
			>
				<Menu className="h-5 w-5" />
			</button>

			{/* Mobile overlay */}
			{mobileOpen && (
				<div
					className="fixed inset-0 z-40 bg-black/50 lg:hidden"
					onClick={() => setMobileOpen(false)}
				/>
			)}

			{/* Mobile sidebar drawer */}
			<aside
				className={`fixed inset-y-0 left-0 z-50 flex w-60 flex-col border-r border-sidebar-border bg-sidebar transition-transform duration-200 lg:hidden ${
					mobileOpen ? 'translate-x-0' : '-translate-x-full'
				}`}
			>
				{sidebarContent}
			</aside>

			{/* Desktop sidebar (always visible) */}
			<aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-sidebar-border bg-sidebar lg:flex">
				{sidebarContent}
			</aside>
		</>
	)
}
