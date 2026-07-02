import { useAuthActions } from "@convex-dev/auth/react"
import { useConvexQuery } from "@convex-dev/react-query"
import { Link, useNavigate, useRouterState } from "@tanstack/react-router"
import {
	Anchor,
	BarChart2,
	Bell,
	Calendar,
	CheckSquare2,
	ChevronRight,
	CloudLightning,
	FileText,
	Home,
	Image,
	Leaf,
	LayoutGrid,
	LogOut,
	Package,
	Settings,
	Users,
	Wrench,
	X,
} from "lucide-react"
import { useState, type ReactNode } from "react"
import { api } from "../../../convex/_generated/api"
import { OfflineBanner } from "#/components/layout/OfflineBanner"
import { useCurrentMember } from "#/lib/auth/useCurrentMember"

interface NavItem {
	to: string
	label: string
	icon: ReactNode
}

const primaryNav: NavItem[] = [
	{ to: "/", label: "Home", icon: <Home size={20} /> },
	{ to: "/calendar", label: "Calendar", icon: <Calendar size={20} /> },
	{ to: "/tasks", label: "Tasks", icon: <CheckSquare2 size={20} /> },
]

const secondaryNav: NavItem[] = [
	{ to: "/maintenance", label: "Maintenance", icon: <Wrench size={16} /> },
	{ to: "/expenses", label: "Expenses", icon: <span className="text-sm font-bold">$</span> },
	{ to: "/inventory", label: "Inventory", icon: <Package size={16} /> },
	{ to: "/gallery", label: "Gallery", icon: <Image size={16} /> },
	{ to: "/assets", label: "Assets", icon: <Anchor size={16} /> },
	{ to: "/analytics", label: "Analytics", icon: <BarChart2 size={16} /> },
	{ to: "/weather", label: "Weather", icon: <CloudLightning size={16} /> },
	{ to: "/seasonal", label: "Seasonal", icon: <Leaf size={16} /> },
	{ to: "/documents", label: "Documents", icon: <FileText size={16} /> },
	{ to: "/contacts", label: "Contacts", icon: <Users size={16} /> },
	{ to: "/announcements", label: "Announcements", icon: <Bell size={16} /> },
	{ to: "/settings", label: "Settings", icon: <Settings size={16} /> },
]

export function AppShell({ children }: { children: ReactNode }) {
	const [moreOpen, setMoreOpen] = useState(false)
	const location = useRouterState({ select: (s) => s.location.pathname })
	const { signOut } = useAuthActions()
	const navigate = useNavigate()
	const { property } = useCurrentMember()

	const unreadNotifications = useConvexQuery(
		api.pushNotifications.listUnread,
		property ? { propertyId: property._id } : "skip",
	)
	const unreadCount = unreadNotifications?.length ?? 0

	async function handleSignOut() {
		await signOut()
		navigate({ to: "/login" })
	}

	function isActive(to: string) {
		if (to === "/") return location === "/"
		return location.startsWith(to)
	}

	return (
		<div className="flex min-h-dvh flex-col md:flex-row">
			{/* ── Desktop sidebar ───────────────────────────────────────── */}
			<aside
				className="hidden md:flex md:w-56 md:flex-col md:shrink-0 md:fixed md:inset-y-0 md:left-0"
				style={{
					background: "var(--header-bg)",
					borderRight: "1px solid var(--line)",
					backdropFilter: "blur(12px)",
				}}
			>
				{/* Logo */}
				<div className="px-5 pt-6 pb-4">
					<span
						className="display-title text-xl font-bold leading-none"
						style={{ color: "var(--palm)" }}
					>
						Lake House
					</span>
					<span
						className="block text-[0.65rem] tracking-widest uppercase mt-0.5 font-semibold"
						style={{ color: "var(--sea-ink-soft)" }}
					>
						Manager
					</span>
				</div>

				{/* Primary nav */}
				<nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
					{primaryNav.map((item) => (
						<SidebarLink
							key={item.to}
							{...item}
							active={isActive(item.to)}
						/>
					))}

					<div
						className="my-3 mx-2 h-px"
						style={{ background: "var(--line)" }}
					/>

					{secondaryNav.map((item) => (
						<SidebarLink
							key={item.to}
							{...item}
							active={isActive(item.to)}
						/>
					))}
				</nav>

				{/* User section */}
				<div
					className="px-3 py-4 border-t"
					style={{ borderColor: "var(--line)" }}
				>
					<Link
						to="/settings/profile"
						className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors hover:bg-white/40"
						style={{ color: "var(--sea-ink-soft)" }}
					>
						<span
							className="size-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
							style={{
								background: "var(--lagoon)",
								color: "white",
							}}
						>
							<Settings size={12} />
						</span>
						<span className="flex-1 text-left truncate font-medium" style={{ color: "var(--sea-ink)" }}>
							Account
						</span>
					</Link>
					<button
						type="button"
						onClick={handleSignOut}
						className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors hover:bg-white/40 mt-1"
						style={{ color: "var(--sea-ink-soft)" }}
					>
						<span className="size-7 rounded-full flex items-center justify-center shrink-0">
							<LogOut size={13} />
						</span>
						<span className="font-medium">Sign out</span>
					</button>
				</div>
			</aside>

			{/* ── Main content ───────────────────────────────────────────── */}
			<main className="flex-1 flex flex-col min-h-dvh md:ml-56">
				{/* Mobile header */}
				<header
					className="md:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-3"
					style={{
						background: "var(--header-bg)",
						borderBottom: "1px solid var(--line)",
						backdropFilter: "blur(12px)",
					}}
				>
					<span
						className="display-title text-lg font-bold"
						style={{ color: "var(--palm)" }}
					>
						Lake House
					</span>
					<div className="flex items-center gap-1">
						<Link
							to="/settings/notifications"
							className="relative p-2 rounded-lg transition-colors hover:bg-white/40"
							style={{ color: "var(--sea-ink-soft)" }}
						>
							<Bell size={18} />
							{unreadCount > 0 && (
								<span
									className="absolute top-1 right-1 size-4 rounded-full flex items-center justify-center text-[9px] font-bold"
									style={{ background: "#c83232", color: "white" }}
								>
									{unreadCount > 9 ? "9+" : unreadCount}
								</span>
							)}
						</Link>
						<Link
							to="/settings"
							className="p-2 rounded-lg transition-colors hover:bg-white/40"
							style={{ color: "var(--sea-ink-soft)" }}
						>
							<Settings size={18} />
						</Link>
					</div>
				</header>

				{/* Page content */}
				<div className="flex-1 pb-24 md:pb-0">
					<OfflineBanner />
					{children}
				</div>
			</main>

			{/* ── Mobile bottom nav ──────────────────────────────────────── */}
			<nav
				className="md:hidden fixed bottom-0 inset-x-0 z-40"
				style={{
					background: "var(--header-bg)",
					borderTop: "1px solid var(--line)",
					backdropFilter: "blur(16px)",
					paddingBottom: "env(safe-area-inset-bottom)",
				}}
			>
				<div className="flex items-stretch h-16">
					{primaryNav.map((item) => (
						<BottomNavLink
							key={item.to}
							{...item}
							active={isActive(item.to)}
						/>
					))}

					{/* More button */}
					<button
						type="button"
						onClick={() => setMoreOpen(true)}
						className="flex-1 flex flex-col items-center justify-center gap-1 transition-opacity"
						style={{
							color: moreOpen ? "var(--palm)" : "var(--sea-ink-soft)",
						}}
					>
						<LayoutGrid size={20} />
						<span className="text-[10px] font-semibold tracking-wide">More</span>
					</button>
				</div>
			</nav>

			{/* ── More sheet (mobile) ────────────────────────────────────── */}
			{moreOpen && (
				<>
					{/* Backdrop */}
					<div
						className="md:hidden fixed inset-0 z-50"
						style={{ background: "rgba(23, 58, 64, 0.4)", backdropFilter: "blur(4px)" }}
						onClick={() => setMoreOpen(false)}
					/>

					{/* Sheet */}
					<div
						className="md:hidden fixed bottom-0 inset-x-0 z-50 rounded-t-2xl pb-safe"
						style={{
							background: "var(--surface-strong)",
							border: "1px solid var(--line)",
							borderBottom: "none",
							backdropFilter: "blur(16px)",
							paddingBottom: "calc(env(safe-area-inset-bottom) + 1rem)",
							boxShadow: "0 -8px 40px rgba(23, 58, 64, 0.16)",
						}}
					>
						<div className="flex items-center justify-between px-5 py-4">
							<span
								className="island-kicker"
								style={{ color: "var(--kicker)" }}
							>
								More sections
							</span>
							<button
								type="button"
								onClick={() => setMoreOpen(false)}
								className="p-1 rounded-lg"
								style={{ color: "var(--sea-ink-soft)" }}
							>
								<X size={18} />
							</button>
						</div>

						<div className="grid grid-cols-2 gap-2 px-4 pb-2">
							{secondaryNav.map((item) => (
								<Link
									key={item.to}
									to={item.to}
									onClick={() => setMoreOpen(false)}
									className="flex items-center gap-3 px-4 py-3.5 rounded-xl transition-colors"
									style={{
										background: isActive(item.to)
											? "rgba(47, 106, 74, 0.1)"
											: "rgba(255, 255, 255, 0.5)",
										border: "1px solid var(--line)",
										color: isActive(item.to) ? "var(--palm)" : "var(--sea-ink)",
									}}
								>
									<span
										className="shrink-0"
										style={{
											color: isActive(item.to) ? "var(--palm)" : "var(--sea-ink-soft)",
										}}
									>
										{item.icon}
									</span>
									<span className="text-sm font-semibold">{item.label}</span>
								</Link>
							))}
						</div>

						{/* Logout row */}
						<div className="px-4 pt-2">
							<button
								type="button"
								onClick={handleSignOut}
								className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-semibold transition-colors"
								style={{
									background: "rgba(255, 255, 255, 0.5)",
									border: "1px solid var(--line)",
									color: "var(--sea-ink-soft)",
								}}
							>
								<LogOut size={16} />
								Sign out
							</button>
						</div>
					</div>
				</>
			)}
		</div>
	)
}

function SidebarLink({
	to,
	label,
	icon,
	active,
}: NavItem & { active: boolean }) {
	return (
		<Link
			to={to}
			className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all"
			style={{
				background: active ? "rgba(47, 106, 74, 0.12)" : "transparent",
				color: active ? "var(--palm)" : "var(--sea-ink-soft)",
			}}
		>
			<span
				className="shrink-0 transition-colors"
				style={{ color: active ? "var(--palm)" : "var(--sea-ink-soft)" }}
			>
				{icon}
			</span>
			{label}
			{active && (
				<span className="ml-auto">
					<ChevronRight size={14} style={{ color: "var(--lagoon)" }} />
				</span>
			)}
		</Link>
	)
}

function BottomNavLink({
	to,
	label,
	icon,
	active,
}: NavItem & { active: boolean }) {
	return (
		<Link
			to={to}
			className="flex-1 flex flex-col items-center justify-center gap-1 relative transition-colors"
			style={{ color: active ? "var(--palm)" : "var(--sea-ink-soft)" }}
		>
			{active && (
				<span
					className="absolute top-2 w-7 h-1 rounded-full"
					style={{ background: "var(--lagoon)" }}
				/>
			)}
			<span className="mt-1">{icon}</span>
			<span className="text-[10px] font-semibold tracking-wide">{label}</span>
		</Link>
	)
}
