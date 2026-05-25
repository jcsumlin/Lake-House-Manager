import { useAuthActions, useConvexAuth } from "@convex-dev/auth/react"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useConvexMutation, useConvexQuery } from "@convex-dev/react-query"
import { api } from "../../convex/_generated/api"
import type { Id } from "../../convex/_generated/dataModel"
import { Loader2 } from "lucide-react"
import { useEffect, useState } from "react"
import { Button } from "#/components/ui/button"
import { Input } from "#/components/ui/input"
import { Label } from "#/components/ui/label"

export const Route = createFileRoute("/invite/$membershipId")({
	component: InvitePage,
})

function InvitePage() {
	const { membershipId } = Route.useParams()
	const { isAuthenticated, isLoading } = useConvexAuth()
	const { signIn } = useAuthActions()
	const navigate = useNavigate()
	const [email, setEmail] = useState("")
	const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">("idle")
	const [errorMsg, setErrorMsg] = useState("")

	const invite = useConvexQuery(api.memberships.getInviteDetails, {
		membershipId: membershipId as Id<"memberships">,
	})

	const acceptMutation = useConvexMutation(api.memberships.acceptInvite)

	useEffect(() => {
		if (isAuthenticated && invite) {
			acceptMutation({ membershipId: membershipId as Id<"memberships"> })
				.then(() => navigate({ to: "/" }))
				.catch(() => setErrorMsg("Failed to accept invite. It may have already been used."))
		}
	}, [isAuthenticated, invite])

	if (isLoading || invite === undefined) {
		return (
			<div className="min-h-dvh flex items-center justify-center">
				<Loader2 className="animate-spin" style={{ color: "var(--lagoon)" }} />
			</div>
		)
	}

	if (!invite) {
		return (
			<div className="min-h-dvh flex items-center justify-center px-4">
				<div className="island-shell rounded-2xl p-8 max-w-sm w-full text-center">
					<h1 className="display-title text-2xl font-bold mb-2" style={{ color: "var(--sea-ink)" }}>
						Invite not found
					</h1>
					<p className="text-sm" style={{ color: "var(--sea-ink-soft)" }}>
						This invite link is invalid or has already been used.
					</p>
				</div>
			</div>
		)
	}

	if (isAuthenticated) {
		return (
			<div className="min-h-dvh flex items-center justify-center px-4">
				<div className="island-shell rounded-2xl p-8 max-w-sm w-full text-center">
					<Loader2 className="animate-spin mx-auto mb-4" style={{ color: "var(--lagoon)" }} />
					<p style={{ color: "var(--sea-ink-soft)" }}>Joining {invite.propertyName}…</p>
					{errorMsg && <p className="mt-2 text-sm text-red-500">{errorMsg}</p>}
				</div>
			</div>
		)
	}

	async function handleMagicLink(e: React.FormEvent) {
		e.preventDefault()
		if (!email) return
		setStatus("loading")
		setErrorMsg("")
		try {
			await signIn("resend-magic-link", { email })
			setStatus("sent")
		} catch {
			setStatus("error")
			setErrorMsg("Could not send the link. Try again.")
		}
	}

	return (
		<div className="min-h-dvh flex items-center justify-center px-4 py-12">
			<div className="island-shell rounded-2xl p-8 max-w-sm w-full rise-in">
				<div className="text-center mb-6">
					<h1 className="display-title text-2xl font-bold mb-1" style={{ color: "var(--sea-ink)" }}>
						You're invited
					</h1>
					<p className="text-sm" style={{ color: "var(--sea-ink-soft)" }}>
						Join <strong style={{ color: "var(--sea-ink)" }}>{invite.propertyName}</strong> on Lake House Manager.
					</p>
					{invite.email && (
						<p className="text-xs mt-1" style={{ color: "var(--sea-ink-soft)" }}>
							This invite is for <strong>{invite.email}</strong>
						</p>
					)}
				</div>

				{status === "sent" ? (
					<div className="rounded-xl p-5 text-center" style={{ background: "rgba(47, 106, 74, 0.08)", border: "1px solid rgba(47, 106, 74, 0.18)" }}>
						<p className="font-semibold text-sm mb-1" style={{ color: "var(--sea-ink)" }}>Check your inbox</p>
						<p className="text-xs" style={{ color: "var(--sea-ink-soft)" }}>
							We sent a sign-in link to <strong>{email}</strong>. Click it to accept this invite.
						</p>
					</div>
				) : (
					<form onSubmit={handleMagicLink} className="space-y-4">
						<div className="space-y-1.5">
							<Label htmlFor="invite-email" className="text-xs font-semibold" style={{ color: "var(--sea-ink-soft)" }}>
								Email address
							</Label>
							<Input
								id="invite-email"
								type="email"
								placeholder={invite.email ?? "you@example.com"}
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								required
								className="h-11"
							/>
						</div>
						{errorMsg && <p className="text-xs text-red-500">{errorMsg}</p>}
						<Button
							type="submit"
							disabled={status === "loading" || !email}
							className="w-full h-11 font-semibold"
							style={{ background: "linear-gradient(135deg, var(--palm), var(--lagoon-deep))", color: "white", border: "none" }}
						>
							{status === "loading" ? <Loader2 size={16} className="animate-spin" /> : "Send sign-in link"}
						</Button>
					</form>
				)}
			</div>
		</div>
	)
}
