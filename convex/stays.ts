import { ConvexError, v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { logAudit, requireMembership } from "./lib/auth"

export const list = query({
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
		if (args.toDate) {
			q = q.filter((qf) => qf.lte(qf.field("startDate"), args.toDate!))
		}
		const stays = await q.take(200)
		const staysWithUser = await Promise.all(stays.map(async (s) => {
			const { user } = await requireMembership(ctx, args.propertyId)
			return {
				...s,
				createdBy: user.name ?? "Unknown",
			}
		}))
		console.log("🚀 ~ staysWithUser:", staysWithUser)
		return staysWithUser
	},
})

export const get = query({
	args: { stayId: v.id("stays") },
	handler: async (ctx, args) => {
		const stay = await ctx.db.get(args.stayId)
		if (!stay) return null
		await requireMembership(ctx, stay.propertyId)
		return stay
	},
})

export const create = mutation({
	args: {
		propertyId: v.id("properties"),
		startDate: v.string(),
		endDate: v.string(),
		status: v.union(v.literal("confirmed"), v.literal("tentative"), v.literal("cancelled")),
		guestCount: v.optional(v.number()),
		notes: v.optional(v.string()),
		checkInChecklistTemplateId: v.optional(v.id("taskTemplates")),
		checkOutChecklistTemplateId: v.optional(v.id("taskTemplates")),
	},
	handler: async (ctx, args) => {
		const { user } = await requireMembership(ctx, args.propertyId)

		const overlapping = await ctx.db
			.query("stays")
			.withIndex("by_property_and_start", (q) =>
				q.eq("propertyId", args.propertyId).lte("startDate", args.endDate),
			)
			.filter((q) =>
				q.and(
					q.gte(q.field("endDate"), args.startDate),
					q.neq(q.field("status"), "cancelled"),
				),
			)
			.first()

		if (overlapping) {
			throw new ConvexError("Date range overlaps with an existing stay")
		}

		const stayId = await ctx.db.insert("stays", { ...args, createdBy: user._id })

		await ctx.db.insert("calendarEvents", {
			propertyId: args.propertyId,
			title: `Stay (${args.guestCount ?? 1} guest${(args.guestCount ?? 1) !== 1 ? "s" : ""})`,
			type: "stay",
			startAt: new Date(args.startDate).getTime(),
			endAt: new Date(args.endDate).getTime(),
			linkedStayId: stayId,
			createdBy: user._id,
		})

		await logAudit(ctx, {
			propertyId: args.propertyId,
			actorUserId: user._id,
			entityType: "stay",
			entityId: stayId,
			action: "create",
		})

		return stayId
	},
})

export const update = mutation({
	args: {
		stayId: v.id("stays"),
		startDate: v.optional(v.string()),
		endDate: v.optional(v.string()),
		status: v.optional(
			v.union(v.literal("confirmed"), v.literal("tentative"), v.literal("cancelled")),
		),
		guestCount: v.optional(v.number()),
		notes: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const stay = await ctx.db.get(args.stayId)
		if (!stay) throw new ConvexError("Stay not found")
		const { user } = await requireMembership(ctx, stay.propertyId)

		const { stayId, ...updates } = args
		const filtered = Object.fromEntries(
			Object.entries(updates).filter(([, v]) => v !== undefined),
		)
		await ctx.db.patch(stayId, filtered)

		await logAudit(ctx, {
			propertyId: stay.propertyId,
			actorUserId: user._id,
			entityType: "stay",
			entityId: stayId,
			action: "update",
		})
	},
})

export const cancel = mutation({
	args: { stayId: v.id("stays") },
	handler: async (ctx, args) => {
		const stay = await ctx.db.get(args.stayId)
		if (!stay) throw new ConvexError("Stay not found")
		const { user } = await requireMembership(ctx, stay.propertyId)
		await ctx.db.patch(args.stayId, { status: "cancelled" })
		await logAudit(ctx, {
			propertyId: stay.propertyId,
			actorUserId: user._id,
			entityType: "stay",
			entityId: args.stayId,
			action: "cancel",
		})
	},
})
