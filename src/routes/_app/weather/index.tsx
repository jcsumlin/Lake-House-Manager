import { useConvexQuery } from "@convex-dev/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { api } from "../../../../convex/_generated/api"
import { useCurrentMember } from "#/lib/auth/useCurrentMember"
import { AlertTriangle, CloudLightning, Loader2, Settings } from "lucide-react"
import { Button } from "#/components/ui/button"

export const Route = createFileRoute("/_app/weather/")({
	component: WeatherPage,
})

const SEVERITY_COLORS = {
	warning: { bg: "rgba(200,50,50,0.1)", color: "#c83232" },
	watch: { bg: "rgba(224,112,0,0.1)", color: "#e07000" },
	advisory: { bg: "rgba(0,108,140,0.1)", color: "var(--lagoon)" },
}

const TYPE_LABELS = {
	storm: "Storm",
	freeze: "Freeze",
	other: "Alert",
}

function WeatherPage() {
	const { property } = useCurrentMember()

	const alerts = useConvexQuery(
		api.weather.getAlerts,
		property ? { propertyId: property._id } : "skip",
	)

	const autoTasks = useConvexQuery(
		api.tasks.list,
		property
			? { propertyId: property._id, status: "todo" }
			: "skip",
	)

	const weatherTasks = autoTasks?.filter(
		(t) => t.source === "weather_auto" || t.source === "freeze_auto",
	)

	const hasWeatherConfig = !!(property?.weatherApiLat && property?.weatherApiLon)

	return (
		<div className="page-wrap py-6 space-y-5">
			<div className="rise-in flex items-center justify-between mb-2">
				<div>
					<p className="island-kicker mb-1" style={{ color: "var(--kicker)" }}>Automation</p>
					<h1 className="display-title text-2xl font-bold" style={{ color: "var(--sea-ink)" }}>Weather Alerts</h1>
				</div>
				<Link to="/settings/weather">
					<Button size="sm" variant="ghost">
						<Settings size={14} className="mr-1" /> Configure
					</Button>
				</Link>
			</div>

			{!hasWeatherConfig && (
				<div className="rise-in island-shell rounded-2xl p-5 text-center" style={{ animationDelay: "40ms", border: "1px dashed var(--line)" }}>
					<CloudLightning size={32} className="mx-auto mb-3" style={{ color: "var(--sea-ink-soft)" }} />
					<p className="text-sm font-semibold mb-1" style={{ color: "var(--sea-ink)" }}>Weather alerts not configured</p>
					<p className="text-xs mb-3" style={{ color: "var(--sea-ink-soft)" }}>Set your property's coordinates in settings to receive storm and freeze alerts.</p>
					<Link to="/settings/weather">
						<Button size="sm" style={{ background: "var(--lagoon)", color: "white", border: "none" }}>
							Go to Weather Settings
						</Button>
					</Link>
				</div>
			)}

			{hasWeatherConfig && alerts === undefined && (
				<div className="flex justify-center py-12">
					<Loader2 className="animate-spin" style={{ color: "var(--lagoon)" }} />
				</div>
			)}

			{hasWeatherConfig && alerts !== undefined && (
				<>
					{alerts.length === 0 ? (
						<div className="rise-in island-shell rounded-2xl p-8 text-center" style={{ animationDelay: "40ms" }}>
							<CloudLightning size={32} className="mx-auto mb-3" style={{ color: "var(--palm)" }} />
							<p className="text-sm font-semibold" style={{ color: "var(--sea-ink)" }}>No recent alerts</p>
							<p className="text-xs mt-1" style={{ color: "var(--sea-ink-soft)" }}>Checked every 6 hours. Last 12h shown.</p>
						</div>
					) : (
						<div className="rise-in space-y-2" style={{ animationDelay: "40ms" }}>
							{alerts.map((alert) => {
								const colors = SEVERITY_COLORS[alert.severity]
								return (
									<div key={alert._id} className="island-shell rounded-xl px-4 py-3" style={{ borderLeft: `3px solid ${colors.color}` }}>
										<div className="flex items-start gap-2">
											<AlertTriangle size={16} className="mt-0.5 shrink-0" style={{ color: colors.color }} />
											<div className="flex-1 min-w-0">
												<div className="flex items-center gap-2 flex-wrap">
													<span className="text-xs font-semibold px-1.5 py-px rounded-full capitalize" style={{ background: colors.bg, color: colors.color }}>
														{TYPE_LABELS[alert.type]} {alert.severity}
													</span>
													{alert.tasksBulkCreated && (
														<span className="text-xs" style={{ color: "var(--sea-ink-soft)" }}>· Tasks created</span>
													)}
												</div>
												<p className="text-sm font-semibold mt-1" style={{ color: "var(--sea-ink)" }}>{alert.headline}</p>
												<p className="text-xs mt-0.5" style={{ color: "var(--sea-ink-soft)" }}>
													{new Date(alert.checkedAt).toLocaleString()}
												</p>
											</div>
										</div>
									</div>
								)
							})}
						</div>
					)}

					{weatherTasks && weatherTasks.length > 0 && (
						<div className="rise-in island-shell rounded-2xl p-4" style={{ animationDelay: "80ms" }}>
							<p className="text-sm font-semibold mb-3" style={{ color: "var(--sea-ink)" }}>Auto-created Tasks</p>
							<div className="space-y-2">
								{weatherTasks.map((task) => (
									<Link key={task._id} to="/tasks/$taskId" params={{ taskId: task._id }} className="flex items-center gap-3">
										<span
											className="size-2 rounded-full shrink-0"
											style={{ background: task.source === "freeze_auto" ? "#60a5fa" : "#f59e0b" }}
										/>
										<span className="text-sm" style={{ color: "var(--sea-ink)" }}>{task.title}</span>
									</Link>
								))}
							</div>
						</div>
					)}
				</>
			)}
		</div>
	)
}
