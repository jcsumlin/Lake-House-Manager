import { useConvexMutation, useConvexQuery } from "@convex-dev/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { api } from "../../../../convex/_generated/api"
import { useCurrentMember } from "#/lib/auth/useCurrentMember"
import { Loader2, Plus, Trash2 } from "lucide-react"
import { useState } from "react"
import { Button } from "#/components/ui/button"
import { Input } from "#/components/ui/input"
import { Label } from "#/components/ui/label"

export const Route = createFileRoute("/_app/tasks/templates")({
	component: TemplatesPage,
})

const CATEGORIES = [
	{ value: "check_in", label: "Check-in" },
	{ value: "check_out", label: "Check-out" },
	{ value: "opening", label: "Opening" },
	{ value: "closing", label: "Closing" },
	{ value: "seasonal", label: "Seasonal" },
	{ value: "custom", label: "Custom" },
] as const

function TemplatesPage() {
	const { property } = useCurrentMember()
	const templates = useConvexQuery(
		api.taskTemplates.list,
		property ? { propertyId: property._id } : "skip",
	)
	const createTemplate = useConvexMutation(api.taskTemplates.create)
	const removeTemplate = useConvexMutation(api.taskTemplates.remove)

	const [showForm, setShowForm] = useState(false)
	const [name, setName] = useState("")
	const [category, setCategory] = useState<typeof CATEGORIES[number]["value"]>("custom")
	const [items, setItems] = useState<string[]>([""])
	const [saving, setSaving] = useState(false)

	async function handleCreate(e: React.FormEvent) {
		e.preventDefault()
		if (!property) return
		setSaving(true)
		try {
			await createTemplate({
				propertyId: property._id,
				name,
				category,
				checklistItems: items
					.filter((i) => i.trim())
					.map((title, order) => ({ title: title.trim(), order })),
			})
			setName("")
			setItems([""])
			setShowForm(false)
		} finally {
			setSaving(false)
		}
	}

	return (
		<div className="page-wrap py-6">
			<div className="rise-in flex items-center justify-between mb-6">
				<div>
					<p className="island-kicker mb-1" style={{ color: "var(--kicker)" }}>Tasks</p>
					<h1 className="display-title text-2xl font-bold" style={{ color: "var(--sea-ink)" }}>Checklists</h1>
				</div>
				<Button
					size="sm"
					onClick={() => setShowForm(true)}
					style={{ background: "linear-gradient(135deg, var(--palm), var(--lagoon-deep))", color: "white", border: "none" }}
				>
					<Plus size={14} className="mr-1" /> New template
				</Button>
			</div>

			{showForm && (
				<form onSubmit={handleCreate} className="rise-in island-shell rounded-2xl p-5 mb-4 space-y-4">
					<div className="space-y-1.5">
						<Label className="text-xs font-semibold" style={{ color: "var(--sea-ink-soft)" }}>Template name</Label>
						<Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Arrival checklist" required className="h-10" />
					</div>
					<div className="space-y-1.5">
						<Label className="text-xs font-semibold" style={{ color: "var(--sea-ink-soft)" }}>Category</Label>
						<select
							value={category}
							onChange={(e) => setCategory(e.target.value as typeof category)}
							className="w-full h-10 rounded-lg border px-3 text-sm"
							style={{ background: "rgba(255,255,255,0.6)", borderColor: "var(--line)", color: "var(--sea-ink)" }}
						>
							{CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
						</select>
					</div>
					<div className="space-y-2">
						<Label className="text-xs font-semibold" style={{ color: "var(--sea-ink-soft)" }}>Checklist items</Label>
						{items.map((item, i) => (
							<div key={i} className="flex gap-2">
								<Input
									value={item}
									onChange={(e) => {
										const next = [...items]
										next[i] = e.target.value
										setItems(next)
									}}
									placeholder={`Item ${i + 1}`}
									className="h-9 flex-1"
								/>
								{items.length > 1 && (
									<Button type="button" size="icon-sm" variant="ghost" onClick={() => setItems(items.filter((_, idx) => idx !== i))}>
										×
									</Button>
								)}
							</div>
						))}
						<button type="button" onClick={() => setItems([...items, ""])} className="text-xs font-semibold" style={{ color: "var(--lagoon-deep)" }}>
							+ Add item
						</button>
					</div>
					<div className="flex gap-2">
						<Button type="button" variant="outline" onClick={() => setShowForm(false)} className="flex-1">Cancel</Button>
						<Button type="submit" disabled={saving || !name} className="flex-1" style={{ background: "var(--palm)", color: "white", border: "none" }}>
							{saving ? <Loader2 size={14} className="animate-spin" /> : "Create"}
						</Button>
					</div>
				</form>
			)}

			{templates === undefined ? (
				<div className="flex justify-center py-12"><Loader2 className="animate-spin" style={{ color: "var(--lagoon)" }} /></div>
			) : templates.length === 0 ? (
				<div className="rise-in island-shell rounded-2xl p-8 text-center">
					<p className="text-sm" style={{ color: "var(--sea-ink-soft)" }}>No templates yet. Create opening/closing checklists to apply to stays.</p>
				</div>
			) : (
				<div className="space-y-3">
					{templates.map((t) => (
						<div key={t._id} className="rise-in island-shell rounded-2xl p-5">
							<div className="flex items-start justify-between mb-2">
								<div>
									<p className="font-semibold text-sm" style={{ color: "var(--sea-ink)" }}>{t.name}</p>
									<p className="text-xs capitalize" style={{ color: "var(--sea-ink-soft)" }}>{t.category.replace("_", " ")}</p>
								</div>
								<Button
									size="icon-sm"
									variant="ghost"
									onClick={() => removeTemplate({ templateId: t._id })}
									style={{ color: "var(--sea-ink-soft)" }}
								>
									<Trash2 size={14} />
								</Button>
							</div>
							<ul className="space-y-1">
								{t.checklistItems.map((item, i) => (
									<li key={i} className="text-xs flex items-center gap-2" style={{ color: "var(--sea-ink-soft)" }}>
										<span className="size-1.5 rounded-full shrink-0" style={{ background: "var(--lagoon)" }} />
										{item.title}
									</li>
								))}
							</ul>
						</div>
					))}
				</div>
			)}
		</div>
	)
}
