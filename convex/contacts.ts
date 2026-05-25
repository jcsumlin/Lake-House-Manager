import { ConvexError, v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { logAudit, requireMembership } from "./lib/auth"

const typeValues = v.union(
	v.literal("emergency"),
	v.literal("vendor"),
	v.literal("utility"),
	v.literal("neighbor"),
	v.literal("family"),
	v.literal("other"),
)

export const list = query({
	args: {
		propertyId: v.id("properties"),
		type: v.optional(typeValues),
	},
	handler: async (ctx, args) => {
		await requireMembership(ctx, args.propertyId)
		return await ctx.db
			.query("contacts")
			.withIndex("by_property", (q) => q.eq("propertyId", args.propertyId))
			.take(100)
	},
})

export const get = query({
	args: { contactId: v.id("contacts") },
	handler: async (ctx, args) => {
		const contact = await ctx.db.get(args.contactId)
		if (!contact) return null
		await requireMembership(ctx, contact.propertyId)
		return contact
	},
})

export const create = mutation({
	args: {
		propertyId: v.id("properties"),
		name: v.string(),
		type: typeValues,
		phone: v.optional(v.string()),
		email: v.optional(v.string()),
		notes: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const { user } = await requireMembership(ctx, args.propertyId)
		const contactId = await ctx.db.insert("contacts", args)
		await logAudit(ctx, {
			propertyId: args.propertyId,
			actorUserId: user._id,
			entityType: "contact",
			entityId: contactId,
			action: "create",
		})
		return contactId
	},
})

export const update = mutation({
	args: {
		contactId: v.id("contacts"),
		name: v.optional(v.string()),
		type: v.optional(typeValues),
		phone: v.optional(v.string()),
		email: v.optional(v.string()),
		notes: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const contact = await ctx.db.get(args.contactId)
		if (!contact) throw new ConvexError("Contact not found")
		const { user } = await requireMembership(ctx, contact.propertyId)

		const { contactId, ...updates } = args
		const filtered = Object.fromEntries(
			Object.entries(updates).filter(([, v]) => v !== undefined),
		)
		await ctx.db.patch(contactId, filtered)
		await logAudit(ctx, {
			propertyId: contact.propertyId,
			actorUserId: user._id,
			entityType: "contact",
			entityId: contactId,
			action: "update",
		})
	},
})

export const remove = mutation({
	args: { contactId: v.id("contacts") },
	handler: async (ctx, args) => {
		const contact = await ctx.db.get(args.contactId)
		if (!contact) throw new ConvexError("Contact not found")
		const { user } = await requireMembership(ctx, contact.propertyId)
		await ctx.db.delete(args.contactId)
		await logAudit(ctx, {
			propertyId: contact.propertyId,
			actorUserId: user._id,
			entityType: "contact",
			entityId: args.contactId,
			action: "delete",
		})
	},
})
