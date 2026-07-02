import { useConvexAction, useConvexMutation } from "@convex-dev/react-query"
import { api } from "../../../convex/_generated/api"
import type { Id } from "../../../convex/_generated/dataModel"
import { Camera, Loader2 } from "lucide-react"
import { useRef, useState } from "react"

interface Props {
	propertyId: Id<"properties">
	linkedStayId?: Id<"stays">
	linkedMaintenanceId?: Id<"maintenanceIssues">
	assetId?: Id<"assets">
}

export function PhotoUploader({ propertyId, linkedStayId, linkedMaintenanceId, assetId }: Props) {
	const fileInputRef = useRef<HTMLInputElement>(null)
	const [uploading, setUploading] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const generateUploadUrl = useConvexAction(api.photos.generateUploadUrl)
	const addPhoto = useConvexMutation(api.photos.addPhoto)

	async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0]
		if (!file) return
		setUploading(true)
		setError(null)
		try {
			const uploadUrl = await generateUploadUrl({ propertyId })
			const resp = await fetch(uploadUrl, {
				method: "PUT",
				headers: { "Content-Type": file.type },
				body: file,
			})
			if (!resp.ok) throw new Error("Upload failed")
			const { storageId } = await resp.json() as { storageId: Id<"_storage"> }
			await addPhoto({
				propertyId,
				storageId,
				linkedStayId,
				linkedMaintenanceId,
				linkedAssetId: assetId,
			})
		} catch (err) {
			setError("Upload failed. Please try again.")
		} finally {
			setUploading(false)
			if (fileInputRef.current) fileInputRef.current.value = ""
		}
	}

	return (
		<div>
			<input
				ref={fileInputRef}
				type="file"
				accept="image/*"
				capture="environment"
				className="hidden"
				onChange={handleFileChange}
			/>
			<button
				type="button"
				onClick={() => fileInputRef.current?.click()}
				disabled={uploading}
				className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-colors"
				style={{
					background: "rgba(0,108,140,0.08)",
					color: "var(--lagoon)",
					border: "1px dashed var(--lagoon)",
				}}
			>
				{uploading ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
				{uploading ? "Uploading..." : "Add Photo"}
			</button>
			{error && <p className="text-xs mt-1" style={{ color: "#c83232" }}>{error}</p>}
		</div>
	)
}
