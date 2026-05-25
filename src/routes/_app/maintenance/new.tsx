import { useConvexMutation } from "@convex-dev/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { api } from "../../../../convex/_generated/api"
import { useCurrentMember } from "#/lib/auth/useCurrentMember"
import { ArrowLeft, Loader2 } from "lucide-react"
import { useState } from "react"
import { Button } from "#/components/ui/button"
import { Input } from "#/components/ui/input"
import { Label } from "#/components/ui/label"
import { Textarea } from "#/components/ui/textarea"
import { Link } from "@tanstack/react-router"

export const Route = createFileRoute("/_app/maintenance/new")({
	component: NewIssuePage,
})

const CATEGORIES = [
	{ value: "plumbing", label: "Plumbing" },
	{ value: "electrical", label: "Electrical" },
	{ value: "hvac", label: "HVAC" },
	{ value: "structural", label: "Structural" },
	{ value: "appliance", label: "Appliance" },
	{ value: "dock_boat", label: "Dock / Boat" },
	{ value: "landscaping", label: "Landscaping" },
	{ value: "pest", label: "Pest" },
	{ value: "other", label: "Other" },
] as const

const PRIORITIES = ["low", "medium", "high", "urgent"] as const

function NewIssuePage() {
	const { property } = useCurrentMember()
	const navigate = useNavigate()
	const createIssue = useConvexMutation(api.maintenance.create)

	const [title, setTitle] = useState("")
	const [description, setDescription] = useState("")
	const [category, setCategory] = useState<typeof CATEGORIES[number]["value"]>("other")
	const [area, setArea] = useState("")
	const [priority, setPriority] = useState<typeof PRIORITIES[number]>("medium")
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState("")

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault()
		if (!property) return
		setLoading(true)
		setError("")
		try {
			const issueId = await createIssue({
				propertyId: property._id,
				title,
				description: description || undefined,
				category,
				area: area || undefined,
				priority,
			})
			navigate({ to: "/maintenance/$issueId", params: { issueId } })
		} catch (err: unknown) {
			setError(err instanceof Error ? err.message : "Failed to create issue")
		} finally {
			setLoading(false)
		}
	}

	return (
		<div className="page-wrap py-6 max-w-lg">
			<Link to="/maintenance" className="inline-flex items-center gap-1.5 text-sm mb-4 font-medium" style={{ color: "var(--sea-ink-soft)" }}>
				<ArrowLeft size={14} /> Maintenance
			</Link>

			<div className="rise-in mb-6">
				<p className="island-kicker mb-1" style={{ color: "var(--kicker)" }}>Maintenance</p>
				<h1 className="display-title text-2xl font-bold" style={{ color: "var(--sea-ink)" }}>Report issue</h1>
			</div>

			<form onSubmit={handleSubmit} className="rise-in island-shell rounded-2xl p-6 space-y-4" style={{ animationDelay: "60ms" }}>
				<div className="space-y-1.5">
					<Label className="text-xs font-semibold" style={{ color: "var(--sea-ink-soft)" }}>Title</Label>
					<Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Leaking faucet in main bathroom" required className="h-10" />
				</div>

				<div className="space-y-1.5">
					<Label className="text-xs font-semibold" style={{ color: "var(--sea-ink-soft)" }}>Description (optional)</Label>
					<Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the issue in detail…" rows={3} />
				</div>

				<div className="space-y-1.5">
					<Label className="text-xs font-semibold" style={{ color: "var(--sea-ink-soft)" }}>Category</Label>
					<select
						value={category}
						onChange={(e) => setCategory(e.target.value as typeof category)}
						className="w-full h-10 rounded-lg border px-3 text-sm"
						style={{ background: "rgba(255,255,255,0.6)", borderColor: "var(--line)", color: "var(--sea-ink)" }}
					>
						{CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
					</select>
				</div>

				<div className="space-y-1.5">
					<Label className="text-xs font-semibold" style={{ color: "var(--sea-ink-soft)" }}>Area / Location (optional)</Label>
					<Input value={area} onChange={(e) => setArea(e.target.value)} placeholder="Main bathroom, kitchen, dock…" className="h-10" />
				</div>

				<div className="space-y-1.5">
					<Label className="text-xs font-semibold" style={{ color: "var(--sea-ink-soft)" }}>Priority</Label>
					<div className="grid grid-cols-4 gap-1">
						{PRIORITIES.map((p) => {
							const colors: Record<string, string> = { urgent: "#c83232", high: "#e07000", medium: "var(--lagoon)", low: "var(--sea-ink-soft)" }
							return (
								<button
									key={p}
									type="button"
									onClick={() => setPriority(p)}
									className="py-1.5 rounded-lg text-xs font-semibold capitalize transition-all"
									style={{
										background: priority === p ? `${colors[p]}18` : "rgba(0,0,0,0.04)",
										color: priority === p ? colors[p] : "var(--sea-ink-soft)",
										border: `1px solid ${priority === p ? `${colors[p]}40` : "var(--line)"}`,
									}}
								>
									{p}
								</button>
							)
						})}
					</div>
				</div>

				{error && <p className="text-xs text-red-500">{error}</p>}

				<div className="flex gap-2 pt-2">
					<Button type="button" variant="outline" onClick={() => navigate({ to: "/maintenance" })} className="flex-1">Cancel</Button>
					<Button type="submit" disabled={loading || !property} className="flex-1" style={{ background: "linear-gradient(135deg, var(--palm), var(--lagoon-deep))", color: "white", border: "none" }}>
						{loading ? <Loader2 size={16} className="animate-spin" /> : "Report issue"}
					</Button>
				</div>
			</form>
		</div>
	)
}
