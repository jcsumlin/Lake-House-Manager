import { useConvexMutation, useConvexQuery } from "@convex-dev/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { api } from "../../../../convex/_generated/api"
import type { Id } from "../../../../convex/_generated/dataModel"
import { useCurrentMember } from "#/lib/auth/useCurrentMember"
import { CheckCircle2, Circle, Loader2 } from "lucide-react"

export const Route = createFileRoute("/_app/tasks/today")({
	component: TodayPage,
})

function TodayPage() {
	const { property } = useCurrentMember()
	const tasks = useConvexQuery(
		api.tasks.listToday,
		property ? { propertyId: property._id } : "skip",
	)
	const completeTask = useConvexMutation(api.tasks.complete)

	async function handleComplete(taskId: Id<"tasks">) {
		await completeTask({ taskId })
	}

	const total = tasks?.length ?? 0
	const done = tasks?.filter((t) => t.status === "done").length ?? 0

	return (
		<div className="page-wrap py-6 max-w-md mx-auto">
			<div className="rise-in mb-6">
				<p className="island-kicker mb-1" style={{ color: "var(--kicker)" }}>
					{new Date().toLocaleDateString("default", { weekday: "long", month: "long", day: "numeric" })}
				</p>
				<h1 className="display-title text-2xl font-bold mb-1" style={{ color: "var(--sea-ink)" }}>Today's tasks</h1>
				{total > 0 && (
					<p className="text-sm" style={{ color: "var(--sea-ink-soft)" }}>
						{done} of {total} complete
					</p>
				)}
			</div>

			{/* Progress bar */}
			{total > 0 && (
				<div className="rise-in mb-6 h-2 rounded-full overflow-hidden" style={{ background: "rgba(23,58,64,0.08)", animationDelay: "40ms" }}>
					<div
						className="h-full rounded-full transition-all duration-500"
						style={{
							width: `${Math.round((done / total) * 100)}%`,
							background: "linear-gradient(90deg, var(--lagoon), var(--palm))",
						}}
					/>
				</div>
			)}

			{tasks === undefined ? (
				<div className="flex justify-center py-12"><Loader2 className="animate-spin" style={{ color: "var(--lagoon)" }} /></div>
			) : tasks.length === 0 ? (
				<div className="rise-in island-shell rounded-2xl p-10 text-center" style={{ animationDelay: "60ms" }}>
					<p className="text-2xl mb-2">🌊</p>
					<p className="font-semibold mb-1" style={{ color: "var(--sea-ink)" }}>All clear!</p>
					<p className="text-sm" style={{ color: "var(--sea-ink-soft)" }}>No tasks due today.</p>
				</div>
			) : (
				<div className="rise-in space-y-2" style={{ animationDelay: "60ms" }}>
					{tasks.map((task) => (
						<div
							key={task._id}
							className="flex items-center gap-4 rounded-2xl px-5 py-4 transition-all"
							style={{
								background: task.status === "done" ? "rgba(47,106,74,0.06)" : "var(--surface-strong)",
								border: `1px solid ${task.status === "done" ? "rgba(47,106,74,0.15)" : "var(--line)"}`,
								opacity: task.status === "done" ? 0.7 : 1,
							}}
						>
							<button
								type="button"
								onClick={() => task.status !== "done" && handleComplete(task._id)}
								className="shrink-0 transition-all active:scale-90"
								style={{ color: task.status === "done" ? "var(--palm)" : "var(--sea-ink-soft)" }}
								aria-label="Mark complete"
							>
								{task.status === "done"
									? <CheckCircle2 size={28} />
									: <Circle size={28} />
								}
							</button>
							<Link to="/tasks/$taskId" params={{ taskId: task._id }} className="flex-1 min-w-0">
								<p
									className="font-semibold"
									style={{
										color: task.status === "done" ? "var(--sea-ink-soft)" : "var(--sea-ink)",
										textDecoration: task.status === "done" ? "line-through" : "none",
									}}
								>
									{task.title}
								</p>
								{task.description && (
									<p className="text-xs mt-0.5 truncate" style={{ color: "var(--sea-ink-soft)" }}>{task.description}</p>
								)}
							</Link>
						</div>
					))}
				</div>
			)}

			<div className="mt-6 text-center">
				<Link to="/tasks" className="text-sm font-semibold" style={{ color: "var(--lagoon-deep)" }}>
					View all tasks
				</Link>
			</div>
		</div>
	)
}
