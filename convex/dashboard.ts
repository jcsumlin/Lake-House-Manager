import { v } from "convex/values"
import { query } from "./_generated/server"
import { requireMembership } from "./lib/auth"

export const getSummary = query({
	args: { propertyId: v.id("properties") },
	handler: async (ctx, args) => {
		await requireMembership(ctx, args.propertyId)

		const now = Date.now()
		const todayStr = new Date().toISOString().slice(0, 10)

		const [upcomingStays, openTasks, todayTasks, openIssues, lowInventory, latestAnnouncements] =
			await Promise.all([
				ctx.db
					.query("stays")
					.withIndex("by_property_and_start", (q) =>
						q.eq("propertyId", args.propertyId).gte("startDate", todayStr),
					)
					.filter((q) => q.neq(q.field("status"), "cancelled"))
					.take(2),

				ctx.db
					.query("tasks")
					.withIndex("by_property_and_status", (q) =>
						q.eq("propertyId", args.propertyId).eq("status", "todo"),
					)
					.take(100),

				ctx.db
					.query("tasks")
					.withIndex("by_property", (q) => q.eq("propertyId", args.propertyId))
					.filter((q) =>
						q.and(
							q.neq(q.field("status"), "done"),
							q.neq(q.field("status"), "skipped"),
							q.lt(q.field("dueAt"), now + 86400000),
							q.gte(q.field("dueAt"), now - 86400000),
						),
					)
					.take(5),

				ctx.db
					.query("maintenanceIssues")
					.withIndex("by_property_and_status", (q) =>
						q.eq("propertyId", args.propertyId).eq("status", "open"),
					)
					.take(100),

				ctx.db
					.query("inventoryItems")
					.withIndex("by_property_and_restock", (q) =>
						q.eq("propertyId", args.propertyId).eq("restockNeeded", true),
					)
					.take(100),

				ctx.db
					.query("announcements")
					.withIndex("by_property", (q) => q.eq("propertyId", args.propertyId))
					.order("desc")
					.take(3),
			])

		const upcomingStaysWithUser = await Promise.all(upcomingStays.map(async (s) => {
			const { user } = await requireMembership(ctx, args.propertyId)
			return {
				...s,
				createdBy: user.name ?? "Unknown",
			}
		}))

		return {
			upcomingStays: upcomingStaysWithUser,
			openTaskCount: openTasks.length,
			todayTasks,
			openIssueCount: openIssues.length,
			lowInventoryCount: lowInventory.length,
			latestAnnouncements,
		}
	},
})
