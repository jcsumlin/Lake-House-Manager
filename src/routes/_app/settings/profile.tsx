import { useAuthActions } from "@convex-dev/auth/react"
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { ArrowLeft, LogOut } from "lucide-react"
import { useCurrentMember } from "#/lib/auth/useCurrentMember"
import { Button } from "#/components/ui/button"

export const Route = createFileRoute("/_app/settings/profile")({
	component: ProfilePage,
})

const ROLE_LABELS: Record<string, string> = {
	super_admin: "Super Admin",
	family_admin: "Family Admin",
	family_member: "Family Member",
	guest: "Guest",
}

function ProfilePage() {
	const { membership, property } = useCurrentMember()
	const { signOut } = useAuthActions()
	const navigate = useNavigate()

	async function handleSignOut() {
		await signOut()
		navigate({ to: "/login" })
	}

	return (
		<div className="page-wrap py-6 max-w-md">
			<Link to="/settings" className="inline-flex items-center gap-1.5 text-sm mb-4 font-medium" style={{ color: "var(--sea-ink-soft)" }}>
				<ArrowLeft size={14} /> Settings
			</Link>

			<div className="rise-in mb-6">
				<p className="island-kicker mb-1" style={{ color: "var(--kicker)" }}>Settings</p>
				<h1 className="display-title text-2xl font-bold" style={{ color: "var(--sea-ink)" }}>Profile</h1>
			</div>

			<div className="rise-in island-shell rounded-2xl p-6 space-y-4" style={{ animationDelay: "60ms" }}>
				{membership && (
					<>
						<div className="flex items-center gap-4">
							<span
								className="size-14 rounded-2xl flex items-center justify-center text-xl font-bold"
								style={{ background: "linear-gradient(135deg, var(--lagoon), var(--palm))", color: "white" }}
							>
								{membership.email?.charAt(0).toUpperCase() ?? "?"}
							</span>
							<div>
								<p className="font-semibold" style={{ color: "var(--sea-ink)" }}>{membership.email ?? "Unknown"}</p>
								<p className="text-xs mt-0.5" style={{ color: "var(--sea-ink-soft)" }}>
									{ROLE_LABELS[membership.role] ?? membership.role}
									{property ? ` · ${property.name}` : ""}
								</p>
							</div>
						</div>
						<div className="h-px" style={{ background: "var(--line)" }} />
					</>
				)}

				<Button
					onClick={handleSignOut}
					variant="outline"
					className="w-full gap-2"
					style={{ color: "var(--sea-ink-soft)" }}
				>
					<LogOut size={15} /> Sign out
				</Button>
			</div>
		</div>
	)
}
