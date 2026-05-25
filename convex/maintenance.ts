import { ConvexError, v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { logAudit, requireMembership } from "./lib/auth"

const statusValues = v.union(
	v.literal("open"),
	v.literal("in_progress"),
	v.literal("waiting_parts"),
	v.literal("waiting_vendor"),
	v.literal("resolved"),
	v.literal("wont_fix"),
)

const categoryValues = v.union(
	v.literal("plumbing"),
	v.literal("electrical"),
	v.literal("hvac"),
	v.literal("structural"),
	v.literal("appliance"),
	v.literal("dock_boat"),
	v.literal("landscaping"),
	v.literal("pest"),
	v.literal("other"),
)

const priorityValues = v.union(
	v.literal("low"),
	v.literal("medium"),
	v.literal("high"),
	v.literal("urgent"),
)

export const list = query({
	args: {
		propertyId: v.id("properties"),
		status: v.optional(statusValues),
	},
	handler: async (ctx, args) => {
		await requireMembership(ctx, args.propertyId)
		if (args.status) {
			return await ctx.db
				.query("maintenanceIssues")
				.withIndex("by_property_and_status", (q) =>
					q.eq("propertyId", args.propertyId).eq("status", args.status!),
				)
				.order("desc")
				.take(100)
		}
		return await ctx.db
			.query("maintenanceIssues")
			.withIndex("by_property", (q) => q.eq("propertyId", args.propertyId))
			.order("desc")
			.take(100)
	},
})

export const get = query({
	args: { issueId: v.id("maintenanceIssues") },
	handler: async (ctx, args) => {
		const issue = await ctx.db.get(args.issueId)
		if (!issue) return null
		await requireMembership(ctx, issue.propertyId)
		return issue
	},
})

export const create = mutation({
	args: {
		propertyId: v.id("properties"),
		title: v.string(),
		description: v.optional(v.string()),
		category: categoryValues,
		area: v.optional(v.string()),
		priority: priorityValues,
	},
	handler: async (ctx, args) => {
		const { user } = await requireMembership(ctx, args.propertyId)
		const issueId = await ctx.db.insert("maintenanceIssues", {
			...args,
			status: "open",
			reportedBy: user._id,
			openedAt: Date.now(),
		})
		await logAudit(ctx, {
			propertyId: args.propertyId,
			actorUserId: user._id,
			entityType: "maintenanceIssue",
			entityId: issueId,
			action: "create",
		})
		return issueId
	},
})

export const update = mutation({
	args: {
		issueId: v.id("maintenanceIssues"),
		title: v.optional(v.string()),
		description: v.optional(v.string()),
		status: v.optional(statusValues),
		priority: v.optional(priorityValues),
		area: v.optional(v.string()),
		estimatedCost: v.optional(v.number()),
		actualCost: v.optional(v.number()),
		assignedTo: v.optional(v.id("users")),
	},
	handler: async (ctx, args) => {
		const issue = await ctx.db.get(args.issueId)
		if (!issue) throw new ConvexError("Issue not found")
		const { user } = await requireMembership(ctx, issue.propertyId)

		const { issueId, ...updates } = args
		const filtered = Object.fromEntries(
			Object.entries(updates).filter(([, v]) => v !== undefined),
		)
		await ctx.db.patch(issueId, filtered)

		await logAudit(ctx, {
			propertyId: issue.propertyId,
			actorUserId: user._id,
			entityType: "maintenanceIssue",
			entityId: issueId,
			action: "update",
		})
	},
})

export const resolve = mutation({
	args: {
		issueId: v.id("maintenanceIssues"),
		actualCost: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		const issue = await ctx.db.get(args.issueId)
		if (!issue) throw new ConvexError("Issue not found")
		const { user } = await requireMembership(ctx, issue.propertyId)
		await ctx.db.patch(args.issueId, {
			status: "resolved",
			resolvedAt: Date.now(),
			...(args.actualCost !== undefined ? { actualCost: args.actualCost } : {}),
		})
		await logAudit(ctx, {
			propertyId: issue.propertyId,
			actorUserId: user._id,
			entityType: "maintenanceIssue",
			entityId: args.issueId,
			action: "resolve",
		})
	},
})

export const remove = mutation({
	args: { issueId: v.id("maintenanceIssues") },
	handler: async (ctx, args) => {
		const issue = await ctx.db.get(args.issueId)
		if (!issue) throw new ConvexError("Issue not found")
		const { user } = await requireMembership(ctx, issue.propertyId, "family_admin")
		await ctx.db.delete(args.issueId)
		await logAudit(ctx, {
			propertyId: issue.propertyId,
			actorUserId: user._id,
			entityType: "maintenanceIssue",
			entityId: args.issueId,
			action: "delete",
		})
	},
})
