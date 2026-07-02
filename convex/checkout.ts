import { ConvexError, v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { requireMembership } from "./lib/auth"

export const getCheckoutStatus = query({
	args: { stayId: v.id("stays") },
	handler: async (ctx, args) => {
		const stay = await ctx.db.get(args.stayId)
		if (!stay) return null
		await requireMembership(ctx, stay.propertyId)

		const tasks = await ctx.db
			.query("tasks")
			.withIndex("by_stay", (q) => q.eq("linkedStayId", args.stayId))
			.filter((q) => q.eq(q.field("type"), "checklist"))
			.take(100)

		const checkoutTasks = tasks.filter(
			(t) => t.source === "template" || t.linkedStayId === args.stayId,
		)

		const done = checkoutTasks.filter(
			(t) => t.status === "done" || t.status === "skipped",
		).length

		return {
			checkoutCompletedAt: stay.checkoutCompletedAt,
			checkoutNotes: stay.checkoutNotes,
			cleaningPaymentMethod: stay.cleaningPaymentMethod,
			cleaningCost: stay.cleaningCost,
			tasksDone: done,
			tasksTotal: checkoutTasks.length,
		}
	},
})

export const startCheckout = mutation({
	args: { stayId: v.id("stays") },
	handler: async (ctx, args) => {
		const stay = await ctx.db.get(args.stayId)
		if (!stay) throw new ConvexError("Stay not found")
		const { user } = await requireMembership(ctx, stay.propertyId)

		// Find the property's default check_out template
		const template = await ctx.db
			.query("taskTemplates")
			.withIndex("by_property", (q) => q.eq("propertyId", stay.propertyId))
			.filter((q) =>
				q.and(
					q.eq(q.field("category"), "check_out"),
					q.eq(q.field("isDefault"), true),
				),
			)
			.first()

		if (!template) {
			// Fall back to first check_out template
			const fallback = await ctx.db
				.query("taskTemplates")
				.withIndex("by_property", (q) => q.eq("propertyId", stay.propertyId))
				.filter((q) => q.eq(q.field("category"), "check_out"))
				.first()
			if (!fallback) return null

			await Promise.all(
				fallback.checklistItems.map((item) =>
					ctx.db.insert("tasks", {
						propertyId: stay.propertyId,
						title: item.title,
						type: "checklist",
						status: "todo",
						priority: "medium",
						linkedStayId: args.stayId,
						createdBy: user._id,
						source: "template",
					}),
				),
			)
			return fallback._id
		}

		await Promise.all(
			template.checklistItems.map((item) =>
				ctx.db.insert("tasks", {
					propertyId: stay.propertyId,
					title: item.title,
					type: "checklist",
					status: "todo",
					priority: "medium",
					linkedStayId: args.stayId,
					createdBy: user._id,
					source: "template",
				}),
			),
		)
		return template._id
	},
})

export const completeCheckout = mutation({
	args: {
		stayId: v.id("stays"),
		cleaningCost: v.optional(v.number()),
		cleaningPaymentMethod: v.optional(v.string()),
		checkoutNotes: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const stay = await ctx.db.get(args.stayId)
		if (!stay) throw new ConvexError("Stay not found")
		const { user } = await requireMembership(ctx, stay.propertyId)

		await ctx.db.patch(args.stayId, {
			checkoutCompletedAt: Date.now(),
			checkoutNotes: args.checkoutNotes,
			cleaningPaymentMethod: args.cleaningPaymentMethod,
			cleaningCost: args.cleaningCost,
		})

		if (args.cleaningCost) {
			const property = await ctx.db.get(stay.propertyId)
			await ctx.db.insert("expenses", {
				propertyId: stay.propertyId,
				paidBy: user._id,
				amount: args.cleaningCost,
				category: "services",
				date: new Date().toISOString().slice(0, 10),
				description: property?.cleaningServiceName
					? `Cleaning: ${property.cleaningServiceName}`
					: "Post-stay cleaning",
				splitMethod: "equal",
				reimbursementStatus: "na",
			})
		}
	},
})
