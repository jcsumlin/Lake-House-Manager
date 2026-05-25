import { useConvexQuery } from "@convex-dev/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { api } from "../../../convex/_generated/api"
import { useCurrentMember } from "#/lib/auth/useCurrentMember"
import { FirstRunWizard } from "#/components/features/FirstRunWizard"
import { CalendarDays, CheckSquare2, Loader2, Megaphone, Plus, TriangleAlert, Wrench } from "lucide-react"
import { Button } from "#/components/ui/button"

export const Route = createFileRoute("/_app/")({
	component: Dashboard,
})

function Dashboard() {
	const { membership, property } = useCurrentMember()
	const summary = useConvexQuery(
		api.dashboard.getSummary,
		property ? { propertyId: property._id } : "skip",
	)

	const hour = new Date().getHours()
	const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening"

	if (membership === undefined || property === undefined) {
		return (
			<div className="min-h-dvh flex items-center justify-center">
				<Loader2 className="animate-spin" style={{ color: "var(--lagoon)" }} />
			</div>
		)
	}

	if (!property) {
		return <FirstRunWizard onCreated={() => {}} />
	}

	return (
		<div className="page-wrap py-8">
			<div className="rise-in">
				<p className="island-kicker mb-2" style={{ color: "var(--kicker)" }}>
					Dashboard
				</p>
				<h1 className="display-title text-3xl font-bold mb-1" style={{ color: "var(--sea-ink)" }}>
					{greeting}
				</h1>
				<p className="text-sm mb-6" style={{ color: "var(--sea-ink-soft)" }}>
					{property.name}
				</p>
			</div>

			{/* Quick actions */}
			<div className="rise-in flex flex-wrap gap-2 mb-6" style={{ animationDelay: "60ms" }}>
				<Button asChild size="sm" className="gap-1.5" style={{ background: "linear-gradient(135deg, var(--palm), var(--lagoon-deep))", color: "white", border: "none" }}>
					<Link to="/calendar/new"><Plus size={14} /> New Stay</Link>
				</Button>
				<Button asChild size="sm" variant="outline" className="gap-1.5">
					<Link to="/maintenance/new"><Wrench size={14} /> Report Issue</Link>
				</Button>
				<Button asChild size="sm" variant="outline" className="gap-1.5">
					<Link to="/tasks"><CheckSquare2 size={14} /> Add Task</Link>
				</Button>
			</div>

			{summary === undefined ? (
				<div className="flex justify-center py-12">
					<Loader2 className="animate-spin" style={{ color: "var(--lagoon)" }} />
				</div>
			) : (
				<div className="grid gap-4">
					{/* Stats row */}
					<div className="rise-in grid grid-cols-2 gap-3 sm:grid-cols-4" style={{ animationDelay: "80ms" }}>
						<StatCard
							icon={<CheckSquare2 size={18} />}
							label="Open tasks"
							value={summary.openTaskCount}
							to="/tasks"
							color="var(--lagoon)"
						/>
						<StatCard
							icon={<Wrench size={18} />}
							label="Issues"
							value={summary.openIssueCount}
							to="/maintenance"
							color="var(--palm)"
						/>
						<StatCard
							icon={<CalendarDays size={18} />}
							label="Upcoming stays"
							value={summary.upcomingStays.length}
							to="/calendar"
							color="var(--lagoon-deep)"
						/>
						<StatCard
							icon={<TriangleAlert size={18} />}
							label="Low inventory"
							value={summary.lowInventoryCount}
							to="/inventory"
							color={summary.lowInventoryCount > 0 ? "var(--destructive)" : "var(--sea-ink-soft)"}
						/>
					</div>

					{/* Upcoming stays */}
					{summary.upcomingStays.length > 0 && (
						<div className="rise-in island-shell rounded-2xl p-5" style={{ animationDelay: "100ms" }}>
							<div className="flex items-center justify-between mb-3">
								<p className="island-kicker" style={{ color: "var(--kicker)" }}>Upcoming stays</p>
								<Link to="/calendar" className="text-xs font-semibold" style={{ color: "var(--lagoon-deep)" }}>See all</Link>
							</div>
							<div className="space-y-2">
								{summary.upcomingStays.map((stay) => (
									<Link
										key={stay._id}
										to="/calendar/$stayId"
										params={{ stayId: stay._id }}
										className="flex items-center justify-between rounded-xl px-4 py-3 transition-colors"
										style={{ background: "rgba(255,255,255,0.5)", border: "1px solid var(--line)" }}
									>
										<div>
											<p className="text-sm font-semibold" style={{ color: "var(--sea-ink)" }}>
												{stay.createdBy}
											</p>
											<p className="text-sm font-semibold" style={{ color: "var(--sea-ink)" }}>
												{stay.startDate} → {stay.endDate}
											</p>
											{stay.guestCount && (
												<p className="text-xs mt-0.5" style={{ color: "var(--sea-ink-soft)" }}>
													{stay.guestCount} guest{stay.guestCount !== 1 ? "s" : ""}
												</p>
											)}
										</div>
										<StatusBadge status={stay.status} />
									</Link>
								))}
							</div>
						</div>
					)}

					{/* Today's tasks */}
					{summary.todayTasks.length > 0 && (
						<div className="rise-in island-shell rounded-2xl p-5" style={{ animationDelay: "120ms" }}>
							<div className="flex items-center justify-between mb-3">
								<p className="island-kicker" style={{ color: "var(--kicker)" }}>Today's tasks</p>
								<Link to="/tasks/today" className="text-xs font-semibold" style={{ color: "var(--lagoon-deep)" }}>View all</Link>
							</div>
							<div className="space-y-2">
								{summary.todayTasks.map((task) => (
									<Link
										key={task._id}
										to="/tasks/$taskId"
										params={{ taskId: task._id }}
										className="flex items-center gap-3 rounded-xl px-4 py-3"
										style={{ background: "rgba(255,255,255,0.5)", border: "1px solid var(--line)" }}
									>
										<span
											className="size-2 rounded-full shrink-0"
											style={{ background: priorityColor(task.priority) }}
										/>
										<p className="text-sm font-medium flex-1 truncate" style={{ color: "var(--sea-ink)" }}>
											{task.title}
										</p>
									</Link>
								))}
							</div>
						</div>
					)}

					{/* Announcements */}
					{summary.latestAnnouncements.length > 0 && (
						<div className="rise-in island-shell rounded-2xl p-5" style={{ animationDelay: "140ms" }}>
							<div className="flex items-center justify-between mb-3">
								<p className="island-kicker" style={{ color: "var(--kicker)" }}>Announcements</p>
								<Link to="/announcements" className="text-xs font-semibold" style={{ color: "var(--lagoon-deep)" }}>See all</Link>
							</div>
							<div className="space-y-2">
								{summary.latestAnnouncements.map((a) => (
									<div
										key={a._id}
										className="rounded-xl px-4 py-3"
										style={{
											background: a.pinned ? "rgba(47, 106, 74, 0.06)" : "rgba(255,255,255,0.5)",
											border: `1px solid ${a.pinned ? "rgba(47, 106, 74, 0.2)" : "var(--line)"}`,
										}}
									>
										<div className="flex items-center gap-2 mb-0.5">
											{a.pinned && <Megaphone size={12} style={{ color: "var(--palm)" }} />}
											<p className="text-sm font-semibold" style={{ color: "var(--sea-ink)" }}>{a.title}</p>
										</div>
										<p className="text-xs line-clamp-2" style={{ color: "var(--sea-ink-soft)" }}>{a.body}</p>
									</div>
								))}
							</div>
						</div>
					)}

					{/* Empty state */}
					{summary.openTaskCount === 0 && summary.upcomingStays.length === 0 && summary.latestAnnouncements.length === 0 && (
						<div className="rise-in island-shell rounded-2xl p-8 text-center" style={{ animationDelay: "80ms" }}>
							<p className="island-kicker mb-2" style={{ color: "var(--kicker)" }}>All clear</p>
							<p className="text-sm" style={{ color: "var(--sea-ink-soft)" }}>
								No upcoming stays, open tasks, or announcements. Enjoy the peace!
							</p>
						</div>
					)}
				</div>
			)}
		</div>
	)
}

function StatCard({ icon, label, value, to, color }: { icon: React.ReactNode; label: string; value: number; to: string; color: string }) {
	return (
		<Link
			to={to}
			className="island-shell rounded-2xl p-4 flex flex-col gap-2 transition-all hover:scale-[1.02]"
		>
			<span style={{ color }}>{icon}</span>
			<span className="text-2xl font-bold" style={{ color: "var(--sea-ink)" }}>{value}</span>
			<span className="text-xs font-medium" style={{ color: "var(--sea-ink-soft)" }}>{label}</span>
		</Link>
	)
}

function StatusBadge({ status }: { status: string }) {
	const map: Record<string, { label: string; bg: string; color: string }> = {
		confirmed: { label: "Confirmed", bg: "rgba(47,106,74,0.1)", color: "var(--palm)" },
		tentative: { label: "Tentative", bg: "rgba(180,120,0,0.1)", color: "#b47800" },
		cancelled: { label: "Cancelled", bg: "rgba(200,50,50,0.1)", color: "#c83232" },
	}
	const s = map[status] ?? { label: status, bg: "rgba(0,0,0,0.05)", color: "var(--sea-ink-soft)" }
	return (
		<span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: s.bg, color: s.color }}>
			{s.label}
		</span>
	)
}

function priorityColor(priority: string) {
	const map: Record<string, string> = {
		urgent: "#c83232",
		high: "#e07000",
		medium: "var(--lagoon)",
		low: "var(--sea-ink-soft)",
	}
	return map[priority] ?? "var(--sea-ink-soft)"
}
