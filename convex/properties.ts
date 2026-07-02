import { ConvexError, v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { getCurrentUser, logAudit, requireAuth, requireMembership } from "./lib/auth"
import { getAuthUserId } from "@convex-dev/auth/server"

export const get = query({
	args: { propertyId: v.id("properties") },
	handler: async (ctx, args) => {
		await requireAuth(ctx)
		return await ctx.db.get(args.propertyId)
	},
})

export const getMyProperty = query({
	args: {},
	handler: async (ctx) => {
		const user = await getCurrentUser(ctx)
		if (!user) return null

		const membership = await ctx.db
			.query("memberships")
			.withIndex("by_user", (q) => q.eq("userId", user._id))
			.filter((q) => q.eq(q.field("status"), "active"))
			.first()

		if (!membership) return null
		return await ctx.db.get(membership.propertyId)
	},
})

export const getMyMembership = query({
	args: {},
	handler: async (ctx) => {
		const user = await getCurrentUser(ctx)
		if (!user) return null

		const membership = await ctx.db
			.query("memberships")
			.withIndex("by_user", (q) => q.eq("userId", user._id))
			.filter((q) => q.eq(q.field("status"), "active"))
			.first()

		return membership ?? null
	},
})

export const create = mutation({
	args: {
		name: v.string(),
		timezone: v.string(),
		address: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		await requireAuth(ctx)
		const userId = await getAuthUserId(ctx)
		const user = await ctx.db
			.query("users")
			.filter((q) => q.eq(q.field("_id"), userId))
			.first()
		if (!user) throw new ConvexError("User not found")

		const existing = await ctx.db
			.query("memberships")
			.withIndex("by_user", (q) => q.eq("userId", user._id))
			.filter((q) => q.eq(q.field("status"), "active"))
			.first()
		if (existing) throw new ConvexError("User already has a property")

		const propertyId = await ctx.db.insert("properties", {
			name: args.name,
			timezone: args.timezone,
			address: args.address,
		})

		await ctx.db.insert("memberships", {
			userId: user._id,
			propertyId,
			role: "super_admin",
			status: "active",
			email: user.email ?? undefined,
		})

		return propertyId
	},
})

export const update = mutation({
	args: {
		propertyId: v.id("properties"),
		name: v.optional(v.string()),
		timezone: v.optional(v.string()),
		address: v.optional(v.string()),
		wifiName: v.optional(v.string()),
		wifiPassword: v.optional(v.string()),
		emergencyContacts: v.optional(v.string()),
		// Phase 2: weather & alerts
		weatherApiLat: v.optional(v.number()),
		weatherApiLon: v.optional(v.number()),
		freezeThresholdF: v.optional(v.number()),
		weatherAlertsEnabled: v.optional(v.boolean()),
		preArrivalReminderDays: v.optional(v.number()),
		// Phase 2: cleaning service
		cleaningServiceName: v.optional(v.string()),
		cleaningServicePhone: v.optional(v.string()),
		cleaningServiceInstructions: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const { user } = await requireMembership(ctx, args.propertyId, "family_admin")

		const { propertyId, ...updates } = args
		const filtered = Object.fromEntries(
			Object.entries(updates).filter(([, v]) => v !== undefined),
		)
		await ctx.db.patch(propertyId, filtered)

		await logAudit(ctx, {
			propertyId,
			actorUserId: user._id,
			entityType: "property",
			entityId: propertyId,
			action: "update",
		})
	},
})
