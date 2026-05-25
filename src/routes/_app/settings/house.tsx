import { useConvexMutation } from "@convex-dev/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { api } from "../../../../convex/_generated/api"
import { useCurrentMember } from "#/lib/auth/useCurrentMember"
import { canManageProperty } from "#/lib/auth/useCurrentMember"
import type { MemberRole } from "#/lib/auth/useCurrentMember"
import { ArrowLeft, Loader2 } from "lucide-react"
import { useEffect, useState } from "react"
import { Button } from "#/components/ui/button"
import { Input } from "#/components/ui/input"
import { Label } from "#/components/ui/label"
import { Textarea } from "#/components/ui/textarea"

export const Route = createFileRoute("/_app/settings/house")({
	component: HouseSettingsPage,
})

function HouseSettingsPage() {
	const { property, membership } = useCurrentMember()
	const updateProperty = useConvexMutation(api.properties.update)

	const [name, setName] = useState("")
	const [timezone, setTimezone] = useState("")
	const [address, setAddress] = useState("")
	const [wifiName, setWifiName] = useState("")
	const [wifiPassword, setWifiPassword] = useState("")
	const [emergencyContacts, setEmergencyContacts] = useState("")
	const [saving, setSaving] = useState(false)
	const [saved, setSaved] = useState(false)

	useEffect(() => {
		if (property) {
			setName(property.name)
			setTimezone(property.timezone)
			setAddress(property.address ?? "")
			setWifiName(property.wifiName ?? "")
			setWifiPassword(property.wifiPassword ?? "")
			setEmergencyContacts(property.emergencyContacts ?? "")
		}
	}, [property?._id])

	const canEdit = canManageProperty(membership?.role as MemberRole | undefined)

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault()
		if (!property) return
		setSaving(true)
		try {
			await updateProperty({
				propertyId: property._id,
				name,
				timezone,
				address: address || undefined,
				wifiName: wifiName || undefined,
				wifiPassword: wifiPassword || undefined,
				emergencyContacts: emergencyContacts || undefined,
			})
			setSaved(true)
			setTimeout(() => setSaved(false), 2000)
		} finally {
			setSaving(false)
		}
	}

	return (
		<div className="page-wrap py-6 max-w-lg">
			<Link to="/settings" className="inline-flex items-center gap-1.5 text-sm mb-4 font-medium" style={{ color: "var(--sea-ink-soft)" }}>
				<ArrowLeft size={14} /> Settings
			</Link>

			<div className="rise-in mb-6">
				<p className="island-kicker mb-1" style={{ color: "var(--kicker)" }}>Settings</p>
				<h1 className="display-title text-2xl font-bold" style={{ color: "var(--sea-ink)" }}>House settings</h1>
			</div>

			{property ? (
				<form onSubmit={handleSubmit} className="rise-in island-shell rounded-2xl p-6 space-y-4" style={{ animationDelay: "60ms" }}>
					<div className="space-y-1.5">
						<Label className="text-xs font-semibold" style={{ color: "var(--sea-ink-soft)" }}>Property name</Label>
						<Input value={name} onChange={(e) => setName(e.target.value)} disabled={!canEdit} required className="h-10" />
					</div>
					<div className="space-y-1.5">
						<Label className="text-xs font-semibold" style={{ color: "var(--sea-ink-soft)" }}>Timezone</Label>
						<Input value={timezone} onChange={(e) => setTimezone(e.target.value)} disabled={!canEdit} className="h-10" />
					</div>
					<div className="space-y-1.5">
						<Label className="text-xs font-semibold" style={{ color: "var(--sea-ink-soft)" }}>Address</Label>
						<Input value={address} onChange={(e) => setAddress(e.target.value)} disabled={!canEdit} className="h-10" placeholder="123 Lakeshore Dr" />
					</div>
					<div className="h-px" style={{ background: "var(--line)" }} />
					<p className="island-kicker text-xs" style={{ color: "var(--kicker)" }}>Wi-Fi</p>
					<div className="space-y-1.5">
						<Label className="text-xs font-semibold" style={{ color: "var(--sea-ink-soft)" }}>Network name (SSID)</Label>
						<Input value={wifiName} onChange={(e) => setWifiName(e.target.value)} disabled={!canEdit} className="h-10" placeholder="LakeHouse_5G" />
					</div>
					<div className="space-y-1.5">
						<Label className="text-xs font-semibold" style={{ color: "var(--sea-ink-soft)" }}>Password</Label>
						<Input value={wifiPassword} onChange={(e) => setWifiPassword(e.target.value)} disabled={!canEdit} className="h-10" type="text" placeholder="••••••••" />
					</div>
					<div className="h-px" style={{ background: "var(--line)" }} />
					<div className="space-y-1.5">
						<Label className="text-xs font-semibold" style={{ color: "var(--sea-ink-soft)" }}>Emergency contacts</Label>
						<Textarea
							value={emergencyContacts}
							onChange={(e) => setEmergencyContacts(e.target.value)}
							disabled={!canEdit}
							rows={3}
							placeholder="Local fire: 555-0100&#10;Nearest hospital: 555-0200"
						/>
					</div>

					{canEdit && (
						<Button
							type="submit"
							disabled={saving}
							className="w-full h-10"
							style={{ background: "linear-gradient(135deg, var(--palm), var(--lagoon-deep))", color: "white", border: "none" }}
						>
							{saving ? <Loader2 size={14} className="animate-spin" /> : saved ? "Saved!" : "Save changes"}
						</Button>
					)}
				</form>
			) : (
				<div className="flex justify-center py-12"><Loader2 className="animate-spin" style={{ color: "var(--lagoon)" }} /></div>
			)}
		</div>
	)
}
