import { useConvexMutation, useConvexQuery } from "@convex-dev/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { api } from "../../../../convex/_generated/api"
import { useCurrentMember } from "#/lib/auth/useCurrentMember"
import { ArrowLeft, Pencil, Trash2 } from "lucide-react"
import { useState } from "react"

export const Route = createFileRoute("/_app/gallery/$photoId")({
	component: PhotoViewerPage,
})

function PhotoViewerPage() {
	const { photoId } = Route.useParams()
	const { property } = useCurrentMember()
	const navigate = useNavigate()
	const [editingCaption, setEditingCaption] = useState(false)
	const [captionInput, setCaptionInput] = useState("")

	const photos = useConvexQuery(
		api.photos.listByProperty,
		property ? { propertyId: property._id } : "skip",
	)
	const photo = photos?.find((p) => p._id === photoId)

	const removePhotoMutation = useConvexMutation(api.photos.removePhoto)
	const updateCaptionMutation = useConvexMutation(api.photos.updateCaption)

	async function handleDelete() {
		if (!confirm("Delete this photo?")) return
		await removePhotoMutation({ photoId: photoId as never })
		navigate({ to: "/gallery" })
	}

	async function handleSaveCaption() {
		await updateCaptionMutation({ photoId: photoId as never, caption: captionInput })
		setEditingCaption(false)
	}

	if (!photo) return null

	return (
		<div className="min-h-dvh flex flex-col" style={{ background: "#000" }}>
			<div className="flex items-center justify-between px-4 py-3" style={{ background: "rgba(0,0,0,0.8)" }}>
				<button
					type="button"
					onClick={() => navigate({ to: "/gallery" })}
					className="p-2 rounded-lg"
					style={{ color: "white" }}
				>
					<ArrowLeft size={20} />
				</button>
				<div className="flex items-center gap-2">
					<button
						type="button"
						onClick={() => { setEditingCaption(true); setCaptionInput(photo.caption ?? "") }}
						className="p-2 rounded-lg"
						style={{ color: "white" }}
					>
						<Pencil size={18} />
					</button>
					<button
						type="button"
						onClick={handleDelete}
						className="p-2 rounded-lg"
						style={{ color: "#ff6b6b" }}
					>
						<Trash2 size={18} />
					</button>
				</div>
			</div>

			<div className="flex-1 flex items-center justify-center p-4">
				{photo.url && (
					<img
						src={photo.url}
						alt={photo.caption ?? "Photo"}
						className="max-w-full max-h-full rounded-xl object-contain"
					/>
				)}
			</div>

			{(photo.caption || editingCaption) && (
				<div className="px-4 py-4" style={{ background: "rgba(0,0,0,0.8)" }}>
					{editingCaption ? (
						<div className="flex gap-2">
							<input
								type="text"
								value={captionInput}
								onChange={(e) => setCaptionInput(e.target.value)}
								className="flex-1 px-3 py-2 rounded-lg text-sm"
								style={{ background: "rgba(255,255,255,0.1)", color: "white", border: "1px solid rgba(255,255,255,0.2)" }}
								placeholder="Add a caption..."
								autoFocus
							/>
							<button
								type="button"
								onClick={handleSaveCaption}
								className="px-3 py-2 rounded-lg text-sm font-semibold"
								style={{ background: "var(--palm)", color: "white" }}
							>
								Save
							</button>
							<button
								type="button"
								onClick={() => setEditingCaption(false)}
								className="px-3 py-2 rounded-lg text-sm"
								style={{ color: "rgba(255,255,255,0.6)" }}
							>
								Cancel
							</button>
						</div>
					) : (
						<p className="text-sm" style={{ color: "rgba(255,255,255,0.8)" }}>{photo.caption}</p>
					)}
				</div>
			)}
		</div>
	)
}
