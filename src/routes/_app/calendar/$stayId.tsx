import { useConvexMutation, useConvexQuery } from "@convex-dev/react-query"
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { api } from "../../../../convex/_generated/api"
import type { Id } from "../../../../convex/_generated/dataModel"
import { ArrowLeft, CalendarDays, Loader2, Trash2, Users } from "lucide-react"
import { useState } from "react"
import { Button } from "#/components/ui/button"
import { Input } from "#/components/ui/input"
import { Label } from "#/components/ui/label"
import { Textarea } from "#/components/ui/textarea"

export const Route = createFileRoute("/_app/calendar/$stayId")({
	component: StayDetailPage,
})

function StayDetailPage() {
	const { stayId } = Route.useParams()
	const navigate = useNavigate()
	const stay = useConvexQuery(api.stays.get, { stayId: stayId as Id<"stays"> })
	const updateStay = useConvexMutation(api.stays.update)
	const cancelStay = useConvexMutation(api.stays.cancel)

	const [editing, setEditing] = useState(false)
	const [startDate, setStartDate] = useState("")
	const [endDate, setEndDate] = useState("")
	const [guestCount, setGuestCount] = useState("")
	const [notes, setNotes] = useState("")
	const [saving, setSaving] = useState(false)
	const [error, setError] = useState("")

	function startEdit() {
		if (!stay) return
		setStartDate(stay.startDate)
		setEndDate(stay.endDate)
		setGuestCount(String(stay.guestCount ?? ""))
		setNotes(stay.notes ?? "")
		setEditing(true)
	}

	async function handleSave(e: React.FormEvent) {
		e.preventDefault()
		setSaving(true)
		setError("")
		try {
			await updateStay({
				stayId: stayId as Id<"stays">,
				startDate,
				endDate,
				guestCount: guestCount ? parseInt(guestCount, 10) : undefined,
				notes: notes || undefined,
			})
			setEditing(false)
		} catch (err: unknown) {
			setError(err instanceof Error ? err.message : "Failed to save")
		} finally {
			setSaving(false)
		}
	}

	async function handleCancel() {
		if (!confirm("Cancel this stay?")) return
		await cancelStay({ stayId: stayId as Id<"stays"> })
		navigate({ to: "/calendar" })
	}

	if (stay === undefined) {
		return <div className="flex justify-center py-12"><Loader2 className="animate-spin" style={{ color: "var(--lagoon)" }} /></div>
	}
	if (!stay) {
		return <div className="page-wrap py-6"><p>Stay not found.</p></div>
	}

	return (
		<div className="page-wrap py-6 max-w-lg">
			<Link to="/calendar" className="inline-flex items-center gap-1.5 text-sm mb-4 font-medium" style={{ color: "var(--sea-ink-soft)" }}>
				<ArrowLeft size={14} /> Calendar
			</Link>

			<div className="rise-in island-shell rounded-2xl p-6">
				<div className="flex items-start justify-between mb-4">
					<div>
						<p className="island-kicker mb-1" style={{ color: "var(--kicker)" }}>Stay</p>
						<h1 className="display-title text-xl font-bold" style={{ color: "var(--sea-ink)" }}>
							{stay.startDate} — {stay.endDate}
						</h1>
					</div>
					<span
						className="text-xs font-semibold px-2.5 py-1 rounded-full capitalize"
						style={{
							background: stay.status === "confirmed" ? "rgba(47,106,74,0.1)" : stay.status === "cancelled" ? "rgba(200,50,50,0.1)" : "rgba(180,120,0,0.1)",
							color: stay.status === "confirmed" ? "var(--palm)" : stay.status === "cancelled" ? "#c83232" : "#b47800",
						}}
					>
						{stay.status}
					</span>
				</div>

				{editing ? (
					<form onSubmit={handleSave} className="space-y-4">
						<div className="grid grid-cols-2 gap-3">
							<div className="space-y-1.5">
								<Label className="text-xs font-semibold" style={{ color: "var(--sea-ink-soft)" }}>Check-in</Label>
								<Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required className="h-10" />
							</div>
							<div className="space-y-1.5">
								<Label className="text-xs font-semibold" style={{ color: "var(--sea-ink-soft)" }}>Check-out</Label>
								<Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required className="h-10" />
							</div>
						</div>
						<div className="space-y-1.5">
							<Label className="text-xs font-semibold" style={{ color: "var(--sea-ink-soft)" }}>Guests</Label>
							<Input type="number" min="1" value={guestCount} onChange={(e) => setGuestCount(e.target.value)} className="h-10" />
						</div>
						<div className="space-y-1.5">
							<Label className="text-xs font-semibold" style={{ color: "var(--sea-ink-soft)" }}>Notes</Label>
							<Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
						</div>
						{error && <p className="text-xs text-red-500">{error}</p>}
						<div className="flex gap-2">
							<Button type="button" variant="outline" onClick={() => setEditing(false)} className="flex-1">Cancel</Button>
							<Button type="submit" disabled={saving} className="flex-1" style={{ background: "linear-gradient(135deg, var(--palm), var(--lagoon-deep))", color: "white", border: "none" }}>
								{saving ? <Loader2 size={14} className="animate-spin" /> : "Save"}
							</Button>
						</div>
					</form>
				) : (
					<div className="space-y-3">
						<InfoRow icon={<CalendarDays size={15} />} label="Dates" value={`${stay.startDate} → ${stay.endDate}`} />
						{stay.guestCount && <InfoRow icon={<Users size={15} />} label="Guests" value={String(stay.guestCount)} />}
						{stay.notes && (
							<div className="rounded-xl px-4 py-3" style={{ background: "rgba(255,255,255,0.5)", border: "1px solid var(--line)" }}>
								<p className="text-xs font-semibold mb-1" style={{ color: "var(--sea-ink-soft)" }}>Notes</p>
								<p className="text-sm" style={{ color: "var(--sea-ink)" }}>{stay.notes}</p>
							</div>
						)}

						{stay.status !== "cancelled" && (
							<div className="flex gap-2 pt-2">
								<Button variant="outline" onClick={startEdit} className="flex-1">Edit</Button>
								<Button variant="destructive" onClick={handleCancel} size="sm" className="gap-1.5">
									<Trash2 size={14} /> Cancel stay
								</Button>
							</div>
						)}
					</div>
				)}
			</div>
		</div>
	)
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
	return (
		<div className="flex items-center gap-3 rounded-xl px-4 py-3" style={{ background: "rgba(255,255,255,0.5)", border: "1px solid var(--line)" }}>
			<span style={{ color: "var(--sea-ink-soft)" }}>{icon}</span>
			<div>
				<p className="text-xs font-semibold" style={{ color: "var(--sea-ink-soft)" }}>{label}</p>
				<p className="text-sm" style={{ color: "var(--sea-ink)" }}>{value}</p>
			</div>
		</div>
	)
}
