import { useConvexMutation } from "@convex-dev/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { api } from "../../../../convex/_generated/api"
import { useCurrentMember } from "#/lib/auth/useCurrentMember"
import { Loader2 } from "lucide-react"
import { useState } from "react"
import { Button } from "#/components/ui/button"
import { Input } from "#/components/ui/input"
import { Label } from "#/components/ui/label"
import { Textarea } from "#/components/ui/textarea"

export const Route = createFileRoute("/_app/calendar/new")({
	component: NewStayPage,
})

function NewStayPage() {
	const { property } = useCurrentMember()
	const navigate = useNavigate()
	const createStay = useConvexMutation(api.stays.create)

	const today = new Date().toISOString().slice(0, 10)
	const [startDate, setStartDate] = useState(today)
	const [endDate, setEndDate] = useState(today)
	const [guestCount, setGuestCount] = useState("1")
	const [status, setStatus] = useState<"confirmed" | "tentative">("confirmed")
	const [notes, setNotes] = useState("")
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState("")

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault()
		if (!property) return
		if (startDate > endDate) {
			setError("End date must be on or after start date")
			return
		}
		setLoading(true)
		setError("")
		try {
			const stayId = await createStay({
				propertyId: property._id,
				startDate,
				endDate,
				status,
				guestCount: guestCount ? parseInt(guestCount, 10) : undefined,
				notes: notes || undefined,
			})
			navigate({ to: "/calendar/$stayId", params: { stayId } })
		} catch (err: unknown) {
			setError(err instanceof Error ? err.message : "Failed to create stay")
		} finally {
			setLoading(false)
		}
	}

	return (
		<div className="page-wrap py-6 max-w-lg">
			<div className="rise-in mb-6">
				<p className="island-kicker mb-1" style={{ color: "var(--kicker)" }}>Calendar</p>
				<h1 className="display-title text-2xl font-bold" style={{ color: "var(--sea-ink)" }}>New stay</h1>
			</div>

			<form onSubmit={handleSubmit} className="rise-in island-shell rounded-2xl p-6 space-y-4" style={{ animationDelay: "60ms" }}>
				<div className="grid grid-cols-2 gap-4">
					<div className="space-y-1.5">
						<Label htmlFor="start-date" className="text-xs font-semibold" style={{ color: "var(--sea-ink-soft)" }}>Check-in</Label>
						<Input id="start-date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required className="h-11" />
					</div>
					<div className="space-y-1.5">
						<Label htmlFor="end-date" className="text-xs font-semibold" style={{ color: "var(--sea-ink-soft)" }}>Check-out</Label>
						<Input id="end-date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required className="h-11" />
					</div>
				</div>

				<div className="space-y-1.5">
					<Label htmlFor="guest-count" className="text-xs font-semibold" style={{ color: "var(--sea-ink-soft)" }}>Number of guests</Label>
					<Input id="guest-count" type="number" min="1" value={guestCount} onChange={(e) => setGuestCount(e.target.value)} className="h-11" />
				</div>

				<div className="space-y-1.5">
					<Label className="text-xs font-semibold" style={{ color: "var(--sea-ink-soft)" }}>Status</Label>
					<div className="flex gap-2">
						{(["confirmed", "tentative"] as const).map((s) => (
							<button
								key={s}
								type="button"
								onClick={() => setStatus(s)}
								className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all capitalize"
								style={{
									background: status === s ? (s === "confirmed" ? "rgba(47,106,74,0.15)" : "rgba(180,120,0,0.15)") : "rgba(0,0,0,0.04)",
									color: status === s ? (s === "confirmed" ? "var(--palm)" : "#b47800") : "var(--sea-ink-soft)",
									border: `1px solid ${status === s ? (s === "confirmed" ? "rgba(47,106,74,0.3)" : "rgba(180,120,0,0.3)") : "var(--line)"}`,
								}}
							>
								{s}
							</button>
						))}
					</div>
				</div>

				<div className="space-y-1.5">
					<Label htmlFor="notes" className="text-xs font-semibold" style={{ color: "var(--sea-ink-soft)" }}>Notes (optional)</Label>
					<Textarea id="notes" placeholder="Who's coming, any special plans…" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
				</div>

				{error && <p className="text-xs text-red-500">{error}</p>}

				<div className="flex gap-2 pt-2">
					<Button type="button" variant="outline" onClick={() => navigate({ to: "/calendar" })} className="flex-1">
						Cancel
					</Button>
					<Button
						type="submit"
						disabled={loading || !property}
						className="flex-1"
						style={{ background: "linear-gradient(135deg, var(--palm), var(--lagoon-deep))", color: "white", border: "none" }}
					>
						{loading ? <Loader2 size={16} className="animate-spin" /> : "Book stay"}
					</Button>
				</div>
			</form>
		</div>
	)
}
