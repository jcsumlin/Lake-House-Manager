import { useConvexMutation, useConvexQuery } from "@convex-dev/react-query"
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { api } from "../../../../convex/_generated/api"
import type { Id } from "../../../../convex/_generated/dataModel"
import { ArrowLeft, CheckCircle2, Loader2, Trash2 } from "lucide-react"
import { useState } from "react"
import { Button } from "#/components/ui/button"
import { Input } from "#/components/ui/input"
import { Label } from "#/components/ui/label"
import { Textarea } from "#/components/ui/textarea"

export const Route = createFileRoute("/_app/tasks/$taskId")({
	component: TaskDetailPage,
})

const PRIORITIES = ["low", "medium", "high", "urgent"] as const

function TaskDetailPage() {
	const { taskId } = Route.useParams()
	const navigate = useNavigate()
	const task = useConvexQuery(api.tasks.get, { taskId: taskId as Id<"tasks"> })
	const updateTask = useConvexMutation(api.tasks.update)
	const completeTask = useConvexMutation(api.tasks.complete)
	const removeTask = useConvexMutation(api.tasks.remove)

	const [editing, setEditing] = useState(false)
	const [title, setTitle] = useState("")
	const [description, setDescription] = useState("")
	const [priority, setPriority] = useState<(typeof PRIORITIES)[number]>("medium")
	const [dueDate, setDueDate] = useState("")
	const [saving, setSaving] = useState(false)

	function startEdit() {
		if (!task) return
		setTitle(task.title)
		setDescription(task.description ?? "")
		setPriority(task.priority as (typeof PRIORITIES)[number])
		setDueDate(task.dueAt ? new Date(task.dueAt).toISOString().slice(0, 16) : "")
		setEditing(true)
	}

	async function handleSave(e: React.FormEvent) {
		e.preventDefault()
		setSaving(true)
		try {
			await updateTask({
				taskId: taskId as Id<"tasks">,
				title: title.trim(),
				description: description.trim() || undefined,
				priority,
				dueAt: dueDate ? new Date(dueDate).getTime() : undefined,
			})
			setEditing(false)
		} finally {
			setSaving(false)
		}
	}

	async function handleComplete() {
		await completeTask({ taskId: taskId as Id<"tasks"> })
	}

	async function handleDelete() {
		if (!confirm("Delete this task?")) return
		await removeTask({ taskId: taskId as Id<"tasks"> })
		navigate({ to: "/tasks" })
	}

	if (task === undefined) return <div className="flex justify-center py-12"><Loader2 className="animate-spin" style={{ color: "var(--lagoon)" }} /></div>
	if (!task) return <div className="page-wrap py-6"><p>Task not found.</p></div>

	return (
		<div className="page-wrap py-6 max-w-lg">
			<Link to="/tasks" className="inline-flex items-center gap-1.5 text-sm mb-4 font-medium" style={{ color: "var(--sea-ink-soft)" }}>
				<ArrowLeft size={14} /> Tasks
			</Link>

			<div className="rise-in island-shell rounded-2xl p-6">
				{editing ? (
					<form onSubmit={handleSave} className="space-y-4">
						<div className="space-y-1.5">
							<Label className="text-xs font-semibold" style={{ color: "var(--sea-ink-soft)" }}>Title</Label>
							<Input value={title} onChange={(e) => setTitle(e.target.value)} required className="h-10" />
						</div>
						<div className="space-y-1.5">
							<Label className="text-xs font-semibold" style={{ color: "var(--sea-ink-soft)" }}>Description</Label>
							<Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
						</div>
						<div className="space-y-1.5">
							<Label className="text-xs font-semibold" style={{ color: "var(--sea-ink-soft)" }}>Priority</Label>
							<div className="flex gap-1">
								{PRIORITIES.map((p) => (
									<button
										key={p}
										type="button"
										onClick={() => setPriority(p)}
										className="flex-1 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all"
										style={{
											background: priority === p ? "rgba(47,106,74,0.15)" : "rgba(0,0,0,0.04)",
											color: priority === p ? "var(--palm)" : "var(--sea-ink-soft)",
											border: `1px solid ${priority === p ? "rgba(47,106,74,0.3)" : "var(--line)"}`,
										}}
									>
										{p}
									</button>
								))}
							</div>
						</div>
						<div className="space-y-1.5">
							<Label className="text-xs font-semibold" style={{ color: "var(--sea-ink-soft)" }}>Due date (optional)</Label>
							<Input type="datetime-local" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="h-10" />
						</div>
						<div className="flex gap-2">
							<Button type="button" variant="outline" onClick={() => setEditing(false)} className="flex-1">Cancel</Button>
							<Button type="submit" disabled={saving} className="flex-1" style={{ background: "var(--palm)", color: "white", border: "none" }}>
								{saving ? <Loader2 size={14} className="animate-spin" /> : "Save"}
							</Button>
						</div>
					</form>
				) : (
					<div>
						<div className="flex items-start gap-3 mb-4">
							<button
								type="button"
								onClick={() => task.status !== "done" && handleComplete()}
								style={{ color: task.status === "done" ? "var(--palm)" : "var(--sea-ink-soft)" }}
								className="shrink-0 mt-0.5"
							>
								<CheckCircle2 size={22} />
							</button>
							<div className="flex-1">
								<h1
									className="display-title text-xl font-bold"
									style={{
										color: task.status === "done" ? "var(--sea-ink-soft)" : "var(--sea-ink)",
										textDecoration: task.status === "done" ? "line-through" : "none",
									}}
								>
									{task.title}
								</h1>
								{task.description && (
									<p className="text-sm mt-1" style={{ color: "var(--sea-ink-soft)" }}>{task.description}</p>
								)}
							</div>
						</div>

						<div className="grid grid-cols-2 gap-2 mb-4">
							<InfoChip label="Priority" value={task.priority} />
							<InfoChip label="Status" value={task.status} />
							{task.dueAt && <InfoChip label="Due" value={new Date(task.dueAt).toLocaleDateString()} />}
							<InfoChip label="Type" value={task.type} />
						</div>

						{task.status !== "done" && (
							<div className="flex gap-2">
								<Button variant="outline" onClick={startEdit} className="flex-1">Edit</Button>
								<Button variant="outline" onClick={handleComplete} className="flex-1 gap-1.5" style={{ color: "var(--palm)", borderColor: "rgba(47,106,74,0.3)" }}>
									<CheckCircle2 size={14} /> Complete
								</Button>
								<Button variant="ghost" size="icon-sm" onClick={handleDelete} style={{ color: "var(--sea-ink-soft)" }}>
									<Trash2 size={14} />
								</Button>
							</div>
						)}
					</div>
				)}
			</div>
		</div>
	)
}

function InfoChip({ label, value }: { label: string; value: string }) {
	return (
		<div className="rounded-xl px-3 py-2" style={{ background: "rgba(255,255,255,0.5)", border: "1px solid var(--line)" }}>
			<p className="text-xs font-semibold mb-0.5 capitalize" style={{ color: "var(--sea-ink-soft)" }}>{label}</p>
			<p className="text-sm font-medium capitalize" style={{ color: "var(--sea-ink)" }}>{value.replace("_", " ")}</p>
		</div>
	)
}
