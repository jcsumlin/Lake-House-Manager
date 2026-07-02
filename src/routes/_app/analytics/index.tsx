import { useConvexQuery } from "@convex-dev/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { api } from "../../../../convex/_generated/api"
import { useCurrentMember } from "#/lib/auth/useCurrentMember"
import { BarChart2, Loader2 } from "lucide-react"

export const Route = createFileRoute("/_app/analytics/")({
	component: AnalyticsPage,
})

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
const SEASON_COLORS = {
	spring: "#4ade80",
	summer: "#f59e0b",
	fall: "#ef4444",
	winter: "#60a5fa",
}

function AnalyticsPage() {
	const { property } = useCurrentMember()
	const year = new Date().getFullYear()

	const stats = useConvexQuery(
		api.analytics.getOccupancyStats,
		property ? { propertyId: property._id, year } : "skip",
	)
	const memberUsage = useConvexQuery(
		api.analytics.getUsageByMember,
		property ? { propertyId: property._id } : "skip",
	)
	const seasonal = useConvexQuery(
		api.analytics.getSeasonalTrends,
		property ? { propertyId: property._id } : "skip",
	)

	if (!stats || !memberUsage || !seasonal) {
		return (
			<div className="flex justify-center py-12">
				<Loader2 className="animate-spin" style={{ color: "var(--lagoon)" }} />
			</div>
		)
	}

	const maxNights = Math.max(...Object.values(stats.nightsByMonth), 1)

	return (
		<div className="page-wrap py-6 space-y-6">
			<div className="rise-in">
				<p className="island-kicker mb-1" style={{ color: "var(--kicker)" }}>Insights</p>
				<h1 className="display-title text-2xl font-bold" style={{ color: "var(--sea-ink)" }}>Analytics</h1>
			</div>

			{/* Occupancy summary */}
			<div className="rise-in grid grid-cols-3 gap-3" style={{ animationDelay: "40ms" }}>
				{[
					{ label: "Stays", value: stats.stayCount },
					{ label: "Nights", value: stats.totalNights },
					{ label: "Occupancy", value: `${stats.occupancyRate}%` },
				].map((item) => (
					<div key={item.label} className="island-shell rounded-xl p-4 text-center">
						<p className="text-2xl font-bold" style={{ color: "var(--sea-ink)" }}>{item.value}</p>
						<p className="text-xs mt-1" style={{ color: "var(--sea-ink-soft)" }}>{item.label}</p>
					</div>
				))}
			</div>

			{/* Monthly bar chart */}
			<div className="rise-in island-shell rounded-2xl p-4" style={{ animationDelay: "80ms" }}>
				<div className="flex items-center gap-2 mb-4">
					<BarChart2 size={16} style={{ color: "var(--lagoon)" }} />
					<span className="text-sm font-semibold" style={{ color: "var(--sea-ink)" }}>Nights by Month — {year}</span>
				</div>
				<div className="flex items-end gap-1" style={{ height: 80 }}>
					{MONTH_LABELS.map((label, i) => {
						const key = `${year}-${String(i + 1).padStart(2, "0")}`
						const nights = stats.nightsByMonth[key] ?? 0
						const height = Math.round((nights / maxNights) * 70) + 4
						return (
							<div key={label} className="flex-1 flex flex-col items-center gap-1">
								<div
									className="w-full rounded-t-sm transition-all"
									style={{
										height,
										background: `linear-gradient(180deg, var(--lagoon), var(--palm))`,
										opacity: nights > 0 ? 1 : 0.2,
									}}
								/>
								<span className="text-[8px]" style={{ color: "var(--sea-ink-soft)" }}>{label}</span>
							</div>
						)
					})}
				</div>
				{stats.peakMonth && (
					<p className="text-xs mt-3" style={{ color: "var(--sea-ink-soft)" }}>
						Peak: {stats.peakMonth} with {stats.nightsByMonth[stats.peakMonth]} nights
					</p>
				)}
			</div>

			{/* Seasonal trends */}
			<div className="rise-in island-shell rounded-2xl p-4" style={{ animationDelay: "120ms" }}>
				<p className="text-sm font-semibold mb-3" style={{ color: "var(--sea-ink)" }}>Seasonal Trends (nights)</p>
				<div className="grid grid-cols-2 gap-3">
					{(Object.entries(seasonal) as [keyof typeof seasonal, number][]).map(([season, nights]) => (
						<div key={season} className="rounded-xl p-3" style={{ background: `${SEASON_COLORS[season]}18`, border: `1px solid ${SEASON_COLORS[season]}30` }}>
							<p className="text-lg font-bold" style={{ color: SEASON_COLORS[season] }}>{nights}</p>
							<p className="text-xs capitalize mt-0.5" style={{ color: "var(--sea-ink-soft)" }}>{season}</p>
						</div>
					))}
				</div>
			</div>

			{/* Member usage */}
			{memberUsage.length > 0 && (
				<div className="rise-in island-shell rounded-2xl p-4" style={{ animationDelay: "160ms" }}>
					<p className="text-sm font-semibold mb-3" style={{ color: "var(--sea-ink)" }}>Usage by Member</p>
					<div className="space-y-3">
						{memberUsage
							.sort((a, b) => b.nights - a.nights)
							.map((member) => (
								<div key={member.userId} className="flex items-center justify-between">
									<div>
										<p className="text-sm font-semibold" style={{ color: "var(--sea-ink)" }}>{member.name}</p>
										<p className="text-xs" style={{ color: "var(--sea-ink-soft)" }}>{member.stayCount} stay{member.stayCount !== 1 ? "s" : ""}</p>
									</div>
									<span className="text-sm font-bold" style={{ color: "var(--lagoon)" }}>{member.nights} nights</span>
								</div>
							))}
					</div>
				</div>
			)}
		</div>
	)
}
