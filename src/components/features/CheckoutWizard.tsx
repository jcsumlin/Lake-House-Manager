import { useConvexMutation, useConvexQuery } from "@convex-dev/react-query"
import { api } from "../../../convex/_generated/api"
import type { Id } from "../../../convex/_generated/dataModel"
import { CheckCircle2, Loader2, X } from "lucide-react"
import { useState } from "react"
import { Button } from "#/components/ui/button"

interface Props {
	stayId: Id<"stays">
	onClose: () => void
}

type Step = "generate" | "tasks" | "payment" | "confirm"

export function CheckoutWizard({ stayId, onClose }: Props) {
	const [step, setStep] = useState<Step>("generate")
	const [cleaningCost, setCleaningCost] = useState("")
	const [cleaningPaymentMethod, setCleaningPaymentMethod] = useState("")
	const [checkoutNotes, setCheckoutNotes] = useState("")
	const [saving, setSaving] = useState(false)

	const status = useConvexQuery(api.checkout.getCheckoutStatus, { stayId })
	const startCheckoutMutation = useConvexMutation(api.checkout.startCheckout)
	const completeCheckoutMutation = useConvexMutation(api.checkout.completeCheckout)

	async function handleGenerateChecklist() {
		setSaving(true)
		try {
			await startCheckoutMutation({ stayId })
			setStep("tasks")
		} finally {
			setSaving(false)
		}
	}

	async function handleComplete() {
		setSaving(true)
		try {
			await completeCheckoutMutation({
				stayId,
				cleaningCost: cleaningCost ? Number(cleaningCost) : undefined,
				cleaningPaymentMethod: cleaningPaymentMethod || undefined,
				checkoutNotes: checkoutNotes || undefined,
			})
			setStep("confirm")
		} finally {
			setSaving(false)
		}
	}

	return (
		<div
			className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4"
			style={{ background: "rgba(23,58,64,0.4)", backdropFilter: "blur(4px)" }}
		>
			<div
				className="w-full max-w-md rounded-2xl p-6"
				style={{
					background: "var(--surface-strong)",
					border: "1px solid var(--line)",
					boxShadow: "0 -8px 40px rgba(23,58,64,0.16)",
				}}
			>
				<div className="flex items-center justify-between mb-5">
					<div>
						<p className="text-xs font-semibold" style={{ color: "var(--kicker)" }}>Checkout</p>
						<h2 className="text-lg font-bold" style={{ color: "var(--sea-ink)" }}>
							{step === "generate" && "Generate Checklist"}
							{step === "tasks" && "Complete Tasks"}
							{step === "payment" && "Log Payment"}
							{step === "confirm" && "All Done!"}
						</h2>
					</div>
					{step !== "confirm" && (
						<button type="button" onClick={onClose} className="p-1 rounded-lg" style={{ color: "var(--sea-ink-soft)" }}>
							<X size={18} />
						</button>
					)}
				</div>

				{step === "generate" && (
					<div className="space-y-4">
						<p className="text-sm" style={{ color: "var(--sea-ink-soft)" }}>
							This will create checkout tasks from your property's default check-out template.
						</p>
						{status?.checkoutCompletedAt ? (
							<div className="rounded-xl p-4" style={{ background: "rgba(47,106,74,0.1)" }}>
								<p className="text-sm font-semibold" style={{ color: "var(--palm)" }}>
									Checkout already completed on {new Date(status.checkoutCompletedAt).toLocaleDateString()}.
								</p>
							</div>
						) : (
							<Button
								onClick={handleGenerateChecklist}
								disabled={saving}
								className="w-full"
								style={{ background: "var(--lagoon)", color: "white", border: "none" }}
							>
								{saving ? <Loader2 size={14} className="animate-spin" /> : "Generate Checklist"}
							</Button>
						)}
					</div>
				)}

				{step === "tasks" && status && (
					<div className="space-y-4">
						<div className="flex items-center justify-between text-sm">
							<span style={{ color: "var(--sea-ink-soft)" }}>Progress</span>
							<span className="font-semibold" style={{ color: "var(--sea-ink)" }}>
								{status.tasksDone}/{status.tasksTotal} done
							</span>
						</div>
						<div
							className="h-2 rounded-full overflow-hidden"
							style={{ background: "rgba(0,0,0,0.06)" }}
						>
							<div
								className="h-full rounded-full transition-all"
								style={{
									width: status.tasksTotal ? `${(status.tasksDone / status.tasksTotal) * 100}%` : "0%",
									background: "linear-gradient(90deg, var(--lagoon), var(--palm))",
								}}
							/>
						</div>
						<p className="text-xs" style={{ color: "var(--sea-ink-soft)" }}>
							Mark tasks complete in the Tasks section, then come back here to log payment.
						</p>
						<Button
							onClick={() => setStep("payment")}
							className="w-full"
							style={{ background: "var(--palm)", color: "white", border: "none" }}
						>
							Continue to Payment
						</Button>
					</div>
				)}

				{step === "payment" && (
					<div className="space-y-4">
						<div>
							<label className="block text-xs font-semibold mb-1" style={{ color: "var(--sea-ink-soft)" }}>Cleaning cost (optional)</label>
							<input
								type="number"
								className="w-full px-3 py-2 rounded-lg text-sm border"
								style={{ background: "var(--surface-strong)", color: "var(--sea-ink)", borderColor: "var(--line)" }}
								value={cleaningCost}
								onChange={(e) => setCleaningCost(e.target.value)}
								placeholder="0.00"
							/>
						</div>
						<div>
							<label className="block text-xs font-semibold mb-1" style={{ color: "var(--sea-ink-soft)" }}>Payment method</label>
							<input
								className="w-full px-3 py-2 rounded-lg text-sm border"
								style={{ background: "var(--surface-strong)", color: "var(--sea-ink)", borderColor: "var(--line)" }}
								value={cleaningPaymentMethod}
								onChange={(e) => setCleaningPaymentMethod(e.target.value)}
								placeholder="Venmo, check, etc."
							/>
						</div>
						<div>
							<label className="block text-xs font-semibold mb-1" style={{ color: "var(--sea-ink-soft)" }}>Notes</label>
							<textarea
								className="w-full px-3 py-2 rounded-lg text-sm border"
								style={{ background: "var(--surface-strong)", color: "var(--sea-ink)", borderColor: "var(--line)" }}
								rows={2}
								value={checkoutNotes}
								onChange={(e) => setCheckoutNotes(e.target.value)}
								placeholder="Any notes for the next guests..."
							/>
						</div>
						<div className="flex gap-2">
							<Button variant="ghost" onClick={() => setStep("tasks")}>Back</Button>
							<Button
								onClick={handleComplete}
								disabled={saving}
								className="flex-1"
								style={{ background: "var(--palm)", color: "white", border: "none" }}
							>
								{saving ? <Loader2 size={14} className="animate-spin" /> : "Complete Checkout"}
							</Button>
						</div>
					</div>
				)}

				{step === "confirm" && (
					<div className="text-center space-y-4">
						<div className="size-14 rounded-full flex items-center justify-center mx-auto" style={{ background: "rgba(74,222,128,0.15)" }}>
							<CheckCircle2 size={28} style={{ color: "var(--palm)" }} />
						</div>
						<div>
							<p className="font-semibold" style={{ color: "var(--sea-ink)" }}>Checkout complete!</p>
							<p className="text-sm mt-1" style={{ color: "var(--sea-ink-soft)" }}>The stay has been marked as checked out.</p>
						</div>
						<Button onClick={onClose} className="w-full" style={{ background: "var(--lagoon)", color: "white", border: "none" }}>
							Done
						</Button>
					</div>
				)}
			</div>
		</div>
	)
}
