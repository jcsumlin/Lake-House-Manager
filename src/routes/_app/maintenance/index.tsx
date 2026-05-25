import { useConvexQuery } from "@convex-dev/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { api } from "../../../../convex/_generated/api"
import { useCurrentMember } from "#/lib/auth/useCurrentMember"
import { Loader2, Plus } from "lucide-react"
import { useState } from "react"
import { Button } from "#/components/ui/button"

export const Route = createFileRoute("/_app/maintenance/")({
	component: MaintenancePage,
})

type StatusFilter = "all" | "open" | "in_progress" | "resolved"

const STATUS_TABS: { key: StatusFilter; label: string }[] = [
	{ key: "all", label: "All" },
	{ key: "open", label: "Open" },
	{ key: "in_progress", label: "In progress" },
	{ key: "resolved", label: "Resolved" },
]

const PRIORITY_COLORS: Record<string, { bg: string; color: string }> = {
	urgent: { bg: "rgba(200,50,50,0.1)", color: "#c83232" },
	high: { bg: "rgba(224,112,0,0.1)", color: "#e07000" },
	medium: { bg: "rgba(0,108,140,0.1)", color: "var(--lagoon)" },
	low: { bg: "rgba(0,0,0,0.05)", color: "var(--sea-ink-soft)" },
}

export const STATUS_LABELS: Record<string, string> = {
	open: "Open",
	in_progress: "In progress",
	waiting_parts: "Waiting parts",
	waiting_vendor: "Waiting vendor",
	resolved: "Resolved",
	wont_fix: "Won't fix",
}

function MaintenancePage() {
	const { property } = useCurrentMember()
	const [filter, setFilter] = useState<StatusFilter>("all")

	const issues = useConvexQuery(
		api.maintenance.list,
		property
			? {
					propertyId: property._id,
					...(filter !== "all" ? { status: filter as "open" | "in_progress" | "resolved" } : {}),
				}
			: "skip",
	)

	return (
		<div className="page-wrap py-6">
			<div className="rise-in flex items-center justify-between mb-4">
				<div>
					<p className="island-kicker mb-1" style={{ color: "var(--kicker)" }}>Maintenance</p>
					<h1 className="display-title text-2xl font-bold" style={{ color: "var(--sea-ink)" }}>Issues</h1>
				</div>
				<Button asChild size="sm" style={{ background: "linear-gradient(135deg, var(--palm), var(--lagoon-deep))", color: "white", border: "none" }}>
					<Link to="/maintenance/new"><Plus size={14} className="mr-1" /> Report</Link>
				</Button>
			</div>

			{/* Filter tabs */}
			<div className="rise-in flex gap-1 mb-4 p-1 rounded-xl overflow-x-auto" style={{ background: "rgba(23,58,64,0.06)", border: "1px solid var(--line)", animationDelay: "40ms" }}>
				{STATUS_TABS.map((t) => (
					<button
						key={t.key}
						type="button"
						onClick={() => setFilter(t.key)}
						className="flex-shrink-0 text-xs font-semibold py-1.5 px-3 rounded-lg transition-all"
						style={{
							background: filter === t.key ? "var(--surface-strong)" : "transparent",
							color: filter === t.key ? "var(--sea-ink)" : "var(--sea-ink-soft)",
						}}
					>
						{t.label}
					</button>
				))}
			</div>

			{issues === undefined ? (
				<div className="flex justify-center py-12"><Loader2 className="animate-spin" style={{ color: "var(--lagoon)" }} /></div>
			) : issues.length === 0 ? (
				<div className="rise-in island-shell rounded-2xl p-8 text-center">
					<p className="text-sm" style={{ color: "var(--sea-ink-soft)" }}>No {filter !== "all" ? filter.replace("_", " ") + " " : ""}issues.</p>
				</div>
			) : (
				<div className="rise-in space-y-2" style={{ animationDelay: "80ms" }}>
					{issues.map((issue) => {
						const pc = PRIORITY_COLORS[issue.priority] ?? PRIORITY_COLORS.low
						return (
							<Link
								key={issue._id}
								to="/maintenance/$issueId"
								params={{ issueId: issue._id }}
								className="island-shell rounded-xl px-4 py-3 flex items-start gap-3"
							>
								<span
									className="size-2 rounded-full mt-1.5 shrink-0"
									style={{ background: pc.color }}
								/>
								<div className="flex-1 min-w-0">
									<p className="text-sm font-semibold truncate" style={{ color: "var(--sea-ink)" }}>{issue.title}</p>
									<div className="flex items-center gap-2 mt-1 flex-wrap">
										<span className="text-[10px] font-semibold px-1.5 py-px rounded-full capitalize" style={{ background: pc.bg, color: pc.color }}>
											{issue.priority}
										</span>
										<span className="text-[10px] font-semibold px-1.5 py-px rounded-full" style={{ background: "rgba(0,0,0,0.05)", color: "var(--sea-ink-soft)" }}>
											{STATUS_LABELS[issue.status] ?? issue.status}
										</span>
										{issue.area && (
											<span className="text-xs" style={{ color: "var(--sea-ink-soft)" }}>{issue.area}</span>
										)}
									</div>
								</div>
							</Link>
						)
					})}
				</div>
			)}
		</div>
	)
}
