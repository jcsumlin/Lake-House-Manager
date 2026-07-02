import { v } from "convex/values"
import { query } from "./_generated/server"
import { requireMembership } from "./lib/auth"

function nightsBetween(startDate: string, endDate: string): number {
	const start = new Date(startDate).getTime()
	const end = new Date(endDate).getTime()
	return Math.max(0, Math.round((end - start) / (1000 * 60 * 60 * 24)))
}

function monthKey(dateStr: string): string {
	return dateStr.slice(0, 7) // "YYYY-MM"
}

function getSeason(month: number): "spring" | "summer" | "fall" | "winter" {
	if (month >= 3 && month <= 5) return "spring"
	if (month >= 6 && month <= 8) return "summer"
	if (month >= 9 && month <= 11) return "fall"
	return "winter"
}

export const getOccupancyStats = query({
	args: {
		propertyId: v.id("properties"),
		year: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		await requireMembership(ctx, args.propertyId)
		const year = args.year ?? new Date().getFullYear()
		const fromDate = `${year}-01-01`
		const toDate = `${year}-12-31`

		const stays = await ctx.db
			.query("stays")
			.withIndex("by_property_and_start", (q) =>
				q.eq("propertyId", args.propertyId).gte("startDate", fromDate),
			)
			.filter((q) =>
				q.and(
					q.lte(q.field("startDate"), toDate),
					q.neq(q.field("status"), "cancelled"),
				),
			)
			.take(500)

		const nightsByMonth: Record<string, number> = {}
		for (let m = 1; m <= 12; m++) {
			nightsByMonth[`${year}-${String(m).padStart(2, "0")}`] = 0
		}

		let totalNights = 0
		for (const stay of stays) {
			const nights = nightsBetween(stay.startDate, stay.endDate)
			const key = monthKey(stay.startDate)
			if (key in nightsByMonth) {
				nightsByMonth[key] = (nightsByMonth[key] ?? 0) + nights
			}
			totalNights += nights
		}

		const daysInYear = (year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)) ? 366 : 365
		const occupancyRate = Math.round((totalNights / daysInYear) * 100)

		const peakMonth = Object.entries(nightsByMonth).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null

		return {
			year,
			nightsByMonth,
			totalNights,
			occupancyRate,
			peakMonth,
			stayCount: stays.length,
		}
	},
})

export const getUsageByMember = query({
	args: {
		propertyId: v.id("properties"),
		fromDate: v.optional(v.string()),
		toDate: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		await requireMembership(ctx, args.propertyId)

		let q = ctx.db
			.query("stays")
			.withIndex("by_property_and_start", (q) => {
				const base = q.eq("propertyId", args.propertyId)
				if (args.fromDate) return base.gte("startDate", args.fromDate)
				return base
			})
			.filter((q) => q.neq(q.field("status"), "cancelled"))

		if (args.toDate) {
			q = q.filter((qf) => qf.lte(qf.field("startDate"), args.toDate!))
		}

		const stays = await q.take(500)

		const usage: Record<string, { nights: number; stayCount: number; name: string }> = {}
		for (const stay of stays) {
			const userId = stay.createdBy
			const nights = nightsBetween(stay.startDate, stay.endDate)
			if (!usage[userId]) {
				const user = await ctx.db.get(userId)
				usage[userId] = { nights: 0, stayCount: 0, name: user?.name ?? "Unknown" }
			}
			usage[userId].nights += nights
			usage[userId].stayCount += 1
		}

		return Object.entries(usage).map(([userId, data]) => ({ userId, ...data }))
	},
})

export const getSeasonalTrends = query({
	args: { propertyId: v.id("properties") },
	handler: async (ctx, args) => {
		await requireMembership(ctx, args.propertyId)

		const stays = await ctx.db
			.query("stays")
			.withIndex("by_property", (q) => q.eq("propertyId", args.propertyId))
			.filter((q) => q.neq(q.field("status"), "cancelled"))
			.take(500)

		const seasons = { spring: 0, summer: 0, fall: 0, winter: 0 }
		for (const stay of stays) {
			const month = new Date(stay.startDate).getMonth() + 1
			const season = getSeason(month)
			seasons[season] += nightsBetween(stay.startDate, stay.endDate)
		}

		return seasons
	},
})
