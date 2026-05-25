import { useConvexMutation, useConvexQuery } from "@convex-dev/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { api } from "../../../../convex/_generated/api"
import type { Id } from "../../../../convex/_generated/dataModel"
import { useCurrentMember, canManageMembers, type MemberRole } from "#/lib/auth/useCurrentMember"
import { ArrowLeft, Loader2, Plus, Trash2 } from "lucide-react"
import { useState } from "react"
import { Button } from "#/components/ui/button"
import { Input } from "#/components/ui/input"
import { Label } from "#/components/ui/label"

export const Route = createFileRoute("/_app/settings/members")({
	component: MembersPage,
})

const ROLES = [
	{ value: "family_admin", label: "Family Admin" },
	{ value: "family_member", label: "Family Member" },
	{ value: "guest", label: "Guest" },
] as const

const ROLE_LABELS: Record<string, string> = {
	super_admin: "Super Admin",
	family_admin: "Family Admin",
	family_member: "Family Member",
	guest: "Guest",
}

function MembersPage() {
	const { property, membership: myMembership } = useCurrentMember()
	const members = useConvexQuery(
		api.memberships.listForProperty,
		property ? { propertyId: property._id } : "skip",
	)
	const inviteMutation = useConvexMutation(api.memberships.inviteByEmail)
	const removeMutation = useConvexMutation(api.memberships.removeMember)

	const [showInvite, setShowInvite] = useState(false)
	const [inviteEmail, setInviteEmail] = useState("")
	const [inviteRole, setInviteRole] = useState<(typeof ROLES)[number]["value"]>("family_member")
	const [inviting, setInviting] = useState(false)
	const [inviteError, setInviteError] = useState("")
	const [inviteSuccess, setInviteSuccess] = useState("")

	const canManage = canManageMembers(myMembership?.role as MemberRole | undefined)

	async function handleInvite(e: React.FormEvent) {
		e.preventDefault()
		if (!property) return
		setInviting(true)
		setInviteError("")
		setInviteSuccess("")
		try {
			await inviteMutation({ propertyId: property._id, email: inviteEmail, role: inviteRole })
			setInviteSuccess(`Invited ${inviteEmail}`)
			setInviteEmail("")
			setShowInvite(false)
		} catch (err: unknown) {
			setInviteError(err instanceof Error ? err.message : "Failed to invite")
		} finally {
			setInviting(false)
		}
	}

	return (
		<div className="page-wrap py-6 max-w-lg">
			<Link to="/settings" className="inline-flex items-center gap-1.5 text-sm mb-4 font-medium" style={{ color: "var(--sea-ink-soft)" }}>
				<ArrowLeft size={14} /> Settings
			</Link>

			<div className="rise-in flex items-center justify-between mb-6">
				<div>
					<p className="island-kicker mb-1" style={{ color: "var(--kicker)" }}>Settings</p>
					<h1 className="display-title text-2xl font-bold" style={{ color: "var(--sea-ink)" }}>Members</h1>
				</div>
				{canManage && (
					<Button
						size="sm"
						onClick={() => setShowInvite(true)}
						style={{ background: "linear-gradient(135deg, var(--palm), var(--lagoon-deep))", color: "white", border: "none" }}
					>
						<Plus size={14} className="mr-1" /> Invite
					</Button>
				)}
			</div>

			{inviteSuccess && (
				<div className="rise-in rounded-xl px-4 py-2.5 mb-4 text-sm font-medium" style={{ background: "rgba(47,106,74,0.1)", color: "var(--palm)", border: "1px solid rgba(47,106,74,0.2)" }}>
					{inviteSuccess}
				</div>
			)}

			{showInvite && (
				<form onSubmit={handleInvite} className="rise-in island-shell rounded-2xl p-5 mb-4 space-y-3">
					<p className="font-semibold text-sm" style={{ color: "var(--sea-ink)" }}>Invite member</p>
					<div className="space-y-1.5">
						<Label className="text-xs font-semibold" style={{ color: "var(--sea-ink-soft)" }}>Email</Label>
						<Input
							type="email"
							value={inviteEmail}
							onChange={(e) => setInviteEmail(e.target.value)}
							placeholder="family@example.com"
							required
							className="h-10"
						/>
					</div>
					<div className="space-y-1.5">
						<Label className="text-xs font-semibold" style={{ color: "var(--sea-ink-soft)" }}>Role</Label>
						<div className="flex gap-1">
							{ROLES.map((r) => (
								<button
									key={r.value}
									type="button"
									onClick={() => setInviteRole(r.value)}
									className="flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all"
									style={{
										background: inviteRole === r.value ? "rgba(47,106,74,0.15)" : "rgba(0,0,0,0.04)",
										color: inviteRole === r.value ? "var(--palm)" : "var(--sea-ink-soft)",
										border: `1px solid ${inviteRole === r.value ? "rgba(47,106,74,0.3)" : "var(--line)"}`,
									}}
								>
									{r.label}
								</button>
							))}
						</div>
					</div>
					{inviteError && <p className="text-xs text-red-500">{inviteError}</p>}
					<div className="flex gap-2">
						<Button type="button" variant="outline" onClick={() => setShowInvite(false)} className="flex-1">Cancel</Button>
						<Button type="submit" disabled={inviting} className="flex-1" style={{ background: "var(--palm)", color: "white", border: "none" }}>
							{inviting ? <Loader2 size={14} className="animate-spin" /> : "Send invite"}
						</Button>
					</div>
				</form>
			)}

			{members === undefined ? (
				<div className="flex justify-center py-12"><Loader2 className="animate-spin" style={{ color: "var(--lagoon)" }} /></div>
			) : (
				<div className="space-y-2">
					{members.map((m) => (
						<div key={m._id} className="rise-in island-shell rounded-xl px-4 py-3 flex items-center gap-3">
							<span
								className="size-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
								style={{ background: "rgba(47,106,74,0.15)", color: "var(--palm)" }}
							>
								{(m.userEmail || m.email || "?").charAt(0).toUpperCase()}
							</span>
							<div className="flex-1 min-w-0">
								<p className="text-sm font-semibold truncate" style={{ color: "var(--sea-ink)" }}>
									{m.userName !== "Unknown" ? m.userName : (m.userEmail || m.email)}
								</p>
								<div className="flex items-center gap-2">
									<span
										className="text-[10px] font-semibold px-1.5 py-px rounded-full"
										style={{
											background: m.status === "active" ? "rgba(47,106,74,0.1)" : "rgba(180,120,0,0.1)",
											color: m.status === "active" ? "var(--palm)" : "#b47800",
										}}
									>
										{ROLE_LABELS[m.role] ?? m.role}
									</span>
									{m.status === "invited" && (
										<span className="text-[10px] font-semibold px-1.5 py-px rounded-full" style={{ background: "rgba(0,0,0,0.06)", color: "var(--sea-ink-soft)" }}>
											Pending
										</span>
									)}
								</div>
							</div>
							{canManage && m.role !== "super_admin" && m.userId !== myMembership?.userId && (
								<Button
									size="icon-sm"
									variant="ghost"
									onClick={() => removeMutation({ membershipId: m._id as Id<"memberships"> })}
									style={{ color: "var(--sea-ink-soft)" }}
								>
									<Trash2 size={14} />
								</Button>
							)}
						</div>
					))}
				</div>
			)}
		</div>
	)
}
