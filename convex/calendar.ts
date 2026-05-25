import { v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { logAudit, requireMembership } from "./lib/auth"

export const listEvents = query({
	args: {
		propertyId: v.id("properties"),
		fromAt: v.number(),
		toAt: v.number(),
	},
	handler: async (ctx, args) => {
		await requireMembership(ctx, args.propertyId)
		const events = await ctx.db
			.query("calendarEvents")
			.withIndex("by_property_and_start", (q) =>
				q.eq("propertyId", args.propertyId).gte("startAt", args.fromAt),
			)
			.filter((q) => q.lte(q.field("startAt"), args.toAt))
			.take(200)
		const eventsWithUser = await Promise.all(events.map(async (e) => {
			const { user } = await requireMembership(ctx, args.propertyId)
			return {
				...e,
				createdBy: user.name ?? "Unknown",
			}
		}))
		console.log("🚀 ~ eventsWithUser:", eventsWithUser)
		return eventsWithUser
	},
})

export const createEvent = mutation({
	args: {
		propertyId: v.id("properties"),
		title: v.string(),
		type: v.union(
			v.literal("stay"),
			v.literal("maintenance"),
			v.literal("cleaning"),
			v.literal("family_event"),
			v.literal("seasonal"),
			v.literal("other"),
		),
		startAt: v.number(),
		endAt: v.number(),
		notes: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const { user } = await requireMembership(ctx, args.propertyId)
		const eventId = await ctx.db.insert("calendarEvents", {
			...args,
			createdBy: user._id,
		})
		await logAudit(ctx, {
			propertyId: args.propertyId,
			actorUserId: user._id,
			entityType: "calendarEvent",
			entityId: eventId,
			action: "create",
		})
		return eventId
	},
})
