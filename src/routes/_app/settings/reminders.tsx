import { useConvexMutation, useConvexQuery } from "@convex-dev/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { api } from "../../../../convex/_generated/api"
import { useCurrentMember } from "#/lib/auth/useCurrentMember"
import { Bell, CalendarClock, Loader2 } from "lucide-react"
import { useState } from "react"
import { Button } from "#/components/ui/button"

export const Route = createFileRoute("/_app/settings/reminders")({
	component: RemindersSettingsPage,
})

function RemindersSettingsPage() {
	const { property } = useCurrentMember()
	const [reminderDays, setReminderDays] = useState<string>("")
	const [saving, setSaving] = useState(false)
	const [saved, setSaved] = useState(false)

	const upcomingStays = useConvexQuery(
		api.smartReminders.listUpcomingReminders,
		property ? { propertyId: property._id } : "skip",
	)

	const updatePropertyMutation = useConvexMutation(api.properties.update)

	const currentDays = property?.preArrivalReminderDays ?? 3
	const displayDays = reminderDays !== "" ? Number(reminderDays) : currentDays

	async function handleSave() {
		if (!property) return
		setSaving(true)
		try {
			await updatePropertyMutation({
				propertyId: property._id,
				preArrivalReminderDays: displayDays,
			})
			setSaved(true)
			setTimeout(() => setSaved(false), 2000)
		} finally {
			setSaving(false)
		}
	}

	return (
		<div className="page-wrap py-6 space-y-5 max-w-lg">
			<div className="rise-in">
				<p className="island-kicker mb-1" style={{ color: "var(--kicker)" }}>Settings</p>
				<h1 className="display-title text-2xl font-bold" style={{ color: "var(--sea-ink)" }}>Reminders</h1>
			</div>

			{/* Pre-arrival config */}
			<div className="rise-in island-shell rounded-2xl p-5" style={{ animationDelay: "40ms" }}>
				<div className="flex items-center gap-3 mb-4">
					<Bell size={18} style={{ color: "var(--lagoon)" }} />
					<div>
						<p className="text-sm font-semibold" style={{ color: "var(--sea-ink)" }}>Pre-Arrival Reminder</p>
						<p className="text-xs" style={{ color: "var(--sea-ink-soft)" }}>How many days before a stay to create check-in tasks</p>
					</div>
				</div>

				<div className="flex items-center gap-3">
					<input
						type="number"
						className="w-20 px-3 py-2 rounded-lg text-sm border text-center"
						style={{ background: "var(--surface-strong)", color: "var(--sea-ink)", borderColor: "var(--line)" }}
						value={reminderDays !== "" ? reminderDays : currentDays}
						onChange={(e) => setReminderDays(e.target.value)}
						min={0}
						max={30}
					/>
					<span className="text-sm" style={{ color: "var(--sea-ink-soft)" }}>days before arrival</span>
				</div>

				<Button
					size="sm"
					onClick={handleSave}
					disabled={saving}
					className="mt-4"
					style={{ background: saved ? "var(--palm)" : "var(--lagoon)", color: "white", border: "none" }}
				>
					{saving ? <Loader2 size={14} className="animate-spin" /> : saved ? "Saved!" : "Save"}
				</Button>
			</div>

			{/* Upcoming stays with reminders */}
			<div className="rise-in island-shell rounded-2xl p-4" style={{ animationDelay: "80ms" }}>
				<div className="flex items-center gap-2 mb-3">
					<CalendarClock size={16} style={{ color: "var(--lagoon)" }} />
					<span className="text-sm font-semibold" style={{ color: "var(--sea-ink)" }}>Upcoming Stays</span>
				</div>

				{upcomingStays === undefined ? (
					<div className="flex justify-center py-4"><Loader2 size={18} className="animate-spin" style={{ color: "var(--lagoon)" }} /></div>
				) : upcomingStays.length === 0 ? (
					<p className="text-sm" style={{ color: "var(--sea-ink-soft)" }}>No upcoming stays in the next 14 days.</p>
				) : (
					<div className="space-y-2">
						{upcomingStays.map((stay) => (
							<div key={stay._id} className="flex items-center justify-between text-sm">
								<span style={{ color: "var(--sea-ink)" }}>{stay.startDate} → {stay.endDate}</span>
								<span
									className="text-[10px] px-2 py-0.5 rounded-full"
									style={{
										background: stay.reminderScheduledAt ? "rgba(47,106,74,0.1)" : "rgba(0,0,0,0.05)",
										color: stay.reminderScheduledAt ? "var(--palm)" : "var(--sea-ink-soft)",
									}}
								>
									{stay.reminderScheduledAt ? "Reminder set" : "Pending"}
								</span>
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	)
}
