import { ConvexError, v } from "convex/values"
import { internalMutation, mutation, query } from "./_generated/server"
import { logAudit, requireMembership } from "./lib/auth"

export const list = query({
	args: {
		propertyId: v.id("properties"),
		status: v.optional(
			v.union(
				v.literal("todo"),
				v.literal("in_progress"),
				v.literal("done"),
				v.literal("skipped"),
			),
		),
		assignedToMe: v.optional(v.boolean()),
	},
	handler: async (ctx, args) => {
		const { user } = await requireMembership(ctx, args.propertyId)

		if (args.status) {
			let q = ctx.db
				.query("tasks")
				.withIndex("by_property_and_status", (iq) =>
					iq.eq("propertyId", args.propertyId).eq("status", args.status!),
				)
			if (args.assignedToMe) {
				q = q.filter((f) => f.eq(f.field("assignedTo"), user._id))
			}
			return await q.take(100)
		}

		let q = ctx.db
			.query("tasks")
			.withIndex("by_property", (iq) => iq.eq("propertyId", args.propertyId))
		if (args.assignedToMe) {
			q = q.filter((f) => f.eq(f.field("assignedTo"), user._id))
		}
		return await q.take(100)
	},
})

export const listToday = query({
	args: { propertyId: v.id("properties") },
	handler: async (ctx, args) => {
		await requireMembership(ctx, args.propertyId)
		const now = Date.now()
		const dayStart = new Date(new Date().toDateString()).getTime()
		const dayEnd = dayStart + 86400000

		return await ctx.db
			.query("tasks")
			.withIndex("by_property", (q) => q.eq("propertyId", args.propertyId))
			.filter((q) =>
				q.and(
					q.neq(q.field("status"), "done"),
					q.neq(q.field("status"), "skipped"),
					q.or(
						q.and(q.gte(q.field("dueAt"), dayStart), q.lt(q.field("dueAt"), dayEnd)),
						q.lte(q.field("dueAt"), now),
					),
				),
			)
			.take(50)
	},
})

export const get = query({
	args: { taskId: v.id("tasks") },
	handler: async (ctx, args) => {
		const task = await ctx.db.get(args.taskId)
		if (!task) return null
		await requireMembership(ctx, task.propertyId)
		return task
	},
})

export const create = mutation({
	args: {
		propertyId: v.id("properties"),
		title: v.string(),
		description: v.optional(v.string()),
		type: v.union(
			v.literal("checklist"),
			v.literal("chore"),
			v.literal("maintenance"),
			v.literal("seasonal"),
			v.literal("other"),
		),
		priority: v.union(
			v.literal("low"),
			v.literal("medium"),
			v.literal("high"),
			v.literal("urgent"),
		),
		assignedTo: v.optional(v.id("users")),
		dueAt: v.optional(v.number()),
		linkedStayId: v.optional(v.id("stays")),
	},
	handler: async (ctx, args) => {
		const { user } = await requireMembership(ctx, args.propertyId)
		const taskId = await ctx.db.insert("tasks", {
			...args,
			status: "todo",
			createdBy: user._id,
		})
		await logAudit(ctx, {
			propertyId: args.propertyId,
			actorUserId: user._id,
			entityType: "task",
			entityId: taskId,
			action: "create",
		})
		return taskId
	},
})

export const update = mutation({
	args: {
		taskId: v.id("tasks"),
		title: v.optional(v.string()),
		description: v.optional(v.string()),
		status: v.optional(
			v.union(
				v.literal("todo"),
				v.literal("in_progress"),
				v.literal("done"),
				v.literal("skipped"),
			),
		),
		priority: v.optional(
			v.union(
				v.literal("low"),
				v.literal("medium"),
				v.literal("high"),
				v.literal("urgent"),
			),
		),
		assignedTo: v.optional(v.id("users")),
		dueAt: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		const task = await ctx.db.get(args.taskId)
		if (!task) throw new ConvexError("Task not found")
		const { user } = await requireMembership(ctx, task.propertyId)

		const { taskId, ...updates } = args
		const filtered = Object.fromEntries(
			Object.entries(updates).filter(([, v]) => v !== undefined),
		)
		await ctx.db.patch(taskId, filtered)

		await logAudit(ctx, {
			propertyId: task.propertyId,
			actorUserId: user._id,
			entityType: "task",
			entityId: taskId,
			action: "update",
		})
	},
})

export const complete = mutation({
	args: { taskId: v.id("tasks") },
	handler: async (ctx, args) => {
		const task = await ctx.db.get(args.taskId)
		if (!task) throw new ConvexError("Task not found")
		const { user } = await requireMembership(ctx, task.propertyId)
		await ctx.db.patch(args.taskId, { status: "done" })
		await logAudit(ctx, {
			propertyId: task.propertyId,
			actorUserId: user._id,
			entityType: "task",
			entityId: args.taskId,
			action: "complete",
		})
	},
})

export const remove = mutation({
	args: { taskId: v.id("tasks") },
	handler: async (ctx, args) => {
		const task = await ctx.db.get(args.taskId)
		if (!task) throw new ConvexError("Task not found")
		const { user } = await requireMembership(ctx, task.propertyId)
		await ctx.db.delete(args.taskId)
		await logAudit(ctx, {
			propertyId: task.propertyId,
			actorUserId: user._id,
			entityType: "task",
			entityId: args.taskId,
			action: "delete",
		})
	},
})

// Internal mutations called by offline HTTP endpoints
export const completeOffline = internalMutation({
	args: { taskId: v.id("tasks") },
	handler: async (ctx, args) => {
		const task = await ctx.db.get(args.taskId)
		if (task) await ctx.db.patch(args.taskId, { status: "done" })
	},
})

export const addShoppingItemOffline = internalMutation({
	args: {
		propertyId: v.id("properties"),
		name: v.string(),
		quantity: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const membership = await ctx.db
			.query("memberships")
			.withIndex("by_property", (q) => q.eq("propertyId", args.propertyId))
			.filter((q) => q.eq(q.field("status"), "active"))
			.first()
		if (!membership) return
		await ctx.db.insert("shoppingListItems", {
			propertyId: args.propertyId,
			name: args.name,
			quantity: args.quantity,
			addedBy: membership.userId,
			status: "needed",
		})
	},
})

export const reportIssueOffline = internalMutation({
	args: {
		propertyId: v.id("properties"),
		title: v.string(),
		description: v.optional(v.string()),
		priority: v.union(
			v.literal("low"),
			v.literal("medium"),
			v.literal("high"),
			v.literal("urgent"),
		),
	},
	handler: async (ctx, args) => {
		const membership = await ctx.db
			.query("memberships")
			.withIndex("by_property", (q) => q.eq("propertyId", args.propertyId))
			.filter((q) => q.eq(q.field("status"), "active"))
			.first()
		if (!membership) return
		await ctx.db.insert("maintenanceIssues", {
			propertyId: args.propertyId,
			title: args.title,
			description: args.description,
			category: "other",
			priority: args.priority,
			status: "open",
			reportedBy: membership.userId,
			openedAt: Date.now(),
		})
	},
})
