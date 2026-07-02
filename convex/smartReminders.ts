import { v } from "convex/values"
import { internalAction, internalMutation, internalQuery, query } from "./_generated/server"
import { internal } from "./_generated/api"
import { requireMembership } from "./lib/auth"

// Public query for settings page
export const listUpcomingReminders = query({
	args: { propertyId: v.id("properties") },
	handler: async (ctx, args) => {
		await requireMembership(ctx, args.propertyId)
		const now = Date.now()
		const upcoming = now + 14 * 24 * 60 * 60 * 1000 // 14 days ahead
		const todayStr = new Date().toISOString().slice(0, 10)
		const futureStr = new Date(upcoming).toISOString().slice(0, 10)

		return await ctx.db
			.query("stays")
			.withIndex("by_property_and_start", (q) =>
				q.eq("propertyId", args.propertyId).gte("startDate", todayStr),
			)
			.filter((q) =>
				q.and(
					q.lte(q.field("startDate"), futureStr),
					q.neq(q.field("status"), "cancelled"),
				),
			)
			.take(20)
	},
})

// Internal: get property reminder config
export const getPropertyReminderConfig = internalQuery({
	args: { propertyId: v.id("properties") },
	handler: async (ctx, args) => {
		return await ctx.db.get(args.propertyId)
	},
})

// Internal: get a stay
export const getStay = internalQuery({
	args: { stayId: v.id("stays") },
	handler: async (ctx, args) => {
		return await ctx.db.get(args.stayId)
	},
})

// Internal: get default check_in template for a property
export const getCheckInTemplate = internalQuery({
	args: { propertyId: v.id("properties") },
	handler: async (ctx, args) => {
		const defaultTemplate = await ctx.db
			.query("taskTemplates")
			.withIndex("by_property", (q) => q.eq("propertyId", args.propertyId))
			.filter((q) =>
				q.and(
					q.eq(q.field("category"), "check_in"),
					q.eq(q.field("isDefault"), true),
				),
			)
			.first()
		if (defaultTemplate) return defaultTemplate

		return await ctx.db
			.query("taskTemplates")
			.withIndex("by_property", (q) => q.eq("propertyId", args.propertyId))
			.filter((q) => q.eq(q.field("category"), "check_in"))
			.first()
	},
})

// Internal: get membership for task attribution
export const getPropertyMembership = internalQuery({
	args: { propertyId: v.id("properties") },
	handler: async (ctx, args) => {
		return await ctx.db
			.query("memberships")
			.withIndex("by_property", (q) => q.eq("propertyId", args.propertyId))
			.filter((q) => q.eq(q.field("status"), "active"))
			.first()
	},
})

// Internal: create pre-arrival tasks from check_in template
export const createPreArrivalTasks = internalMutation({
	args: { stayId: v.id("stays") },
	handler: async (ctx, args) => {
		const stay = await ctx.db.get(args.stayId)
		if (!stay || stay.status === "cancelled") return

		const membership = await ctx.db
			.query("memberships")
			.withIndex("by_property", (q) => q.eq("propertyId", stay.propertyId))
			.filter((q) => q.eq(q.field("status"), "active"))
			.first()
		if (!membership) return

		const template = await ctx.db
			.query("taskTemplates")
			.withIndex("by_property", (q) => q.eq("propertyId", stay.propertyId))
			.filter((q) => q.eq(q.field("category"), "check_in"))
			.first()

		if (!template) return

		await Promise.all(
			template.checklistItems.map((item) =>
				ctx.db.insert("tasks", {
					propertyId: stay.propertyId,
					title: item.title,
					type: "checklist",
					status: "todo",
					priority: "medium",
					linkedStayId: args.stayId,
					createdBy: membership.userId,
					source: "cron_pre_arrival",
				}),
			),
		)

		await ctx.db.patch(args.stayId, { reminderScheduledAt: Date.now() })
	},
})

// Internal: schedule a pre-arrival reminder for a stay
export const schedulePreArrivalReminder = internalMutation({
	args: { stayId: v.id("stays") },
	handler: async (ctx, args) => {
		const stay = await ctx.db.get(args.stayId)
		if (!stay) return

		const property = await ctx.db.get(stay.propertyId)
		const reminderDays = property?.preArrivalReminderDays ?? 3

		const startMs = new Date(stay.startDate).getTime()
		const fireAt = startMs - reminderDays * 24 * 60 * 60 * 1000

		if (fireAt <= Date.now()) return // already passed

		const jobId = await ctx.scheduler.runAt(
			fireAt,
			internal.smartReminders.firePreArrivalReminder,
			{ stayId: args.stayId },
		)

		await ctx.db.patch(args.stayId, {
			scheduledReminderJobId: jobId as import("./_generated/dataModel").Id<"_scheduled_functions">,
			reminderScheduledAt: fireAt,
		})
	},
})

// Internal: fire the pre-arrival reminder
export const firePreArrivalReminder = internalAction({
	args: { stayId: v.id("stays") },
	handler: async (ctx, args) => {
		const stay = await ctx.runQuery(internal.smartReminders.getStay, { stayId: args.stayId })
		if (!stay || stay.status === "cancelled") return

		await ctx.runMutation(internal.smartReminders.createPreArrivalTasks, {
			stayId: args.stayId,
		})

		await ctx.runAction(internal.pushNotificationsActions.sendPushToProperty, {
			propertyId: stay.propertyId,
			title: "Trip is coming up!",
			body: `Your stay starts on ${stay.startDate}. Check-in tasks have been created.`,
			url: `/calendar/${args.stayId}`,
		})
	},
})

// Internal: daily sweep for stays that haven't had reminders scheduled
export const sweepUpcomingStays = internalAction({
	args: {},
	handler: async (ctx) => {
		const properties = await ctx.runQuery(internal.smartReminders.getAllProperties, {})
		for (const property of properties) {
			const stays = await ctx.runQuery(internal.smartReminders.getUnscheduledStays, {
				propertyId: property._id,
			})
			for (const stay of stays) {
				await ctx.runMutation(internal.smartReminders.schedulePreArrivalReminder, {
					stayId: stay._id,
				})
			}
		}
	},
})

export const getAllProperties = internalQuery({
	args: {},
	handler: async (ctx) => {
		return await ctx.db.query("properties").take(100)
	},
})

export const getUnscheduledStays = internalQuery({
	args: { propertyId: v.id("properties") },
	handler: async (ctx, args) => {
		const todayStr = new Date().toISOString().slice(0, 10)
		const futureStr = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

		return await ctx.db
			.query("stays")
			.withIndex("by_property_and_start", (q) =>
				q.eq("propertyId", args.propertyId).gte("startDate", todayStr),
			)
			.filter((q) =>
				q.and(
					q.lte(q.field("startDate"), futureStr),
					q.neq(q.field("status"), "cancelled"),
					q.eq(q.field("scheduledReminderJobId"), undefined),
				),
			)
			.take(50)
	},
})
