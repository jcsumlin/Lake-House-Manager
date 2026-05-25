import { ConvexError, v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { logAudit, requireMembership } from "./lib/auth"

export const list = query({
	args: { propertyId: v.id("properties") },
	handler: async (ctx, args) => {
		await requireMembership(ctx, args.propertyId)
		return await ctx.db
			.query("taskTemplates")
			.withIndex("by_property", (q) => q.eq("propertyId", args.propertyId))
			.take(50)
	},
})

export const get = query({
	args: { templateId: v.id("taskTemplates") },
	handler: async (ctx, args) => {
		const template = await ctx.db.get(args.templateId)
		if (!template) return null
		await requireMembership(ctx, template.propertyId)
		return template
	},
})

export const create = mutation({
	args: {
		propertyId: v.id("properties"),
		name: v.string(),
		category: v.union(
			v.literal("check_in"),
			v.literal("check_out"),
			v.literal("opening"),
			v.literal("closing"),
			v.literal("seasonal"),
			v.literal("custom"),
		),
		checklistItems: v.array(v.object({ title: v.string(), order: v.number() })),
		seasonalTag: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const { user } = await requireMembership(ctx, args.propertyId, "family_admin")
		const templateId = await ctx.db.insert("taskTemplates", args)
		await logAudit(ctx, {
			propertyId: args.propertyId,
			actorUserId: user._id,
			entityType: "taskTemplate",
			entityId: templateId,
			action: "create",
		})
		return templateId
	},
})

export const update = mutation({
	args: {
		templateId: v.id("taskTemplates"),
		name: v.optional(v.string()),
		checklistItems: v.optional(v.array(v.object({ title: v.string(), order: v.number() }))),
	},
	handler: async (ctx, args) => {
		const template = await ctx.db.get(args.templateId)
		if (!template) throw new ConvexError("Template not found")
		const { user } = await requireMembership(ctx, template.propertyId, "family_admin")

		const { templateId, ...updates } = args
		const filtered = Object.fromEntries(
			Object.entries(updates).filter(([, v]) => v !== undefined),
		)
		await ctx.db.patch(templateId, filtered)
		await logAudit(ctx, {
			propertyId: template.propertyId,
			actorUserId: user._id,
			entityType: "taskTemplate",
			entityId: templateId,
			action: "update",
		})
	},
})

export const remove = mutation({
	args: { templateId: v.id("taskTemplates") },
	handler: async (ctx, args) => {
		const template = await ctx.db.get(args.templateId)
		if (!template) throw new ConvexError("Template not found")
		const { user } = await requireMembership(ctx, template.propertyId, "family_admin")
		await ctx.db.delete(args.templateId)
		await logAudit(ctx, {
			propertyId: template.propertyId,
			actorUserId: user._id,
			entityType: "taskTemplate",
			entityId: args.templateId,
			action: "delete",
		})
	},
})

export const applyToStay = mutation({
	args: {
		templateId: v.id("taskTemplates"),
		stayId: v.id("stays"),
	},
	handler: async (ctx, args) => {
		const template = await ctx.db.get(args.templateId)
		if (!template) throw new ConvexError("Template not found")
		const stay = await ctx.db.get(args.stayId)
		if (!stay) throw new ConvexError("Stay not found")
		const { user } = await requireMembership(ctx, template.propertyId)

		await Promise.all(
			template.checklistItems.map((item) =>
				ctx.db.insert("tasks", {
					propertyId: template.propertyId,
					title: item.title,
					type: "checklist",
					status: "todo",
					priority: "medium",
					linkedStayId: args.stayId,
					createdBy: user._id,
				}),
			),
		)
	},
})
