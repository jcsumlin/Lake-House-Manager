import { ConvexError, v } from "convex/values"
import { internalMutation, internalQuery, mutation, query } from "./_generated/server"
import { requireMembership } from "./lib/auth"
import { getAuthUserId } from "@convex-dev/auth/server"

export const subscribe = mutation({
	args: {
		propertyId: v.id("properties"),
		endpoint: v.string(),
		p256dh: v.string(),
		auth: v.string(),
		userAgent: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const { user } = await requireMembership(ctx, args.propertyId)

		const existing = await ctx.db
			.query("pushSubscriptions")
			.withIndex("by_endpoint", (q) => q.eq("endpoint", args.endpoint))
			.first()

		if (existing) {
			await ctx.db.patch(existing._id, {
				p256dh: args.p256dh,
				auth: args.auth,
				userAgent: args.userAgent,
			})
			return existing._id
		}

		return await ctx.db.insert("pushSubscriptions", {
			userId: user._id,
			propertyId: args.propertyId,
			endpoint: args.endpoint,
			p256dh: args.p256dh,
			auth: args.auth,
			userAgent: args.userAgent,
		})
	},
})

export const unsubscribe = mutation({
	args: { endpoint: v.string() },
	handler: async (ctx, args) => {
		const sub = await ctx.db
			.query("pushSubscriptions")
			.withIndex("by_endpoint", (q) => q.eq("endpoint", args.endpoint))
			.first()
		if (sub) await ctx.db.delete(sub._id)
	},
})

export const listUnread = query({
	args: { propertyId: v.id("properties") },
	handler: async (ctx, _args) => {
		const userId = await getAuthUserId(ctx)
		if (!userId) return []
		return await ctx.db
			.query("notifications")
			.withIndex("by_user_and_read", (q) => q.eq("userId", userId).eq("readAt", undefined))
			.take(50)
	},
})

export const markRead = mutation({
	args: { notificationId: v.id("notifications") },
	handler: async (ctx, args) => {
		const notif = await ctx.db.get(args.notificationId)
		if (!notif) throw new ConvexError("Notification not found")
		await ctx.db.patch(args.notificationId, { readAt: Date.now() })
	},
})

export const deleteSubscription = internalMutation({
	args: { endpoint: v.string() },
	handler: async (ctx, args) => {
		const sub = await ctx.db
			.query("pushSubscriptions")
			.withIndex("by_endpoint", (q) => q.eq("endpoint", args.endpoint))
			.first()
		if (sub) await ctx.db.delete(sub._id)
	},
})

export const getPropertySubscriptions = internalQuery({
	args: { propertyId: v.id("properties") },
	handler: async (ctx, args) => {
		return await ctx.db
			.query("pushSubscriptions")
			.withIndex("by_property", (q) => q.eq("propertyId", args.propertyId))
			.take(100)
	},
})

export const getUserSubscriptions = internalQuery({
	args: { userId: v.id("users") },
	handler: async (ctx, args) => {
		return await ctx.db
			.query("pushSubscriptions")
			.withIndex("by_user", (q) => q.eq("userId", args.userId))
			.take(20)
	},
})
