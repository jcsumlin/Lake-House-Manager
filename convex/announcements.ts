import { ConvexError, v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { logAudit, requireMembership } from "./lib/auth"

export const list = query({
	args: { propertyId: v.id("properties") },
	handler: async (ctx, args) => {
		await requireMembership(ctx, args.propertyId)
		const now = Date.now()
		const all = await ctx.db
			.query("announcements")
			.withIndex("by_property", (q) => q.eq("propertyId", args.propertyId))
			.order("desc")
			.take(50)
		return all.filter((a) => !a.expiresAt || a.expiresAt > now)
	},
})

export const get = query({
	args: { announcementId: v.id("announcements") },
	handler: async (ctx, args) => {
		const a = await ctx.db.get(args.announcementId)
		if (!a) return null
		await requireMembership(ctx, a.propertyId)
		return a
	},
})

export const create = mutation({
	args: {
		propertyId: v.id("properties"),
		title: v.string(),
		body: v.string(),
		pinned: v.boolean(),
		expiresAt: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		const { user } = await requireMembership(ctx, args.propertyId, "family_admin")
		const id = await ctx.db.insert("announcements", {
			...args,
			createdBy: user._id,
		})
		await logAudit(ctx, {
			propertyId: args.propertyId,
			actorUserId: user._id,
			entityType: "announcement",
			entityId: id,
			action: "create",
		})
		return id
	},
})

export const update = mutation({
	args: {
		announcementId: v.id("announcements"),
		title: v.optional(v.string()),
		body: v.optional(v.string()),
		pinned: v.optional(v.boolean()),
	},
	handler: async (ctx, args) => {
		const a = await ctx.db.get(args.announcementId)
		if (!a) throw new ConvexError("Announcement not found")
		const { user } = await requireMembership(ctx, a.propertyId, "family_admin")

		const { announcementId, ...updates } = args
		const filtered = Object.fromEntries(
			Object.entries(updates).filter(([, v]) => v !== undefined),
		)
		await ctx.db.patch(announcementId, filtered)
		await logAudit(ctx, {
			propertyId: a.propertyId,
			actorUserId: user._id,
			entityType: "announcement",
			entityId: announcementId,
			action: "update",
		})
	},
})

export const remove = mutation({
	args: { announcementId: v.id("announcements") },
	handler: async (ctx, args) => {
		const a = await ctx.db.get(args.announcementId)
		if (!a) throw new ConvexError("Announcement not found")
		const { user } = await requireMembership(ctx, a.propertyId, "family_admin")
		await ctx.db.delete(args.announcementId)
		await logAudit(ctx, {
			propertyId: a.propertyId,
			actorUserId: user._id,
			entityType: "announcement",
			entityId: args.announcementId,
			action: "delete",
		})
	},
})

export const pin = mutation({
	args: { announcementId: v.id("announcements"), pinned: v.boolean() },
	handler: async (ctx, args) => {
		const a = await ctx.db.get(args.announcementId)
		if (!a) throw new ConvexError("Announcement not found")
		const { user } = await requireMembership(ctx, a.propertyId, "family_admin")
		await ctx.db.patch(args.announcementId, { pinned: args.pinned })
		await logAudit(ctx, {
			propertyId: a.propertyId,
			actorUserId: user._id,
			entityType: "announcement",
			entityId: args.announcementId,
			action: args.pinned ? "pin" : "unpin",
		})
	},
})
