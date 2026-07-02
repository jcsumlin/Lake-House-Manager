import { useConvexMutation } from "@convex-dev/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { api } from "../../../../convex/_generated/api"
import { useCurrentMember } from "#/lib/auth/useCurrentMember"
import { CloudLightning, Loader2, Phone, Thermometer } from "lucide-react"
import { useState } from "react"
import { Button } from "#/components/ui/button"

export const Route = createFileRoute("/_app/settings/weather")({
	component: WeatherSettingsPage,
})

function WeatherSettingsPage() {
	const { property } = useCurrentMember()
	const updateMutation = useConvexMutation(api.properties.update)

	const [lat, setLat] = useState<string>(property?.weatherApiLat?.toString() ?? "")
	const [lon, setLon] = useState<string>(property?.weatherApiLon?.toString() ?? "")
	const [freezeThreshold, setFreezeThreshold] = useState<string>(
		property?.freezeThresholdF?.toString() ?? "36",
	)
	const [alertsEnabled, setAlertsEnabled] = useState(property?.weatherAlertsEnabled ?? false)
	const [cleaningName, setCleaningName] = useState(property?.cleaningServiceName ?? "")
	const [cleaningPhone, setCleaningPhone] = useState(property?.cleaningServicePhone ?? "")
	const [cleaningInstructions, setCleaningInstructions] = useState(property?.cleaningServiceInstructions ?? "")
	const [saving, setSaving] = useState(false)
	const [saved, setSaved] = useState(false)

	async function handleSave() {
		if (!property) return
		setSaving(true)
		try {
			await updateMutation({
				propertyId: property._id,
				weatherApiLat: lat ? Number(lat) : undefined,
				weatherApiLon: lon ? Number(lon) : undefined,
				freezeThresholdF: freezeThreshold ? Number(freezeThreshold) : undefined,
				weatherAlertsEnabled: alertsEnabled,
				cleaningServiceName: cleaningName || undefined,
				cleaningServicePhone: cleaningPhone || undefined,
				cleaningServiceInstructions: cleaningInstructions || undefined,
			})
			setSaved(true)
			setTimeout(() => setSaved(false), 2000)
		} finally {
			setSaving(false)
		}
	}

	const fieldClass = "w-full px-3 py-2 rounded-lg text-sm border"
	const fieldStyle = { background: "var(--surface-strong)", color: "var(--sea-ink)", borderColor: "var(--line)" }

	return (
		<div className="page-wrap py-6 space-y-5 max-w-lg">
			<div className="rise-in">
				<p className="island-kicker mb-1" style={{ color: "var(--kicker)" }}>Settings</p>
				<h1 className="display-title text-2xl font-bold" style={{ color: "var(--sea-ink)" }}>Weather & Alerts</h1>
			</div>

			{/* Location */}
			<div className="rise-in island-shell rounded-2xl p-5 space-y-4" style={{ animationDelay: "40ms" }}>
				<div className="flex items-center gap-2">
					<CloudLightning size={16} style={{ color: "var(--lagoon)" }} />
					<span className="text-sm font-semibold" style={{ color: "var(--sea-ink)" }}>Location (US only — Weather.gov)</span>
				</div>

				<div className="grid grid-cols-2 gap-3">
					<div>
						<label className="block text-xs font-semibold mb-1" style={{ color: "var(--sea-ink-soft)" }}>Latitude</label>
						<input
							className={fieldClass}
							style={fieldStyle}
							type="number"
							step="0.0001"
							value={lat}
							onChange={(e) => setLat(e.target.value)}
							placeholder="e.g. 45.1234"
						/>
					</div>
					<div>
						<label className="block text-xs font-semibold mb-1" style={{ color: "var(--sea-ink-soft)" }}>Longitude</label>
						<input
							className={fieldClass}
							style={fieldStyle}
							type="number"
							step="0.0001"
							value={lon}
							onChange={(e) => setLon(e.target.value)}
							placeholder="e.g. -89.5678"
						/>
					</div>
				</div>

				<p className="text-xs" style={{ color: "var(--sea-ink-soft)" }}>
					Find coordinates by right-clicking your property on Google Maps.
				</p>

				<div className="flex items-center gap-3">
					<label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: "var(--sea-ink)" }}>
						<input
							type="checkbox"
							checked={alertsEnabled}
							onChange={(e) => setAlertsEnabled(e.target.checked)}
						/>
						Enable weather alerts & auto-tasks
					</label>
				</div>
			</div>

			{/* Freeze threshold */}
			<div className="rise-in island-shell rounded-2xl p-5" style={{ animationDelay: "80ms" }}>
				<div className="flex items-center gap-2 mb-3">
					<Thermometer size={16} style={{ color: "#60a5fa" }} />
					<span className="text-sm font-semibold" style={{ color: "var(--sea-ink)" }}>Freeze Watch Threshold</span>
				</div>
				<div className="flex items-center gap-3">
					<input
						className="w-24 px-3 py-2 rounded-lg text-sm border text-center"
						style={fieldStyle}
						type="number"
						value={freezeThreshold}
						onChange={(e) => setFreezeThreshold(e.target.value)}
					/>
					<span className="text-sm" style={{ color: "var(--sea-ink-soft)" }}>°F — auto-create freeze prep tasks below this temp</span>
				</div>
			</div>

			{/* Cleaning service */}
			<div className="rise-in island-shell rounded-2xl p-5 space-y-4" style={{ animationDelay: "120ms" }}>
				<div className="flex items-center gap-2">
					<Phone size={16} style={{ color: "var(--lagoon)" }} />
					<span className="text-sm font-semibold" style={{ color: "var(--sea-ink)" }}>Cleaning Service</span>
				</div>
				<div>
					<label className="block text-xs font-semibold mb-1" style={{ color: "var(--sea-ink-soft)" }}>Service Name</label>
					<input className={fieldClass} style={fieldStyle} value={cleaningName} onChange={(e) => setCleaningName(e.target.value)} placeholder="e.g. Lake Clean Co." />
				</div>
				<div>
					<label className="block text-xs font-semibold mb-1" style={{ color: "var(--sea-ink-soft)" }}>Phone</label>
					<input className={fieldClass} style={fieldStyle} value={cleaningPhone} onChange={(e) => setCleaningPhone(e.target.value)} placeholder="(555) 000-0000" />
				</div>
				<div>
					<label className="block text-xs font-semibold mb-1" style={{ color: "var(--sea-ink-soft)" }}>Instructions</label>
					<textarea className={fieldClass} style={fieldStyle} rows={3} value={cleaningInstructions} onChange={(e) => setCleaningInstructions(e.target.value)} placeholder="Key in lock box, code is 1234..." />
				</div>
			</div>

			<Button
				onClick={handleSave}
				disabled={saving}
				className="w-full"
				style={{ background: saved ? "var(--palm)" : "var(--lagoon)", color: "white", border: "none" }}
			>
				{saving ? <Loader2 size={14} className="animate-spin" /> : saved ? "Saved!" : "Save Settings"}
			</Button>
		</div>
	)
}
