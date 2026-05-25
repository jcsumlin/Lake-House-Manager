import { ConvexError } from "convex/values"
import type { Id } from "../_generated/dataModel"
import type { MutationCtx, QueryCtx } from "../_generated/server"
import { hasMinRole, type Role } from "./permissions"
import { getAuthUserId } from "@convex-dev/auth/server"

export async function requireAuth(ctx: QueryCtx | MutationCtx) {
	const identity = await ctx.auth.getUserIdentity()
	if (!identity) throw new ConvexError("Unauthorized")
	return identity
}

export async function requireMembership(
	ctx: QueryCtx | MutationCtx,
	propertyId: Id<"properties">,
	minRole?: Role,
) {
	await requireAuth(ctx)

	const userId = await getAuthUserId(ctx)
	const user = await ctx.db
		.query("users")
		.filter((q) => q.eq(q.field("_id"), userId))
		.first()
	if (!user || !userId) throw new ConvexError("User not found")

	const membership = await ctx.db
		.query("memberships")
		.withIndex("by_user_and_property", (q) =>
			q.eq("userId", userId).eq("propertyId", propertyId),
		)
		.first()

	if (!membership || membership.status !== "active") {
		throw new ConvexError("Not a member of this property")
	}

	if (minRole && !hasMinRole(membership.role as Role, minRole)) {
		throw new ConvexError("Insufficient permissions")
	}

	return { membership, user }
}

export async function getCurrentUser(ctx: QueryCtx | MutationCtx) {
	const userId = await getAuthUserId(ctx)
	if (!userId) return null
	const user = await ctx.db
		.query("users")
		.filter((q) => q.eq(q.field("_id"), userId))
		.first()
	return user ?? null
}

export async function logAudit(
	ctx: MutationCtx,
	{
		propertyId,
		actorUserId,
		entityType,
		entityId,
		action,
		metadata,
	}: {
		propertyId: Id<"properties">
		actorUserId: Id<"users">
		entityType: string
		entityId: string
		action: string
		metadata?: Record<string, unknown>
	},
) {
	await ctx.db.insert("auditLogs", {
		propertyId,
		actorUserId,
		entityType,
		entityId,
		action,
		metadata,
	})
}
