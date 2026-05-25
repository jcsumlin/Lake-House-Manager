import { useConvexMutation, useConvexQuery } from "@convex-dev/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { api } from "../../../../convex/_generated/api"
import type { Id } from "../../../../convex/_generated/dataModel"
import { useCurrentMember } from "#/lib/auth/useCurrentMember"
import { CheckCircle2, Circle, Loader2, Plus } from "lucide-react"
import { useState } from "react"
import { Button } from "#/components/ui/button"
import { Input } from "#/components/ui/input"

export const Route = createFileRoute("/_app/tasks/")({
	component: TasksPage,
})

type TabKey = "all" | "mine" | "today" | "done"

const TABS: { key: TabKey; label: string }[] = [
	{ key: "all", label: "All" },
	{ key: "mine", label: "Mine" },
	{ key: "today", label: "Today" },
	{ key: "done", label: "Done" },
]

function TasksPage() {
	const { property } = useCurrentMember()
	const [tab, setTab] = useState<TabKey>("all")
	const [showAdd, setShowAdd] = useState(false)
	const [newTitle, setNewTitle] = useState("")
	const [adding, setAdding] = useState(false)

	const allTasks = useConvexQuery(
		api.tasks.list,
		property
			? {
					propertyId: property._id,
					...(tab === "mine" ? { assignedToMe: true } : {}),
					...(tab === "done" ? { status: "done" as const } : tab === "all" || tab === "mine" ? { status: "todo" as const } : {}),
				}
			: "skip",
	)
	const todayTasks = useConvexQuery(
		api.tasks.listToday,
		property && tab === "today" ? { propertyId: property._id } : "skip",
	)
	const createTask = useConvexMutation(api.tasks.create)
	const completeTask = useConvexMutation(api.tasks.complete)

	const tasks = tab === "today" ? todayTasks : allTasks

	async function handleAddTask(e: React.FormEvent) {
		e.preventDefault()
		if (!property || !newTitle.trim()) return
		setAdding(true)
		try {
			await createTask({
				propertyId: property._id,
				title: newTitle.trim(),
				type: "other",
				priority: "medium",
			})
			setNewTitle("")
			setShowAdd(false)
		} finally {
			setAdding(false)
		}
	}

	async function handleComplete(taskId: Id<"tasks">) {
		await completeTask({ taskId })
	}

	return (
		<div className="page-wrap py-6">
			<div className="rise-in flex items-center justify-between mb-4">
				<div>
					<p className="island-kicker mb-1" style={{ color: "var(--kicker)" }}>Tasks</p>
					<h1 className="display-title text-2xl font-bold" style={{ color: "var(--sea-ink)" }}>Task list</h1>
				</div>
				<div className="flex gap-2">
					<Button asChild size="sm" variant="outline">
						<Link to="/tasks/today">Today</Link>
					</Button>
					<Button
						size="sm"
						onClick={() => setShowAdd(true)}
						style={{ background: "linear-gradient(135deg, var(--palm), var(--lagoon-deep))", color: "white", border: "none" }}
					>
						<Plus size={14} />
					</Button>
				</div>
			</div>

			{/* Quick add */}
			{showAdd && (
				<form onSubmit={handleAddTask} className="rise-in flex gap-2 mb-4">
					<Input
						autoFocus
						placeholder="Task title…"
						value={newTitle}
						onChange={(e) => setNewTitle(e.target.value)}
						className="h-10 flex-1"
					/>
					<Button type="submit" disabled={adding || !newTitle.trim()} size="sm" style={{ background: "var(--palm)", color: "white", border: "none" }}>
						{adding ? <Loader2 size={14} className="animate-spin" /> : "Add"}
					</Button>
					<Button type="button" variant="outline" size="sm" onClick={() => setShowAdd(false)}>×</Button>
				</form>
			)}

			{/* Tabs */}
			<div className="rise-in flex gap-1 mb-4 p-1 rounded-xl" style={{ background: "rgba(23,58,64,0.06)", border: "1px solid var(--line)", animationDelay: "40ms" }}>
				{TABS.map((t) => (
					<button
						key={t.key}
						type="button"
						onClick={() => setTab(t.key)}
						className="flex-1 text-xs font-semibold py-1.5 rounded-lg transition-all"
						style={{
							background: tab === t.key ? "var(--surface-strong)" : "transparent",
							color: tab === t.key ? "var(--sea-ink)" : "var(--sea-ink-soft)",
							boxShadow: tab === t.key ? "0 1px 4px rgba(23,58,64,0.1)" : "none",
						}}
					>
						{t.label}
					</button>
				))}
			</div>

			{tasks === undefined ? (
				<div className="flex justify-center py-12"><Loader2 className="animate-spin" style={{ color: "var(--lagoon)" }} /></div>
			) : tasks.length === 0 ? (
				<div className="rise-in island-shell rounded-2xl p-8 text-center" style={{ animationDelay: "80ms" }}>
					<p className="text-sm" style={{ color: "var(--sea-ink-soft)" }}>
						{tab === "today" ? "No tasks due today." : tab === "done" ? "No completed tasks yet." : "No open tasks. Add one above!"}
					</p>
				</div>
			) : (
				<div className="rise-in space-y-2" style={{ animationDelay: "80ms" }}>
					{tasks.map((task) => (
						<div
							key={task._id}
							className="island-shell rounded-xl px-4 py-3 flex items-center gap-3"
						>
							<button
								type="button"
								onClick={() => task.status !== "done" && handleComplete(task._id)}
								className="shrink-0 transition-colors"
								style={{ color: task.status === "done" ? "var(--palm)" : "var(--sea-ink-soft)" }}
								aria-label="Complete task"
							>
								{task.status === "done" ? <CheckCircle2 size={20} /> : <Circle size={20} />}
							</button>
							<Link
								to="/tasks/$taskId"
								params={{ taskId: task._id }}
								className="flex-1 min-w-0"
							>
								<p
									className="text-sm font-medium truncate"
									style={{
										color: task.status === "done" ? "var(--sea-ink-soft)" : "var(--sea-ink)",
										textDecoration: task.status === "done" ? "line-through" : "none",
									}}
								>
									{task.title}
								</p>
								<div className="flex items-center gap-2 mt-0.5">
									<PriorityBadge priority={task.priority} />
									{task.dueAt && (
										<span className="text-xs" style={{ color: "var(--sea-ink-soft)" }}>
											{new Date(task.dueAt).toLocaleDateString()}
										</span>
									)}
								</div>
							</Link>
						</div>
					))}
				</div>
			)}
		</div>
	)
}

function PriorityBadge({ priority }: { priority: string }) {
	const map: Record<string, { color: string; bg: string }> = {
		urgent: { color: "#c83232", bg: "rgba(200,50,50,0.1)" },
		high: { color: "#e07000", bg: "rgba(224,112,0,0.1)" },
		medium: { color: "var(--lagoon)", bg: "rgba(0,108,140,0.1)" },
		low: { color: "var(--sea-ink-soft)", bg: "rgba(0,0,0,0.05)" },
	}
	const s = map[priority] ?? map.low
	return (
		<span className="text-[10px] font-semibold px-1.5 py-px rounded-full capitalize" style={{ background: s.bg, color: s.color }}>
			{priority}
		</span>
	)
}
