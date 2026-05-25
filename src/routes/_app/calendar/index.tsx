import { useConvexQuery } from "@convex-dev/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { api } from "../../../../convex/_generated/api"
import { useCurrentMember } from "#/lib/auth/useCurrentMember"
import { ChevronLeft, ChevronRight, Loader2, Plus } from "lucide-react"
import { useMemo, useState } from "react"
import { Button } from "#/components/ui/button"

export const Route = createFileRoute("/_app/calendar/")({
	component: CalendarPage,
})

function nthWeekday(year: number, month: number, weekday: number, n: number): string {
	const d = new Date(year, month, 1)
	let count = 0
	while (d.getMonth() === month) {
		if (d.getDay() === weekday) {
			count++
			if (count === n) break
		}
		d.setDate(d.getDate() + 1)
	}
	return d.toISOString().slice(0, 10)
}

function lastWeekday(year: number, month: number, weekday: number): string {
	const d = new Date(year, month + 1, 0) // last day of month
	while (d.getDay() !== weekday) d.setDate(d.getDate() - 1)
	return d.toISOString().slice(0, 10)
}

function pad(n: number) { return String(n).padStart(2, "0") }

function getUSHolidays(year: number): Record<string, string> {
	return {
		[`${year}-01-01`]: "🎆 New Year's Day",
		[nthWeekday(year, 0, 1, 3)]: "✊🏾 MLK Jr. Day",
		[nthWeekday(year, 1, 1, 3)]: "🇺🇸 Presidents' Day",
		[lastWeekday(year, 4, 1)]: "🪖 Memorial Day",
		[`${year}-06-19`]: "🖤 Juneteenth",
		[`${year}-07-04`]: "🎇 Independence Day",
		[nthWeekday(year, 8, 1, 1)]: "🛠️ Labor Day",
		[nthWeekday(year, 9, 1, 2)]: "🧭 Columbus Day",
		[`${year}-11-11`]: "🎖️ Veterans Day",
		[nthWeekday(year, 10, 4, 4)]: "🦃 Thanksgiving",
		[`${year}-12-25`]: "🎄 Christmas Day",
	}
}

function CalendarPage() {
	const { property } = useCurrentMember()
	const [year, setYear] = useState(new Date().getFullYear())
	const [month, setMonth] = useState(new Date().getMonth())

	const stays = useConvexQuery(
		api.stays.list,
		property
			? {
					propertyId: property._id,
					fromDate: new Date(year, month, 1).toISOString().slice(0, 10),
					toDate: new Date(year, month + 1, 0).toISOString().slice(0, 10),
				}
			: "skip",
	)

	function prevMonth() {
		if (month === 0) { setMonth(11); setYear((y) => y - 1) }
		else setMonth((m) => m - 1)
	}

	function nextMonth() {
		if (month === 11) { setMonth(0); setYear((y) => y + 1) }
		else setMonth((m) => m + 1)
	}

	const daysInMonth = new Date(year, month + 1, 0).getDate()
	const firstDayOfWeek = new Date(year, month, 1).getDay()
	const monthLabel = new Date(year, month, 1).toLocaleString("default", { month: "long", year: "numeric" })

	const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

	const holidays = useMemo(() => getUSHolidays(year), [year])

	function staysForDay(day: number) {
		const dateStr = `${year}-${pad(month + 1)}-${pad(day)}`
		return (stays ?? []).filter(
			(s) => s.startDate <= dateStr && s.endDate >= dateStr && s.status !== "cancelled",
		)
	}

	return (
		<div className="page-wrap py-6">
			<div className="rise-in flex items-center justify-between mb-6">
				<div>
					<p className="island-kicker mb-1" style={{ color: "var(--kicker)" }}>Calendar</p>
					<h1 className="display-title text-2xl font-bold" style={{ color: "var(--sea-ink)" }}>{monthLabel}</h1>
				</div>
				<Button asChild size="sm" style={{ background: "linear-gradient(135deg, var(--palm), var(--lagoon-deep))", color: "white", border: "none" }}>
					<Link to="/calendar/new"><Plus size={14} className="mr-1" /> New stay</Link>
				</Button>
			</div>

			<div className="rise-in island-shell rounded-2xl p-4" style={{ animationDelay: "60ms" }}>
				{/* Month nav */}
				<div className="flex items-center justify-between mb-4">
					<button type="button" onClick={prevMonth} className="p-2 rounded-lg hover:bg-white/40 transition-colors" style={{ color: "var(--sea-ink-soft)" }}>
						<ChevronLeft size={18} />
					</button>
					<span className="font-semibold text-sm" style={{ color: "var(--sea-ink)" }}>{monthLabel}</span>
					<button type="button" onClick={nextMonth} className="p-2 rounded-lg hover:bg-white/40 transition-colors" style={{ color: "var(--sea-ink-soft)" }}>
						<ChevronRight size={18} />
					</button>
				</div>

				{/* Day headers */}
				<div className="grid grid-cols-7 mb-1">
					{DAYS.map((d) => (
						<div key={d} className="text-center text-xs font-semibold py-1" style={{ color: "var(--sea-ink-soft)" }}>{d}</div>
					))}
				</div>

				{/* Calendar grid */}
				{stays === undefined ? (
					<div className="flex justify-center py-8"><Loader2 className="animate-spin" style={{ color: "var(--lagoon)" }} /></div>
				) : (
					<div className="grid grid-cols-7 gap-px">
						{Array.from({ length: firstDayOfWeek }, (_, i) => (
							<div key={`empty-${i}`} className="aspect-square" />
						))}
						{Array.from({ length: daysInMonth }, (_, i) => {
							const day = i + 1
							const dateStr = `${year}-${pad(month + 1)}-${pad(day)}`
							const isToday = dateStr === new Date().toISOString().slice(0, 10)
							const dayStays = staysForDay(day)
							const holiday = holidays[dateStr]
							return (
								<div
									key={day}
									className="aspect-square p-0.5 rounded-lg flex flex-col"
									style={{
										background: isToday ? "rgba(47, 106, 74, 0.08)" : undefined,
										border: isToday ? "1px solid rgba(47, 106, 74, 0.2)" : "1px solid transparent",
									}}
								>
									<span className="text-xs font-medium mb-0.5 px-1" style={{ color: isToday ? "var(--palm)" : "var(--sea-ink)" }}>
										{day}
									</span>
									{holiday && (
										<span
											className="text-sm font-semibold px-1 rounded truncate mb-px leading-tight"
											style={{ background: "rgba(220,38,38,0.1)", color: "#b91c1c" }}
											title={holiday}
										>
											{holiday}
										</span>
									)}
									{dayStays.slice(0, holiday ? 1 : 2).map((stay) => (
										<Link
											key={stay._id}
											to="/calendar/$stayId"
											params={{ stayId: stay._id }}
											className="text-base font-semibold px-1 rounded truncate mb-px"
											style={{
												background: stay.status === "confirmed" ? "rgba(47,106,74,0.15)" : "rgba(180,120,0,0.15)",
												color: stay.status === "confirmed" ? "var(--palm)" : "#b47800",
											}}
										>
											{stay.createdBy ?? "Stay"}
										</Link>
									))}
								</div>
							)
						})}
					</div>
				)}
			</div>

			{/* Upcoming stays list */}
			{stays && stays.length > 0 && (
				<div className="rise-in mt-4 space-y-2" style={{ animationDelay: "80ms" }}>
					<p className="island-kicker mb-2" style={{ color: "var(--kicker)" }}>This month's stays</p>
					{stays.filter((s) => s.status !== "cancelled").map((stay) => (
						<Link
							key={stay._id}
							to="/calendar/$stayId"
							params={{ stayId: stay._id }}
							className="flex items-center justify-between island-shell rounded-xl px-4 py-3"
						>
							<div>
								<p className="text-sm font-semibold" style={{ color: "var(--sea-ink)" }}>
									{stay.createdBy}
								</p>
								<p className="text-xs font-semibold" style={{ color: "var(--sea-ink)" }}>
									{stay.startDate} — {stay.endDate}
								</p>
								<p className="text-xs mt-0.5" style={{ color: "var(--sea-ink-soft)" }}>
									{stay.guestCount ? `${stay.guestCount} guest${stay.guestCount !== 1 ? "s" : ""}` : "No guest count"}
									{stay.notes ? ` · ${stay.notes}` : ""}
								</p>
							</div>
							<span
								className="text-xs font-semibold px-2 py-0.5 rounded-full"
								style={{
									background: stay.status === "confirmed" ? "rgba(47,106,74,0.1)" : "rgba(180,120,0,0.1)",
									color: stay.status === "confirmed" ? "var(--palm)" : "#b47800",
								}}
							>
								{stay.status}
							</span>
						</Link>
					))}
				</div>
			)}
		</div>
	)
}
