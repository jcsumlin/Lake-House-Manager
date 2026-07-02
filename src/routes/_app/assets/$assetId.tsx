import { useConvexMutation, useConvexQuery } from "@convex-dev/react-query"
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { api } from "../../../../convex/_generated/api"
import { ArrowLeft, Camera, Loader2, Wrench } from "lucide-react"
import { useState } from "react"
import { Button } from "#/components/ui/button"
import { PhotoUploader } from "#/components/features/PhotoUploader"

export const Route = createFileRoute("/_app/assets/$assetId")({
	component: AssetDetailPage,
})

function AssetDetailPage() {
	const { assetId } = Route.useParams()
	const navigate = useNavigate()
	const [recordingMaintenance, setRecordingMaintenance] = useState(false)
	const [maintenanceNotes, setMaintenanceNotes] = useState("")
	const [createExpense, setCreateExpense] = useState(false)
	const [expenseCost, setExpenseCost] = useState("")
	const [saving, setSaving] = useState(false)

	const asset = useConvexQuery(api.assets.get, { assetId: assetId as never })
	const photos = useConvexQuery(api.photos.listByAsset, { assetId: assetId as never })
	const recordMaintenanceMutation = useConvexMutation(api.assets.recordMaintenance)
	const removeMutation = useConvexMutation(api.assets.remove)

	async function handleRecordMaintenance() {
		setSaving(true)
		try {
			await recordMaintenanceMutation({
				assetId: assetId as never,
				notes: maintenanceNotes || undefined,
				createExpense: createExpense && !!expenseCost,
				expenseCost: expenseCost ? Number(expenseCost) : undefined,
				expenseDescription: `${asset?.name ?? "Asset"} maintenance`,
			})
			setRecordingMaintenance(false)
			setMaintenanceNotes("")
			setCreateExpense(false)
			setExpenseCost("")
		} finally {
			setSaving(false)
		}
	}

	async function handleDelete() {
		if (!confirm(`Delete ${asset?.name}?`)) return
		await removeMutation({ assetId: assetId as never })
		navigate({ to: "/assets" })
	}

	if (asset === undefined) {
		return <div className="flex justify-center py-12"><Loader2 className="animate-spin" style={{ color: "var(--lagoon)" }} /></div>
	}
	if (!asset) {
		return <div className="page-wrap py-6"><p style={{ color: "var(--sea-ink-soft)" }}>Asset not found.</p></div>
	}

	const maintenanceOverdue = asset.nextMaintenanceDue && asset.nextMaintenanceDue < Date.now()

	return (
		<div className="page-wrap py-6 space-y-5">
			<div className="rise-in flex items-center gap-3 mb-2">
				<Link to="/assets" className="p-2 rounded-lg" style={{ color: "var(--sea-ink-soft)" }}>
					<ArrowLeft size={18} />
				</Link>
				<div className="flex-1 min-w-0">
					<h1 className="display-title text-xl font-bold truncate" style={{ color: "var(--sea-ink)" }}>{asset.name}</h1>
					<p className="text-xs capitalize" style={{ color: "var(--sea-ink-soft)" }}>{asset.category.replace("_", " ")} · {asset.status.replace("_", " ")}</p>
				</div>
			</div>

			{/* Details card */}
			<div className="rise-in island-shell rounded-2xl p-4 space-y-2" style={{ animationDelay: "40ms" }}>
				{asset.make && <Row label="Make / Model" value={`${asset.make}${asset.model ? ` ${asset.model}` : ""}${asset.year ? ` (${asset.year})` : ""}`} />}
				{asset.location && <Row label="Location" value={asset.location} />}
				{asset.serialNumber && <Row label="Serial" value={asset.serialNumber} />}
				{asset.purchaseCost && <Row label="Purchase Cost" value={`$${asset.purchaseCost.toLocaleString()}`} />}
				{asset.notes && <Row label="Notes" value={asset.notes} />}
			</div>

			{/* Maintenance status */}
			{asset.maintenanceIntervalDays && (
				<div className="rise-in island-shell rounded-2xl p-4" style={{ animationDelay: "80ms", border: maintenanceOverdue ? "1px solid #e07000" : undefined }}>
					<div className="flex items-center gap-2 mb-3">
						<Wrench size={16} style={{ color: maintenanceOverdue ? "#e07000" : "var(--lagoon)" }} />
						<span className="text-sm font-semibold" style={{ color: "var(--sea-ink)" }}>Maintenance</span>
					</div>
					<div className="space-y-1 text-sm">
						{asset.lastMaintenanceAt && (
							<Row label="Last performed" value={new Date(asset.lastMaintenanceAt).toLocaleDateString()} />
						)}
						{asset.nextMaintenanceDue && (
							<Row
								label="Next due"
								value={new Date(asset.nextMaintenanceDue).toLocaleDateString()}
								valueStyle={{ color: maintenanceOverdue ? "#e07000" : undefined }}
							/>
						)}
					</div>
					{!recordingMaintenance ? (
						<Button
							size="sm"
							onClick={() => setRecordingMaintenance(true)}
							className="mt-3"
							style={{ background: "var(--lagoon)", color: "white", border: "none" }}
						>
							Record Maintenance
						</Button>
					) : (
						<div className="mt-3 space-y-3">
							<textarea
								className="w-full px-3 py-2 rounded-lg text-sm border"
								style={{ background: "var(--surface-strong)", color: "var(--sea-ink)", borderColor: "var(--line)" }}
								rows={3}
								placeholder="Notes (optional)"
								value={maintenanceNotes}
								onChange={(e) => setMaintenanceNotes(e.target.value)}
							/>
							<label className="flex items-center gap-2 text-sm" style={{ color: "var(--sea-ink)" }}>
								<input type="checkbox" checked={createExpense} onChange={(e) => setCreateExpense(e.target.checked)} />
								Log an expense
							</label>
							{createExpense && (
								<input
									type="number"
									className="w-full px-3 py-2 rounded-lg text-sm border"
									style={{ background: "var(--surface-strong)", color: "var(--sea-ink)", borderColor: "var(--line)" }}
									placeholder="Cost ($)"
									value={expenseCost}
									onChange={(e) => setExpenseCost(e.target.value)}
								/>
							)}
							<div className="flex gap-2">
								<Button size="sm" onClick={handleRecordMaintenance} disabled={saving} style={{ background: "var(--palm)", color: "white", border: "none" }}>
									{saving ? "Saving..." : "Save"}
								</Button>
								<Button size="sm" variant="ghost" onClick={() => setRecordingMaintenance(false)}>Cancel</Button>
							</div>
						</div>
					)}
				</div>
			)}

			{/* Photos */}
			<div className="rise-in island-shell rounded-2xl p-4" style={{ animationDelay: "120ms" }}>
				<div className="flex items-center gap-2 mb-3">
					<Camera size={16} style={{ color: "var(--lagoon)" }} />
					<span className="text-sm font-semibold" style={{ color: "var(--sea-ink)" }}>Photos</span>
				</div>
				<PhotoUploader assetId={assetId as never} propertyId={asset.propertyId} />
				{photos && photos.length > 0 && (
					<div className="grid grid-cols-3 gap-2 mt-3">
						{photos.map((p) => (
							<Link key={p._id} to="/gallery/$photoId" params={{ photoId: p._id }} className="aspect-square rounded-lg overflow-hidden" style={{ background: "rgba(23,58,64,0.06)" }}>
								{p.url && <img src={p.url} alt={p.caption ?? ""} className="w-full h-full object-cover" />}
							</Link>
						))}
					</div>
				)}
			</div>

			{/* Danger */}
			<div className="rise-in pt-2" style={{ animationDelay: "160ms" }}>
				<button type="button" onClick={handleDelete} className="text-xs" style={{ color: "var(--sea-ink-soft)" }}>
					Delete asset
				</button>
			</div>
		</div>
	)
}

function Row({ label, value, valueStyle }: { label: string; value: string; valueStyle?: React.CSSProperties }) {
	return (
		<div className="flex items-start justify-between gap-4 text-sm">
			<span style={{ color: "var(--sea-ink-soft)" }}>{label}</span>
			<span className="text-right font-medium" style={{ color: "var(--sea-ink)", ...valueStyle }}>{value}</span>
		</div>
	)
}
