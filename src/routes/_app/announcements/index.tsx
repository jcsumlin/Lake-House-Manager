import { useConvexMutation, useConvexQuery } from "@convex-dev/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { api } from "../../../../convex/_generated/api"
import type { Id } from "../../../../convex/_generated/dataModel"
import { useCurrentMember, canManageProperty, type MemberRole } from "#/lib/auth/useCurrentMember"
import { Loader2, Megaphone, Pin, PinOff, Plus, Trash2 } from "lucide-react"
import { useState } from "react"
import { Button } from "#/components/ui/button"
import { Input } from "#/components/ui/input"
import { Label } from "#/components/ui/label"
import { Textarea } from "#/components/ui/textarea"
import { Switch } from "#/components/ui/switch"

export const Route = createFileRoute("/_app/announcements/")({
	component: AnnouncementsPage,
})

function AnnouncementsPage() {
	const { property, membership } = useCurrentMember()
	const announcements = useConvexQuery(
		api.announcements.list,
		property ? { propertyId: property._id } : "skip",
	)
	const createAnnouncement = useConvexMutation(api.announcements.create)
	const removeAnnouncement = useConvexMutation(api.announcements.remove)
	const pinAnnouncement = useConvexMutation(api.announcements.pin)

	const canManage = canManageProperty(membership?.role as MemberRole | undefined)
	const [showForm, setShowForm] = useState(false)
	const [title, setTitle] = useState("")
	const [body, setBody] = useState("")
	const [pinned, setPinned] = useState(false)
	const [saving, setSaving] = useState(false)

	async function handleCreate(e: React.FormEvent) {
		e.preventDefault()
		if (!property) return
		setSaving(true)
		try {
			await createAnnouncement({ propertyId: property._id, title, body, pinned })
			setTitle(""); setBody(""); setPinned(false)
			setShowForm(false)
		} finally {
			setSaving(false)
		}
	}

	const pinned_items = (announcements ?? []).filter((a) => a.pinned)
	const unpinned_items = (announcements ?? []).filter((a) => !a.pinned)
	const sorted = [...pinned_items, ...unpinned_items]

	return (
		<div className="page-wrap py-6">
			<div className="rise-in flex items-center justify-between mb-6">
				<div>
					<p className="island-kicker mb-1" style={{ color: "var(--kicker)" }}>Feed</p>
					<h1 className="display-title text-2xl font-bold" style={{ color: "var(--sea-ink)" }}>Announcements</h1>
				</div>
				{canManage && (
					<Button size="sm" onClick={() => setShowForm(true)} style={{ background: "linear-gradient(135deg, var(--palm), var(--lagoon-deep))", color: "white", border: "none" }}>
						<Plus size={14} className="mr-1" /> Post
					</Button>
				)}
			</div>

			{showForm && (
				<form onSubmit={handleCreate} className="rise-in island-shell rounded-2xl p-5 mb-4 space-y-3">
					<div className="space-y-1.5">
						<Label className="text-xs font-semibold" style={{ color: "var(--sea-ink-soft)" }}>Title</Label>
						<Input value={title} onChange={(e) => setTitle(e.target.value)} required className="h-10" placeholder="Important update" />
					</div>
					<div className="space-y-1.5">
						<Label className="text-xs font-semibold" style={{ color: "var(--sea-ink-soft)" }}>Message</Label>
						<Textarea value={body} onChange={(e) => setBody(e.target.value)} required rows={3} placeholder="Heads up — the dock is being repaired next weekend." />
					</div>
					<div className="flex items-center justify-between">
						<Label className="text-xs font-semibold" style={{ color: "var(--sea-ink-soft)" }}>Pin to top</Label>
						<Switch checked={pinned} onCheckedChange={setPinned} />
					</div>
					<div className="flex gap-2">
						<Button type="button" variant="outline" onClick={() => setShowForm(false)} className="flex-1">Cancel</Button>
						<Button type="submit" disabled={saving || !title || !body} className="flex-1" style={{ background: "var(--palm)", color: "white", border: "none" }}>
							{saving ? <Loader2 size={14} className="animate-spin" /> : "Post"}
						</Button>
					</div>
				</form>
			)}

			{announcements === undefined ? (
				<div className="flex justify-center py-12"><Loader2 className="animate-spin" style={{ color: "var(--lagoon)" }} /></div>
			) : sorted.length === 0 ? (
				<div className="rise-in island-shell rounded-2xl p-8 text-center">
					<Megaphone size={28} className="mx-auto mb-3" style={{ color: "var(--sea-ink-soft)" }} />
					<p className="text-sm" style={{ color: "var(--sea-ink-soft)" }}>No announcements yet.</p>
				</div>
			) : (
				<div className="rise-in space-y-3" style={{ animationDelay: "60ms" }}>
					{sorted.map((a) => (
						<div
							key={a._id}
							className="island-shell rounded-2xl px-5 py-4"
							style={{
								background: a.pinned ? "rgba(47,106,74,0.04)" : undefined,
								border: a.pinned ? "1px solid rgba(47,106,74,0.15)" : undefined,
							}}
						>
							<div className="flex items-start justify-between gap-3 mb-2">
								<div className="flex items-center gap-2">
									{a.pinned && <Megaphone size={14} style={{ color: "var(--palm)", flexShrink: 0 }} />}
									<h3 className="font-semibold text-sm" style={{ color: "var(--sea-ink)" }}>{a.title}</h3>
								</div>
								{canManage && (
									<div className="flex items-center gap-1 shrink-0">
										<Button
											size="icon-xs"
											variant="ghost"
											onClick={() => pinAnnouncement({ announcementId: a._id as Id<"announcements">, pinned: !a.pinned })}
											style={{ color: a.pinned ? "var(--palm)" : "var(--sea-ink-soft)" }}
										>
											{a.pinned ? <PinOff size={12} /> : <Pin size={12} />}
										</Button>
										<Button
											size="icon-xs"
											variant="ghost"
											onClick={() => removeAnnouncement({ announcementId: a._id as Id<"announcements"> })}
											style={{ color: "var(--sea-ink-soft)" }}
										>
											<Trash2 size={12} />
										</Button>
									</div>
								)}
							</div>
							<p className="text-sm" style={{ color: "var(--sea-ink-soft)" }}>{a.body}</p>
							<p className="text-xs mt-2" style={{ color: "var(--sea-ink-soft)", opacity: 0.6 }}>
								{new Date(a._creationTime).toLocaleDateString()}
							</p>
						</div>
					))}
				</div>
			)}
		</div>
	)
}
