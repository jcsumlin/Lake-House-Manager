import { useConvexQuery } from "@convex-dev/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { api } from "../../../../convex/_generated/api"
import { useCurrentMember } from "#/lib/auth/useCurrentMember"
import { Anchor, Loader2, Plus, Wrench } from "lucide-react"
import { useState } from "react"
import { Button } from "#/components/ui/button"

export const Route = createFileRoute("/_app/assets/")({
	component: AssetsPage,
})

type CategoryFilter = "all" | "boat" | "dock" | "watercraft" | "vehicle" | "tool" | "other"

const CATEGORIES: { key: CategoryFilter; label: string }[] = [
	{ key: "all", label: "All" },
	{ key: "boat", label: "Boat" },
	{ key: "dock", label: "Dock" },
	{ key: "watercraft", label: "Watercraft" },
	{ key: "vehicle", label: "Vehicle" },
	{ key: "tool", label: "Tools" },
	{ key: "other", label: "Other" },
]

const STATUS_COLORS: Record<string, string> = {
	active: "var(--palm)",
	in_storage: "var(--lagoon)",
	needs_service: "#e07000",
	retired: "var(--sea-ink-soft)",
}

function AssetsPage() {
	const { property } = useCurrentMember()
	const [cat, setCat] = useState<CategoryFilter>("all")

	const assets = useConvexQuery(
		api.assets.list,
		property
			? { propertyId: property._id, ...(cat !== "all" ? { category: cat as never } : {}) }
			: "skip",
	)

	return (
		<div className="page-wrap py-6">
			<div className="rise-in flex items-center justify-between mb-4">
				<div>
					<p className="island-kicker mb-1" style={{ color: "var(--kicker)" }}>Inventory</p>
					<h1 className="display-title text-2xl font-bold" style={{ color: "var(--sea-ink)" }}>Assets</h1>
				</div>
				<Button asChild size="sm" style={{ background: "linear-gradient(135deg, var(--palm), var(--lagoon-deep))", color: "white", border: "none" }}>
					<Link to="/assets/new"><Plus size={14} className="mr-1" /> Add</Link>
				</Button>
			</div>

			<div className="rise-in flex gap-1 mb-4 p-1 rounded-xl overflow-x-auto" style={{ background: "rgba(23,58,64,0.06)", border: "1px solid var(--line)", animationDelay: "40ms" }}>
				{CATEGORIES.map((c) => (
					<button
						key={c.key}
						type="button"
						onClick={() => setCat(c.key)}
						className="flex-shrink-0 text-xs font-semibold py-1.5 px-3 rounded-lg transition-all"
						style={{
							background: cat === c.key ? "var(--surface-strong)" : "transparent",
							color: cat === c.key ? "var(--sea-ink)" : "var(--sea-ink-soft)",
						}}
					>
						{c.label}
					</button>
				))}
			</div>

			{assets === undefined ? (
				<div className="flex justify-center py-12"><Loader2 className="animate-spin" style={{ color: "var(--lagoon)" }} /></div>
			) : assets.length === 0 ? (
				<div className="rise-in island-shell rounded-2xl p-8 text-center">
					<Anchor size={32} className="mx-auto mb-3" style={{ color: "var(--sea-ink-soft)" }} />
					<p className="text-sm" style={{ color: "var(--sea-ink-soft)" }}>No assets yet.</p>
				</div>
			) : (
				<div className="rise-in space-y-2" style={{ animationDelay: "80ms" }}>
					{assets.map((asset) => (
						<Link
							key={asset._id}
							to="/assets/$assetId"
							params={{ assetId: asset._id }}
							className="island-shell rounded-xl px-4 py-3 flex items-center gap-3"
						>
							<span
								className="size-8 rounded-full flex items-center justify-center shrink-0"
								style={{ background: `${STATUS_COLORS[asset.status]}18`, color: STATUS_COLORS[asset.status] }}
							>
								<Anchor size={14} />
							</span>
							<div className="flex-1 min-w-0">
								<p className="text-sm font-semibold truncate" style={{ color: "var(--sea-ink)" }}>{asset.name}</p>
								<div className="flex items-center gap-2 mt-0.5 flex-wrap">
									<span className="text-[10px] capitalize" style={{ color: "var(--sea-ink-soft)" }}>{asset.category.replace("_", " ")}</span>
									{asset.location && (
										<span className="text-[10px]" style={{ color: "var(--sea-ink-soft)" }}>· {asset.location}</span>
									)}
									{asset.nextMaintenanceDue && asset.nextMaintenanceDue < Date.now() && (
										<span className="text-[10px] font-semibold px-1.5 py-px rounded-full" style={{ background: "rgba(224,112,0,0.1)", color: "#e07000" }}>
											<Wrench size={8} className="inline mr-0.5" />Maintenance due
										</span>
									)}
								</div>
							</div>
							<span
								className="text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize shrink-0"
								style={{ background: `${STATUS_COLORS[asset.status]}18`, color: STATUS_COLORS[asset.status] }}
							>
								{asset.status.replace("_", " ")}
							</span>
						</Link>
					))}
				</div>
			)}
		</div>
	)
}
