import { useConvexMutation, useConvexQuery } from "@convex-dev/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { api } from "../../../../convex/_generated/api"
import { useCurrentMember } from "#/lib/auth/useCurrentMember"
import { CheckCircle2, Loader2, Snowflake } from "lucide-react"
import { useState } from "react"
import { Button } from "#/components/ui/button"

export const Route = createFileRoute("/_app/seasonal/closing")({
	component: ClosingWizardPage,
})

type Step = "templates" | "assets" | "summary"

function ClosingWizardPage() {
	const { property, membership } = useCurrentMember()
	const navigate = useNavigate()
	const [step, setStep] = useState<Step>("templates")
	const [selectedTemplates, setSelectedTemplates] = useState<string[]>([])
	const [createdTaskCount, setCreatedTaskCount] = useState(0)
	const [saving, setSaving] = useState(false)

	const templates = useConvexQuery(
		api.taskTemplates.list,
		property ? { propertyId: property._id } : "skip",
	)
	const assets = useConvexQuery(
		api.assets.list,
		property ? { propertyId: property._id } : "skip",
	)
	const createTaskMutation = useConvexMutation(api.tasks.create)

	const closingTemplates = templates?.filter((t) => t.category === "closing" || t.category === "seasonal")

	async function handleApplyTemplates() {
		if (!property || !membership) return
		setSaving(true)
		try {
			let count = 0
			for (const templateId of selectedTemplates) {
				const template = templates?.find((t) => t._id === templateId)
				if (!template) continue
				for (const item of template.checklistItems) {
					await createTaskMutation({
						propertyId: property._id,
						title: item.title,
						type: "seasonal",
						priority: "medium",
					})
					count++
				}
			}

			// Create winterization task for each active asset
			const activeAssets = assets?.filter((a) => a.status === "active") ?? []
			for (const asset of activeAssets) {
				await createTaskMutation({
					propertyId: property._id,
					title: `Winterize: ${asset.name}`,
					type: "seasonal",
					priority: asset.category === "boat" || asset.category === "watercraft" ? "high" : "medium",
				})
				count++
			}

			setCreatedTaskCount(count)
			setStep("summary")
		} finally {
			setSaving(false)
		}
	}

	function toggleTemplate(id: string) {
		setSelectedTemplates((prev) =>
			prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
		)
	}

	return (
		<div className="page-wrap py-6 max-w-lg">
			<div className="rise-in flex items-center gap-3 mb-6">
				<Snowflake size={24} style={{ color: "#60a5fa" }} />
				<div>
					<p className="island-kicker" style={{ color: "var(--kicker)" }}>Seasonal</p>
					<h1 className="display-title text-xl font-bold" style={{ color: "var(--sea-ink)" }}>Closing Wizard</h1>
				</div>
			</div>

			{/* Step indicator */}
			<div className="rise-in flex items-center gap-2 mb-6" style={{ animationDelay: "40ms" }}>
				{(["templates", "assets", "summary"] as Step[]).map((s, i) => (
					<div key={s} className="flex items-center gap-2">
						{i > 0 && <div className="h-px flex-1" style={{ width: 32, background: "var(--line)" }} />}
						<div
							className="size-7 rounded-full flex items-center justify-center text-xs font-bold"
							style={{
								background: step === s ? "var(--lagoon)" : s === "summary" && step !== "summary" ? "rgba(0,0,0,0.05)" : "rgba(0,108,140,0.1)",
								color: step === s ? "white" : "var(--sea-ink-soft)",
							}}
						>
							{i + 1}
						</div>
					</div>
				))}
			</div>

			{step === "templates" && (
				<div className="rise-in space-y-4">
					<p className="text-sm" style={{ color: "var(--sea-ink-soft)" }}>
						Select closing checklists to apply. Tasks will be created for each selected template.
					</p>

					{closingTemplates === undefined ? (
						<div className="flex justify-center py-8"><Loader2 className="animate-spin" style={{ color: "var(--lagoon)" }} /></div>
					) : closingTemplates.length === 0 ? (
						<div className="island-shell rounded-xl p-6 text-center">
							<p className="text-sm" style={{ color: "var(--sea-ink-soft)" }}>No closing templates yet.</p>
							<p className="text-xs mt-1" style={{ color: "var(--sea-ink-soft)" }}>Create task templates in Settings → Tasks.</p>
						</div>
					) : (
						<div className="space-y-2">
							{closingTemplates.map((t) => (
								<button
									key={t._id}
									type="button"
									onClick={() => toggleTemplate(t._id)}
									className="w-full island-shell rounded-xl px-4 py-3 flex items-center gap-3 text-left transition-all"
									style={{
										border: selectedTemplates.includes(t._id) ? "1.5px solid var(--lagoon)" : undefined,
									}}
								>
									<div
										className="size-5 rounded border flex items-center justify-center shrink-0"
										style={{
											background: selectedTemplates.includes(t._id) ? "var(--lagoon)" : "transparent",
											borderColor: selectedTemplates.includes(t._id) ? "var(--lagoon)" : "var(--line)",
										}}
									>
										{selectedTemplates.includes(t._id) && <CheckCircle2 size={12} style={{ color: "white" }} />}
									</div>
									<div>
										<p className="text-sm font-semibold" style={{ color: "var(--sea-ink)" }}>{t.name}</p>
										<p className="text-xs" style={{ color: "var(--sea-ink-soft)" }}>{t.checklistItems.length} item{t.checklistItems.length !== 1 ? "s" : ""}</p>
									</div>
								</button>
							))}
						</div>
					)}

					<Button
						onClick={() => setStep("assets")}
						disabled={!closingTemplates?.length}
						className="w-full"
						style={{ background: "var(--lagoon)", color: "white", border: "none" }}
					>
						Next: Asset Winterization
					</Button>
				</div>
			)}

			{step === "assets" && (
				<div className="rise-in space-y-4">
					<p className="text-sm" style={{ color: "var(--sea-ink-soft)" }}>
						A winterization task will be created for each active asset. You can skip this step.
					</p>

					{assets === undefined ? (
						<div className="flex justify-center py-8"><Loader2 className="animate-spin" style={{ color: "var(--lagoon)" }} /></div>
					) : (
						<div className="space-y-2">
							{assets
								.filter((a) => a.status === "active")
								.map((a) => (
									<div key={a._id} className="island-shell rounded-xl px-4 py-3 flex items-center gap-3">
										<Snowflake size={14} style={{ color: "#60a5fa" }} />
										<span className="text-sm" style={{ color: "var(--sea-ink)" }}>{a.name}</span>
										<span className="text-xs ml-auto capitalize" style={{ color: "var(--sea-ink-soft)" }}>{a.category.replace("_", " ")}</span>
									</div>
								))}
							{assets.filter((a) => a.status === "active").length === 0 && (
								<p className="text-sm" style={{ color: "var(--sea-ink-soft)" }}>No active assets.</p>
							)}
						</div>
					)}

					<div className="flex gap-2">
						<Button variant="ghost" onClick={() => setStep("templates")}>Back</Button>
						<Button
							onClick={handleApplyTemplates}
							disabled={saving}
							className="flex-1"
							style={{ background: "var(--palm)", color: "white", border: "none" }}
						>
							{saving ? "Creating tasks..." : "Create All Tasks"}
						</Button>
					</div>
				</div>
			)}

			{step === "summary" && (
				<div className="rise-in text-center space-y-4">
					<div
						className="size-16 rounded-full flex items-center justify-center mx-auto"
						style={{ background: "rgba(74,222,128,0.15)" }}
					>
						<CheckCircle2 size={32} style={{ color: "var(--palm)" }} />
					</div>
					<div>
						<p className="text-xl font-bold" style={{ color: "var(--sea-ink)" }}>All set!</p>
						<p className="text-sm mt-1" style={{ color: "var(--sea-ink-soft)" }}>
							{createdTaskCount} task{createdTaskCount !== 1 ? "s" : ""} created for the closing season.
						</p>
					</div>
					<Button
						onClick={() => navigate({ to: "/tasks" })}
						className="w-full"
						style={{ background: "linear-gradient(135deg, var(--palm), var(--lagoon-deep))", color: "white", border: "none" }}
					>
						View Tasks
					</Button>
				</div>
			)}
		</div>
	)
}
