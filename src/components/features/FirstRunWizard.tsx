import { useConvexMutation } from "@convex-dev/react-query"
import { api } from "../../../convex/_generated/api"
import { Loader2 } from "lucide-react"
import { useState } from "react"
import { Button } from "#/components/ui/button"
import { Input } from "#/components/ui/input"
import { Label } from "#/components/ui/label"

const TIMEZONES = [
	"America/New_York",
	"America/Chicago",
	"America/Denver",
	"America/Los_Angeles",
	"America/Anchorage",
	"Pacific/Honolulu",
]

export function FirstRunWizard({ onCreated }: { onCreated: () => void }) {
	const createProperty = useConvexMutation(api.properties.create)
	const [name, setName] = useState("")
	const [timezone, setTimezone] = useState("America/New_York")
	const [address, setAddress] = useState("")
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState("")

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault()
		if (!name || !timezone) return
		setLoading(true)
		setError("")
		try {
			await createProperty({ name, timezone, address: address || undefined })
			onCreated()
		} catch (err: unknown) {
			setError(err instanceof Error ? err.message : "Failed to create property")
		} finally {
			setLoading(false)
		}
	}

	return (
		<div className="min-h-dvh flex items-center justify-center px-4 py-12">
			<div className="island-shell rounded-2xl p-8 max-w-md w-full rise-in">
				<div className="mb-6">
					<p className="island-kicker mb-1" style={{ color: "var(--kicker)" }}>Welcome</p>
					<h1 className="display-title text-2xl font-bold mb-2" style={{ color: "var(--sea-ink)" }}>
						Set up your lake house
					</h1>
					<p className="text-sm" style={{ color: "var(--sea-ink-soft)" }}>
						You'll be the super admin. You can invite family members after setup.
					</p>
				</div>

				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="space-y-1.5">
						<Label htmlFor="property-name" className="text-xs font-semibold" style={{ color: "var(--sea-ink-soft)" }}>
							Property name
						</Label>
						<Input
							id="property-name"
							placeholder="Smith Family Lake House"
							value={name}
							onChange={(e) => setName(e.target.value)}
							required
							className="h-11"
						/>
					</div>

					<div className="space-y-1.5">
						<Label htmlFor="timezone" className="text-xs font-semibold" style={{ color: "var(--sea-ink-soft)" }}>
							Timezone
						</Label>
						<select
							id="timezone"
							value={timezone}
							onChange={(e) => setTimezone(e.target.value)}
							className="w-full h-11 rounded-lg border px-3 text-sm"
							style={{
								background: "rgba(255,255,255,0.6)",
								borderColor: "var(--line)",
								color: "var(--sea-ink)",
							}}
						>
							{TIMEZONES.map((tz) => (
								<option key={tz} value={tz}>{tz}</option>
							))}
						</select>
					</div>

					<div className="space-y-1.5">
						<Label htmlFor="address" className="text-xs font-semibold" style={{ color: "var(--sea-ink-soft)" }}>
							Address <span style={{ color: "var(--sea-ink-soft)", fontWeight: 400 }}>(optional)</span>
						</Label>
						<Input
							id="address"
							placeholder="123 Lakeshore Dr, Lake Town, MI"
							value={address}
							onChange={(e) => setAddress(e.target.value)}
							className="h-11"
						/>
					</div>

					{error && <p className="text-xs text-red-500">{error}</p>}

					<Button
						type="submit"
						disabled={loading || !name}
						className="w-full h-11 font-semibold"
						style={{ background: "linear-gradient(135deg, var(--palm), var(--lagoon-deep))", color: "white", border: "none" }}
					>
						{loading ? <Loader2 size={16} className="animate-spin" /> : "Create property"}
					</Button>
				</form>
			</div>
		</div>
	)
}
