import { ConvexError, v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { logAudit, requireMembership } from "./lib/auth"

const categoryValues = v.union(
	v.literal("guide"),
	v.literal("manual"),
	v.literal("permit"),
	v.literal("insurance"),
	v.literal("contact"),
	v.literal("rules"),
	v.literal("other"),
)

export const list = query({
	args: {
		propertyId: v.id("properties"),
		category: v.optional(categoryValues),
	},
	handler: async (ctx, args) => {
		const { membership } = await requireMembership(ctx, args.propertyId)
		const isAdmin = membership.role === "super_admin" || membership.role === "family_admin"

		let q = args.category
			? ctx.db
					.query("documents")
					.withIndex("by_property_and_category", (iq) =>
						iq.eq("propertyId", args.propertyId).eq("category", args.category!),
					)
			: ctx.db
					.query("documents")
					.withIndex("by_property", (iq) => iq.eq("propertyId", args.propertyId))

		const docs = await q.take(100)
		return isAdmin ? docs : docs.filter((d) => d.visibility === "all")
	},
})

export const get = query({
	args: { documentId: v.id("documents") },
	handler: async (ctx, args) => {
		const doc = await ctx.db.get(args.documentId)
		if (!doc) return null
		const { membership } = await requireMembership(ctx, doc.propertyId)
		const isAdmin = membership.role === "super_admin" || membership.role === "family_admin"
		if (doc.visibility === "admins" && !isAdmin) {
			throw new ConvexError("Insufficient permissions")
		}
		return doc
	},
})

export const create = mutation({
	args: {
		propertyId: v.id("properties"),
		title: v.string(),
		category: categoryValues,
		description: v.optional(v.string()),
		content: v.optional(v.string()),
		visibility: v.union(v.literal("all"), v.literal("admins")),
	},
	handler: async (ctx, args) => {
		const { user } = await requireMembership(ctx, args.propertyId, "family_admin")
		const docId = await ctx.db.insert("documents", {
			...args,
			uploadedBy: user._id,
		})
		await logAudit(ctx, {
			propertyId: args.propertyId,
			actorUserId: user._id,
			entityType: "document",
			entityId: docId,
			action: "create",
		})
		return docId
	},
})

export const update = mutation({
	args: {
		documentId: v.id("documents"),
		title: v.optional(v.string()),
		description: v.optional(v.string()),
		content: v.optional(v.string()),
		visibility: v.optional(v.union(v.literal("all"), v.literal("admins"))),
	},
	handler: async (ctx, args) => {
		const doc = await ctx.db.get(args.documentId)
		if (!doc) throw new ConvexError("Document not found")
		const { user } = await requireMembership(ctx, doc.propertyId, "family_admin")

		const { documentId, ...updates } = args
		const filtered = Object.fromEntries(
			Object.entries(updates).filter(([, v]) => v !== undefined),
		)
		await ctx.db.patch(documentId, filtered)
		await logAudit(ctx, {
			propertyId: doc.propertyId,
			actorUserId: user._id,
			entityType: "document",
			entityId: documentId,
			action: "update",
		})
	},
})

export const remove = mutation({
	args: { documentId: v.id("documents") },
	handler: async (ctx, args) => {
		const doc = await ctx.db.get(args.documentId)
		if (!doc) throw new ConvexError("Document not found")
		const { user } = await requireMembership(ctx, doc.propertyId, "family_admin")
		await ctx.db.delete(args.documentId)
		await logAudit(ctx, {
			propertyId: doc.propertyId,
			actorUserId: user._id,
			entityType: "document",
			entityId: args.documentId,
			action: "delete",
		})
	},
})
