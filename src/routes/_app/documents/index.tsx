import { useConvexMutation, useConvexQuery } from "@convex-dev/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { api } from "../../../../convex/_generated/api"
import type { Id } from "../../../../convex/_generated/dataModel"
import { useCurrentMember, canManageProperty, type MemberRole } from "#/lib/auth/useCurrentMember"
import { FileText, Loader2, Plus, Trash2 } from "lucide-react"
import { useState } from "react"
import { Button } from "#/components/ui/button"
import { Input } from "#/components/ui/input"
import { Label } from "#/components/ui/label"
import { Textarea } from "#/components/ui/textarea"

export const Route = createFileRoute("/_app/documents/")({
	component: DocumentsPage,
})

const CATEGORIES = [
	{ value: "guide", label: "House Guide" },
	{ value: "manual", label: "Manuals" },
	{ value: "permit", label: "Permits" },
	{ value: "insurance", label: "Insurance" },
	{ value: "contact", label: "Contacts" },
	{ value: "rules", label: "Rules" },
	{ value: "other", label: "Other" },
] as const

function DocumentsPage() {
	const { property, membership } = useCurrentMember()
	const docs = useConvexQuery(
		api.documents.list,
		property ? { propertyId: property._id } : "skip",
	)
	const createDoc = useConvexMutation(api.documents.create)
	const removeDoc = useConvexMutation(api.documents.remove)

	const canManage = canManageProperty(membership?.role as MemberRole | undefined)
	const [showForm, setShowForm] = useState(false)
	const [title, setTitle] = useState("")
	const [category, setCategory] = useState<typeof CATEGORIES[number]["value"]>("guide")
	const [content, setContent] = useState("")
	const [visibility, setVisibility] = useState<"all" | "admins">("all")
	const [saving, setSaving] = useState(false)

	async function handleCreate(e: React.FormEvent) {
		e.preventDefault()
		if (!property) return
		setSaving(true)
		try {
			await createDoc({ propertyId: property._id, title, category, content: content || undefined, visibility })
			setTitle("")
			setContent("")
			setShowForm(false)
		} finally {
			setSaving(false)
		}
	}

	const grouped = CATEGORIES.map((cat) => ({
		...cat,
		items: (docs ?? []).filter((d) => d.category === cat.value),
	})).filter((g) => g.items.length > 0)

	return (
		<div className="page-wrap py-6">
			<div className="rise-in flex items-center justify-between mb-6">
				<div>
					<p className="island-kicker mb-1" style={{ color: "var(--kicker)" }}>Documents</p>
					<h1 className="display-title text-2xl font-bold" style={{ color: "var(--sea-ink)" }}>House guide</h1>
				</div>
				{canManage && (
					<Button size="sm" onClick={() => setShowForm(true)} style={{ background: "linear-gradient(135deg, var(--palm), var(--lagoon-deep))", color: "white", border: "none" }}>
						<Plus size={14} className="mr-1" /> Add
					</Button>
				)}
			</div>

			{showForm && (
				<form onSubmit={handleCreate} className="rise-in island-shell rounded-2xl p-5 mb-4 space-y-3">
					<div className="space-y-1.5">
						<Label className="text-xs font-semibold" style={{ color: "var(--sea-ink-soft)" }}>Title</Label>
						<Input value={title} onChange={(e) => setTitle(e.target.value)} required className="h-10" />
					</div>
					<div className="space-y-1.5">
						<Label className="text-xs font-semibold" style={{ color: "var(--sea-ink-soft)" }}>Category</Label>
						<select value={category} onChange={(e) => setCategory(e.target.value as typeof category)} className="w-full h-10 rounded-lg border px-3 text-sm" style={{ background: "rgba(255,255,255,0.6)", borderColor: "var(--line)", color: "var(--sea-ink)" }}>
							{CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
						</select>
					</div>
					<div className="space-y-1.5">
						<Label className="text-xs font-semibold" style={{ color: "var(--sea-ink-soft)" }}>Content (markdown)</Label>
						<Textarea value={content} onChange={(e) => setContent(e.target.value)} rows={4} placeholder="Wi-Fi: NetworkName / Password123…" />
					</div>
					<div className="flex gap-2">
						{(["all", "admins"] as const).map((v) => (
							<button key={v} type="button" onClick={() => setVisibility(v)} className="flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all" style={{ background: visibility === v ? "rgba(47,106,74,0.15)" : "rgba(0,0,0,0.04)", color: visibility === v ? "var(--palm)" : "var(--sea-ink-soft)", border: `1px solid ${visibility === v ? "rgba(47,106,74,0.3)" : "var(--line)"}` }}>
								{v === "all" ? "Everyone" : "Admins only"}
							</button>
						))}
					</div>
					<div className="flex gap-2">
						<Button type="button" variant="outline" onClick={() => setShowForm(false)} className="flex-1">Cancel</Button>
						<Button type="submit" disabled={saving || !title} className="flex-1" style={{ background: "var(--palm)", color: "white", border: "none" }}>
							{saving ? <Loader2 size={14} className="animate-spin" /> : "Create"}
						</Button>
					</div>
				</form>
			)}

			{docs === undefined ? (
				<div className="flex justify-center py-12"><Loader2 className="animate-spin" style={{ color: "var(--lagoon)" }} /></div>
			) : grouped.length === 0 ? (
				<div className="rise-in island-shell rounded-2xl p-8 text-center">
					<p className="text-sm" style={{ color: "var(--sea-ink-soft)" }}>No documents yet. Add house guides, manuals, and important info here.</p>
				</div>
			) : (
				<div className="space-y-4">
					{grouped.map((group) => (
						<div key={group.value}>
							<p className="island-kicker mb-2 px-1" style={{ color: "var(--kicker)" }}>{group.label}</p>
							<div className="space-y-2">
								{group.items.map((doc) => (
									<div key={doc._id} className="rise-in island-shell rounded-xl px-4 py-3 flex items-center gap-3">
										<FileText size={16} style={{ color: "var(--lagoon)", flexShrink: 0 }} />
										<div className="flex-1 min-w-0">
											<p className="text-sm font-semibold truncate" style={{ color: "var(--sea-ink)" }}>{doc.title}</p>
											{doc.visibility === "admins" && (
												<span className="text-[10px] font-semibold px-1.5 py-px rounded-full" style={{ background: "rgba(0,0,0,0.06)", color: "var(--sea-ink-soft)" }}>Admins only</span>
											)}
										</div>
										{canManage && (
											<Button size="icon-sm" variant="ghost" onClick={() => removeDoc({ documentId: doc._id as Id<"documents"> })} style={{ color: "var(--sea-ink-soft)" }}>
												<Trash2 size={14} />
											</Button>
										)}
									</div>
								))}
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	)
}
