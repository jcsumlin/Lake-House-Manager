import { useConvexQuery } from "@convex-dev/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { api } from "../../../../convex/_generated/api"
import { useCurrentMember } from "#/lib/auth/useCurrentMember"
import { Image, Loader2 } from "lucide-react"
import { useState } from "react"

export const Route = createFileRoute("/_app/gallery/")({
	component: GalleryPage,
})

type FilterTab = "all" | "stay" | "maintenance" | "asset"

const TABS: { key: FilterTab; label: string }[] = [
	{ key: "all", label: "All" },
	{ key: "stay", label: "Trips" },
	{ key: "maintenance", label: "Maintenance" },
	{ key: "asset", label: "Assets" },
]

function GalleryPage() {
	const { property } = useCurrentMember()
	const [tab, setTab] = useState<FilterTab>("all")

	const photos = useConvexQuery(
		api.photos.listByProperty,
		property ? { propertyId: property._id } : "skip",
	)

	const filtered = photos?.filter((p) => {
		if (tab === "all") return true
		if (tab === "stay") return !!p.linkedStayId
		if (tab === "maintenance") return !!p.linkedMaintenanceId
		if (tab === "asset") return !!p.linkedAssetId
		return true
	})

	return (
		<div className="page-wrap py-6">
			<div className="rise-in flex items-center justify-between mb-4">
				<div>
					<p className="island-kicker mb-1" style={{ color: "var(--kicker)" }}>Media</p>
					<h1 className="display-title text-2xl font-bold" style={{ color: "var(--sea-ink)" }}>Photo Gallery</h1>
				</div>
			</div>

			<div className="rise-in flex gap-1 mb-4 p-1 rounded-xl overflow-x-auto" style={{ background: "rgba(23,58,64,0.06)", border: "1px solid var(--line)", animationDelay: "40ms" }}>
				{TABS.map((t) => (
					<button
						key={t.key}
						type="button"
						onClick={() => setTab(t.key)}
						className="flex-shrink-0 text-xs font-semibold py-1.5 px-3 rounded-lg transition-all"
						style={{
							background: tab === t.key ? "var(--surface-strong)" : "transparent",
							color: tab === t.key ? "var(--sea-ink)" : "var(--sea-ink-soft)",
						}}
					>
						{t.label}
					</button>
				))}
			</div>

			{photos === undefined ? (
				<div className="flex justify-center py-12">
					<Loader2 className="animate-spin" style={{ color: "var(--lagoon)" }} />
				</div>
			) : filtered?.length === 0 ? (
				<div className="rise-in island-shell rounded-2xl p-12 text-center">
					<Image size={32} className="mx-auto mb-3" style={{ color: "var(--sea-ink-soft)" }} />
					<p className="text-sm" style={{ color: "var(--sea-ink-soft)" }}>No photos yet.</p>
					<p className="text-xs mt-1" style={{ color: "var(--sea-ink-soft)" }}>Add photos from maintenance issues, stays, or assets.</p>
				</div>
			) : (
				<div className="rise-in grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2" style={{ animationDelay: "80ms" }}>
					{filtered?.map((photo) => (
						<Link
							key={photo._id}
							to="/gallery/$photoId"
							params={{ photoId: photo._id }}
							className="relative aspect-square rounded-xl overflow-hidden"
							style={{ background: "rgba(23,58,64,0.06)", border: "1px solid var(--line)" }}
						>
							{photo.url ? (
								<img
									src={photo.url}
									alt={photo.caption ?? "Photo"}
									className="w-full h-full object-cover"
								/>
							) : (
								<div className="w-full h-full flex items-center justify-center">
									<Image size={24} style={{ color: "var(--sea-ink-soft)" }} />
								</div>
							)}
							{photo.caption && (
								<div
									className="absolute bottom-0 inset-x-0 px-2 py-1 text-[10px] truncate"
									style={{ background: "rgba(0,0,0,0.5)", color: "white" }}
								>
									{photo.caption}
								</div>
							)}
						</Link>
					))}
				</div>
			)}
		</div>
	)
}
