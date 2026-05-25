import { ConvexError, v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { logAudit, requireAuth, requireMembership } from "./lib/auth"
import { hasMinRole, roleValidator, type Role } from "./lib/permissions"

export const listForProperty = query({
	args: { propertyId: v.id("properties") },
	handler: async (ctx, args) => {
		await requireMembership(ctx, args.propertyId)
		const memberships = await ctx.db
			.query("memberships")
			.withIndex("by_property", (q) => q.eq("propertyId", args.propertyId))
			.take(100)

		const withUsers = await Promise.all(
			memberships.map(async (m) => {
				const user = await ctx.db.get(m.userId)
				return {
					...m,
					userName: user?.name ?? m.email ?? "Unknown",
					userEmail: user?.email ?? m.email ?? "",
				}
			}),
		)
		return withUsers
	},
})

export const inviteByEmail = mutation({
	args: {
		propertyId: v.id("properties"),
		email: v.string(),
		role: roleValidator,
	},
	handler: async (ctx, args) => {
		const { user } = await requireMembership(ctx, args.propertyId, "family_admin")

		const existing = await ctx.db
			.query("memberships")
			.withIndex("by_property", (q) => q.eq("propertyId", args.propertyId))
			.filter((q) => q.eq(q.field("email"), args.email))
			.first()
		if (existing) throw new ConvexError("User already invited or a member")

		const inviteToken = `${Date.now()}-${Math.random().toString(36).slice(2)}`

		const invitedUser = await ctx.db
			.query("users")
			.filter((q) => q.eq(q.field("email"), args.email))
			.first()

		const membershipId = await ctx.db.insert("memberships", {
			userId: invitedUser?._id ?? user._id,
			propertyId: args.propertyId,
			role: args.role as Role,
			status: "invited",
			email: args.email,
		})

		await logAudit(ctx, {
			propertyId: args.propertyId,
			actorUserId: user._id,
			entityType: "membership",
			entityId: membershipId,
			action: "invite",
			metadata: { email: args.email, role: args.role },
		})

		return { membershipId, inviteToken }
	},
})

export const acceptInvite = mutation({
	args: { membershipId: v.id("memberships") },
	handler: async (ctx, args) => {
		const identity = await requireAuth(ctx)
		const user = await ctx.db
			.query("users")
			.filter((q) => q.eq(q.field("email"), identity.email))
			.first()
		if (!user) throw new ConvexError("User not found")

		const membership = await ctx.db.get(args.membershipId)
		if (!membership) throw new ConvexError("Invite not found")
		if (membership.status !== "invited") throw new ConvexError("Invite already used")
		if (membership.email && membership.email !== identity.email) {
			throw new ConvexError("This invite is for a different email address")
		}

		await ctx.db.patch(args.membershipId, {
			userId: user._id,
			status: "active",
		})
	},
})

export const updateRole = mutation({
	args: {
		membershipId: v.id("memberships"),
		role: roleValidator,
	},
	handler: async (ctx, args) => {
		const membership = await ctx.db.get(args.membershipId)
		if (!membership) throw new ConvexError("Membership not found")

		const { user } = await requireMembership(ctx, membership.propertyId, "family_admin")

		const currentUserMembership = await ctx.db
			.query("memberships")
			.withIndex("by_user_and_property", (q) =>
				q.eq("userId", user._id).eq("propertyId", membership.propertyId),
			)
			.unique()

		if (!currentUserMembership) throw new ConvexError("Not a member")
		if (!hasMinRole(currentUserMembership.role as Role, args.role as Role)) {
			throw new ConvexError("Cannot grant a role higher than your own")
		}

		await ctx.db.patch(args.membershipId, { role: args.role as Role })

		await logAudit(ctx, {
			propertyId: membership.propertyId,
			actorUserId: user._id,
			entityType: "membership",
			entityId: args.membershipId,
			action: "update_role",
			metadata: { newRole: args.role },
		})
	},
})

export const removeMember = mutation({
	args: { membershipId: v.id("memberships") },
	handler: async (ctx, args) => {
		const membership = await ctx.db.get(args.membershipId)
		if (!membership) throw new ConvexError("Membership not found")

		const { user } = await requireMembership(ctx, membership.propertyId, "family_admin")

		if (membership.userId === user._id) {
			throw new ConvexError("Cannot remove yourself")
		}

		await ctx.db.delete(args.membershipId)

		await logAudit(ctx, {
			propertyId: membership.propertyId,
			actorUserId: user._id,
			entityType: "membership",
			entityId: args.membershipId,
			action: "remove",
		})
	},
})

export const getInviteDetails = query({
	args: { membershipId: v.id("memberships") },
	handler: async (ctx, args) => {
		const membership = await ctx.db.get(args.membershipId)
		if (!membership || membership.status !== "invited") return null
		const property = await ctx.db.get(membership.propertyId)
		return {
			membership,
			propertyName: property?.name ?? "Unknown Property",
			email: membership.email,
		}
	},
})
