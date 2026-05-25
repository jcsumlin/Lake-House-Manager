import { useConvexMutation, useConvexQuery } from "@convex-dev/react-query"
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { api } from "../../../../convex/_generated/api"
import type { Id } from "../../../../convex/_generated/dataModel"
import { STATUS_LABELS } from "./index"
import { ArrowLeft, Loader2, Trash2 } from "lucide-react"
import { useState } from "react"
import { Button } from "#/components/ui/button"
import { Input } from "#/components/ui/input"
import { Label } from "#/components/ui/label"

export const Route = createFileRoute("/_app/maintenance/$issueId")({
	component: IssueDetailPage,
})

const STATUS_FLOW = [
	"open",
	"in_progress",
	"waiting_parts",
	"waiting_vendor",
	"resolved",
	"wont_fix",
] as const

const PRIORITY_COLORS: Record<string, string> = {
	urgent: "#c83232",
	high: "#e07000",
	medium: "var(--lagoon)",
	low: "var(--sea-ink-soft)",
}

function IssueDetailPage() {
	const { issueId } = Route.useParams()
	const navigate = useNavigate()
	const issue = useConvexQuery(api.maintenance.get, { issueId: issueId as Id<"maintenanceIssues"> })
	const updateIssue = useConvexMutation(api.maintenance.update)
	const resolveIssue = useConvexMutation(api.maintenance.resolve)
	const removeIssue = useConvexMutation(api.maintenance.remove)

	const [actualCost, setActualCost] = useState("")
	const [updatingStatus, setUpdatingStatus] = useState(false)

	async function handleStatusChange(status: (typeof STATUS_FLOW)[number]) {
		setUpdatingStatus(true)
		try {
			if (status === "resolved") {
				await resolveIssue({
					issueId: issueId as Id<"maintenanceIssues">,
					actualCost: actualCost ? parseFloat(actualCost) : undefined,
				})
			} else {
				await updateIssue({ issueId: issueId as Id<"maintenanceIssues">, status })
			}
		} finally {
			setUpdatingStatus(false)
		}
	}

	async function handleDelete() {
		if (!confirm("Delete this issue permanently?")) return
		await removeIssue({ issueId: issueId as Id<"maintenanceIssues"> })
		navigate({ to: "/maintenance" })
	}

	if (issue === undefined) return <div className="flex justify-center py-12"><Loader2 className="animate-spin" style={{ color: "var(--lagoon)" }} /></div>
	if (!issue) return <div className="page-wrap py-6"><p>Issue not found.</p></div>

	const pc = PRIORITY_COLORS[issue.priority] ?? "var(--sea-ink-soft)"

	return (
		<div className="page-wrap py-6 max-w-lg">
			<Link to="/maintenance" className="inline-flex items-center gap-1.5 text-sm mb-4 font-medium" style={{ color: "var(--sea-ink-soft)" }}>
				<ArrowLeft size={14} /> Maintenance
			</Link>

			<div className="rise-in island-shell rounded-2xl p-6 space-y-4">
				<div className="flex items-start justify-between gap-3">
					<div>
						<p className="island-kicker mb-1" style={{ color: "var(--kicker)" }}>Issue</p>
						<h1 className="display-title text-xl font-bold" style={{ color: "var(--sea-ink)" }}>{issue.title}</h1>
					</div>
					<Button size="icon-sm" variant="ghost" onClick={handleDelete} style={{ color: "var(--sea-ink-soft)" }}>
						<Trash2 size={14} />
					</Button>
				</div>

				{issue.description && (
					<p className="text-sm" style={{ color: "var(--sea-ink-soft)" }}>{issue.description}</p>
				)}

				<div className="grid grid-cols-2 gap-2">
					<InfoChip label="Category" value={issue.category.replace("_", " ")} />
					<InfoChip label="Priority" value={issue.priority} valueColor={pc} />
					{issue.area && <InfoChip label="Area" value={issue.area} />}
					{issue.estimatedCost && <InfoChip label="Est. cost" value={`$${issue.estimatedCost}`} />}
					{issue.actualCost && <InfoChip label="Actual cost" value={`$${issue.actualCost}`} />}
				</div>

				{/* Status workflow */}
				<div>
					<p className="text-xs font-semibold mb-2" style={{ color: "var(--sea-ink-soft)" }}>Status</p>
					<div className="flex flex-wrap gap-1">
						{STATUS_FLOW.map((s) => (
							<button
								key={s}
								type="button"
								onClick={() => handleStatusChange(s)}
								disabled={updatingStatus || issue.status === s}
								className="text-xs font-semibold px-2.5 py-1 rounded-full transition-all capitalize"
								style={{
									background: issue.status === s ? "rgba(47,106,74,0.15)" : "rgba(0,0,0,0.05)",
									color: issue.status === s ? "var(--palm)" : "var(--sea-ink-soft)",
									border: `1px solid ${issue.status === s ? "rgba(47,106,74,0.3)" : "var(--line)"}`,
									opacity: updatingStatus ? 0.5 : 1,
								}}
							>
								{STATUS_LABELS[s] ?? s}
							</button>
						))}
					</div>
				</div>

				{/* Cost tracking for resolution */}
				{issue.status !== "resolved" && issue.status !== "wont_fix" && (
					<div className="space-y-1.5">
						<Label className="text-xs font-semibold" style={{ color: "var(--sea-ink-soft)" }}>Actual cost (when resolving)</Label>
						<Input
							type="number"
							min="0"
							step="0.01"
							value={actualCost}
							onChange={(e) => setActualCost(e.target.value)}
							placeholder="0.00"
							className="h-9"
						/>
					</div>
				)}

				<p className="text-xs" style={{ color: "var(--sea-ink-soft)" }}>
					Reported {new Date(issue.openedAt).toLocaleDateString()}
					{issue.resolvedAt ? ` · Resolved ${new Date(issue.resolvedAt).toLocaleDateString()}` : ""}
				</p>
			</div>
		</div>
	)
}

function InfoChip({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
	return (
		<div className="rounded-xl px-3 py-2" style={{ background: "rgba(255,255,255,0.5)", border: "1px solid var(--line)" }}>
			<p className="text-xs font-semibold mb-0.5 capitalize" style={{ color: "var(--sea-ink-soft)" }}>{label}</p>
			<p className="text-sm font-medium capitalize" style={{ color: valueColor ?? "var(--sea-ink)" }}>{value}</p>
		</div>
	)
}
