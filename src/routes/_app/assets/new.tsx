import { useConvexMutation } from "@convex-dev/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { api } from "../../../../convex/_generated/api"
import { useCurrentMember } from "#/lib/auth/useCurrentMember"
import { useState } from "react"
import { Button } from "#/components/ui/button"

export const Route = createFileRoute("/_app/assets/new")({
	component: NewAssetPage,
})

const CATEGORIES = [
	{ value: "boat", label: "Boat" },
	{ value: "dock", label: "Dock" },
	{ value: "watercraft", label: "Watercraft" },
	{ value: "porch", label: "Porch" },
	{ value: "cleaning_equipment", label: "Cleaning Equipment" },
	{ value: "trailer", label: "Trailer" },
	{ value: "vehicle", label: "Vehicle" },
	{ value: "tool", label: "Tool" },
	{ value: "other", label: "Other" },
]

function NewAssetPage() {
	const { property } = useCurrentMember()
	const navigate = useNavigate()
	const createMutation = useConvexMutation(api.assets.create)

	const [name, setName] = useState("")
	const [category, setCategory] = useState("boat")
	const [location, setLocation] = useState("")
	const [make, setMake] = useState("")
	const [model, setModel] = useState("")
	const [year, setYear] = useState("")
	const [serialNumber, setSerialNumber] = useState("")
	const [purchaseCost, setPurchaseCost] = useState("")
	const [maintenanceIntervalDays, setMaintenanceIntervalDays] = useState("")
	const [notes, setNotes] = useState("")
	const [status, setStatus] = useState("active")
	const [saving, setSaving] = useState(false)

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault()
		if (!property || !name) return
		setSaving(true)
		try {
			const assetId = await createMutation({
				propertyId: property._id,
				name,
				category: category as never,
				location: location || undefined,
				make: make || undefined,
				model: model || undefined,
				year: year ? Number(year) : undefined,
				serialNumber: serialNumber || undefined,
				purchaseCost: purchaseCost ? Number(purchaseCost) : undefined,
				maintenanceIntervalDays: maintenanceIntervalDays ? Number(maintenanceIntervalDays) : undefined,
				notes: notes || undefined,
				status: status as never,
			})
			navigate({ to: "/assets/$assetId", params: { assetId: assetId as string } })
		} finally {
			setSaving(false)
		}
	}

	const fieldClass = "w-full px-3 py-2 rounded-lg text-sm border"
	const fieldStyle = { background: "var(--surface-strong)", color: "var(--sea-ink)", borderColor: "var(--line)" }

	return (
		<div className="page-wrap py-6 max-w-lg">
			<div className="rise-in mb-6">
				<p className="island-kicker mb-1" style={{ color: "var(--kicker)" }}>Assets</p>
				<h1 className="display-title text-2xl font-bold" style={{ color: "var(--sea-ink)" }}>Add Asset</h1>
			</div>

			<form onSubmit={handleSubmit} className="rise-in space-y-4" style={{ animationDelay: "40ms" }}>
				<div>
					<label className="block text-xs font-semibold mb-1" style={{ color: "var(--sea-ink-soft)" }}>Name *</label>
					<input className={fieldClass} style={fieldStyle} value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. Bass Tracker Pro 195" />
				</div>
				<div className="grid grid-cols-2 gap-3">
					<div>
						<label className="block text-xs font-semibold mb-1" style={{ color: "var(--sea-ink-soft)" }}>Category</label>
						<select className={fieldClass} style={fieldStyle} value={category} onChange={(e) => setCategory(e.target.value)}>
							{CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
						</select>
					</div>
					<div>
						<label className="block text-xs font-semibold mb-1" style={{ color: "var(--sea-ink-soft)" }}>Status</label>
						<select className={fieldClass} style={fieldStyle} value={status} onChange={(e) => setStatus(e.target.value)}>
							<option value="active">Active</option>
							<option value="in_storage">In Storage</option>
							<option value="needs_service">Needs Service</option>
							<option value="retired">Retired</option>
						</select>
					</div>
				</div>
				<div>
					<label className="block text-xs font-semibold mb-1" style={{ color: "var(--sea-ink-soft)" }}>Location</label>
					<input className={fieldClass} style={fieldStyle} value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Dock slip 3" />
				</div>
				<div className="grid grid-cols-3 gap-3">
					<div>
						<label className="block text-xs font-semibold mb-1" style={{ color: "var(--sea-ink-soft)" }}>Make</label>
						<input className={fieldClass} style={fieldStyle} value={make} onChange={(e) => setMake(e.target.value)} placeholder="Tracker" />
					</div>
					<div>
						<label className="block text-xs font-semibold mb-1" style={{ color: "var(--sea-ink-soft)" }}>Model</label>
						<input className={fieldClass} style={fieldStyle} value={model} onChange={(e) => setModel(e.target.value)} placeholder="Pro 195" />
					</div>
					<div>
						<label className="block text-xs font-semibold mb-1" style={{ color: "var(--sea-ink-soft)" }}>Year</label>
						<input className={fieldClass} style={fieldStyle} type="number" value={year} onChange={(e) => setYear(e.target.value)} placeholder="2022" min={1900} max={2100} />
					</div>
				</div>
				<div>
					<label className="block text-xs font-semibold mb-1" style={{ color: "var(--sea-ink-soft)" }}>Serial Number</label>
					<input className={fieldClass} style={fieldStyle} value={serialNumber} onChange={(e) => setSerialNumber(e.target.value)} />
				</div>
				<div className="grid grid-cols-2 gap-3">
					<div>
						<label className="block text-xs font-semibold mb-1" style={{ color: "var(--sea-ink-soft)" }}>Purchase Cost ($)</label>
						<input className={fieldClass} style={fieldStyle} type="number" value={purchaseCost} onChange={(e) => setPurchaseCost(e.target.value)} placeholder="0" />
					</div>
					<div>
						<label className="block text-xs font-semibold mb-1" style={{ color: "var(--sea-ink-soft)" }}>Maintenance Interval (days)</label>
						<input className={fieldClass} style={fieldStyle} type="number" value={maintenanceIntervalDays} onChange={(e) => setMaintenanceIntervalDays(e.target.value)} placeholder="365" />
					</div>
				</div>
				<div>
					<label className="block text-xs font-semibold mb-1" style={{ color: "var(--sea-ink-soft)" }}>Notes</label>
					<textarea className={fieldClass} style={fieldStyle} value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
				</div>
				<Button type="submit" disabled={saving || !name} className="w-full" style={{ background: "linear-gradient(135deg, var(--palm), var(--lagoon-deep))", color: "white", border: "none" }}>
					{saving ? "Saving..." : "Add Asset"}
				</Button>
			</form>
		</div>
	)
}
