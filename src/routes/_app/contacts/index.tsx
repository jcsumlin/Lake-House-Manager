import { useConvexMutation, useConvexQuery } from "@convex-dev/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { api } from "../../../../convex/_generated/api"
import type { Id } from "../../../../convex/_generated/dataModel"
import { useCurrentMember } from "#/lib/auth/useCurrentMember"
import { Loader2, Mail, Phone, Plus, Trash2 } from "lucide-react"
import { useState } from "react"
import { Button } from "#/components/ui/button"
import { Input } from "#/components/ui/input"
import { Label } from "#/components/ui/label"

export const Route = createFileRoute("/_app/contacts/")({
	component: ContactsPage,
})

const TYPE_LABELS: Record<string, string> = {
	emergency: "Emergency",
	vendor: "Vendors",
	utility: "Utilities",
	neighbor: "Neighbors",
	family: "Family",
	other: "Other",
}

const CONTACT_TYPES = Object.entries(TYPE_LABELS).map(([value, label]) => ({ value, label })) as { value: "emergency" | "vendor" | "utility" | "neighbor" | "family" | "other"; label: string }[]

function ContactsPage() {
	const { property } = useCurrentMember()
	const contacts = useConvexQuery(
		api.contacts.list,
		property ? { propertyId: property._id } : "skip",
	)
	const createContact = useConvexMutation(api.contacts.create)
	const removeContact = useConvexMutation(api.contacts.remove)

	const [showForm, setShowForm] = useState(false)
	const [name, setName] = useState("")
	const [type, setType] = useState<typeof CONTACT_TYPES[number]["value"]>("vendor")
	const [phone, setPhone] = useState("")
	const [email, setEmail] = useState("")
	const [notes, setNotes] = useState("")
	const [saving, setSaving] = useState(false)

	async function handleCreate(e: React.FormEvent) {
		e.preventDefault()
		if (!property) return
		setSaving(true)
		try {
			await createContact({ propertyId: property._id, name, type, phone: phone || undefined, email: email || undefined, notes: notes || undefined })
			setName(""); setPhone(""); setEmail(""); setNotes("")
			setShowForm(false)
		} finally {
			setSaving(false)
		}
	}

	const grouped = CONTACT_TYPES.map((t) => ({
		...t,
		items: (contacts ?? []).filter((c) => c.type === t.value),
	})).filter((g) => g.items.length > 0)

	return (
		<div className="page-wrap py-6">
			<div className="rise-in flex items-center justify-between mb-6">
				<div>
					<p className="island-kicker mb-1" style={{ color: "var(--kicker)" }}>Directory</p>
					<h1 className="display-title text-2xl font-bold" style={{ color: "var(--sea-ink)" }}>Contacts</h1>
				</div>
				<Button size="sm" onClick={() => setShowForm(true)} style={{ background: "linear-gradient(135deg, var(--palm), var(--lagoon-deep))", color: "white", border: "none" }}>
					<Plus size={14} className="mr-1" /> Add
				</Button>
			</div>

			{showForm && (
				<form onSubmit={handleCreate} className="rise-in island-shell rounded-2xl p-5 mb-4 space-y-3">
					<div className="grid grid-cols-2 gap-3">
						<div className="space-y-1.5 col-span-2">
							<Label className="text-xs font-semibold" style={{ color: "var(--sea-ink-soft)" }}>Name</Label>
							<Input value={name} onChange={(e) => setName(e.target.value)} required className="h-10" placeholder="Bob's Plumbing" />
						</div>
						<div className="space-y-1.5">
							<Label className="text-xs font-semibold" style={{ color: "var(--sea-ink-soft)" }}>Phone</Label>
							<Input value={phone} onChange={(e) => setPhone(e.target.value)} className="h-10" type="tel" placeholder="555-0100" />
						</div>
						<div className="space-y-1.5">
							<Label className="text-xs font-semibold" style={{ color: "var(--sea-ink-soft)" }}>Email</Label>
							<Input value={email} onChange={(e) => setEmail(e.target.value)} className="h-10" type="email" />
						</div>
					</div>
					<div className="space-y-1.5">
						<Label className="text-xs font-semibold" style={{ color: "var(--sea-ink-soft)" }}>Type</Label>
						<div className="flex flex-wrap gap-1">
							{CONTACT_TYPES.map((t) => (
								<button key={t.value} type="button" onClick={() => setType(t.value)} className="px-2.5 py-1 rounded-full text-xs font-semibold transition-all" style={{ background: type === t.value ? "rgba(47,106,74,0.15)" : "rgba(0,0,0,0.05)", color: type === t.value ? "var(--palm)" : "var(--sea-ink-soft)", border: `1px solid ${type === t.value ? "rgba(47,106,74,0.3)" : "var(--line)"}` }}>
									{t.label}
								</button>
							))}
						</div>
					</div>
					<div className="flex gap-2">
						<Button type="button" variant="outline" onClick={() => setShowForm(false)} className="flex-1">Cancel</Button>
						<Button type="submit" disabled={saving || !name} className="flex-1" style={{ background: "var(--palm)", color: "white", border: "none" }}>
							{saving ? <Loader2 size={14} className="animate-spin" /> : "Add contact"}
						</Button>
					</div>
				</form>
			)}

			{contacts === undefined ? (
				<div className="flex justify-center py-12"><Loader2 className="animate-spin" style={{ color: "var(--lagoon)" }} /></div>
			) : grouped.length === 0 ? (
				<div className="rise-in island-shell rounded-2xl p-8 text-center">
					<p className="text-sm" style={{ color: "var(--sea-ink-soft)" }}>No contacts yet. Add emergency numbers, vendors, and neighbors here.</p>
				</div>
			) : (
				<div className="space-y-4">
					{grouped.map((group) => (
						<div key={group.value}>
							<p className="island-kicker mb-2 px-1" style={{ color: "var(--kicker)" }}>{group.label}</p>
							<div className="space-y-2">
								{group.items.map((contact) => (
									<div key={contact._id} className="rise-in island-shell rounded-xl px-4 py-3 flex items-center gap-3">
										<div className="flex-1 min-w-0">
											<p className="text-sm font-semibold" style={{ color: "var(--sea-ink)" }}>{contact.name}</p>
											<div className="flex items-center gap-3 mt-0.5">
												{contact.phone && (
													<a href={`tel:${contact.phone}`} className="flex items-center gap-1 text-xs font-medium" style={{ color: "var(--lagoon-deep)" }}>
														<Phone size={11} />{contact.phone}
													</a>
												)}
												{contact.email && (
													<a href={`mailto:${contact.email}`} className="flex items-center gap-1 text-xs font-medium" style={{ color: "var(--lagoon-deep)" }}>
														<Mail size={11} />{contact.email}
													</a>
												)}
											</div>
											{contact.notes && <p className="text-xs mt-0.5" style={{ color: "var(--sea-ink-soft)" }}>{contact.notes}</p>}
										</div>
										<Button size="icon-sm" variant="ghost" onClick={() => removeContact({ contactId: contact._id as Id<"contacts"> })} style={{ color: "var(--sea-ink-soft)" }}>
											<Trash2 size={14} />
										</Button>
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
