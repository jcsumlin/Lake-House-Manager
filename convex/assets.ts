import { ConvexError, v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { logAudit, requireMembership } from "./lib/auth"

function computeNextMaintenanceDue(
	lastMaintenanceAt: number | undefined,
	purchaseDate: string | undefined,
	intervalDays: number | undefined,
): number | undefined {
	if (!intervalDays) return undefined
	const baseMs = lastMaintenanceAt ?? (purchaseDate ? new Date(purchaseDate).getTime() : undefined)
	if (!baseMs) return undefined
	return baseMs + intervalDays * 24 * 60 * 60 * 1000
}

export const list = query({
	args: {
		propertyId: v.id("properties"),
		category: v.optional(
			v.union(
				v.literal("boat"),
				v.literal("dock"),
				v.literal("watercraft"),
				v.literal("porch"),
				v.literal("cleaning_equipment"),
				v.literal("trailer"),
				v.literal("vehicle"),
				v.literal("tool"),
				v.literal("other"),
			),
		),
		status: v.optional(
			v.union(
				v.literal("active"),
				v.literal("in_storage"),
				v.literal("needs_service"),
				v.literal("retired"),
			),
		),
	},
	handler: async (ctx, args) => {
		await requireMembership(ctx, args.propertyId)
		if (args.category) {
			return await ctx.db
				.query("assets")
				.withIndex("by_property_and_category", (q) =>
					q.eq("propertyId", args.propertyId).eq("category", args.category!),
				)
				.take(200)
		}
		if (args.status) {
			return await ctx.db
				.query("assets")
				.withIndex("by_property_and_status", (q) =>
					q.eq("propertyId", args.propertyId).eq("status", args.status!),
				)
				.take(200)
		}
		return await ctx.db
			.query("assets")
			.withIndex("by_property", (q) => q.eq("propertyId", args.propertyId))
			.take(200)
	},
})

export const get = query({
	args: { assetId: v.id("assets") },
	handler: async (ctx, args) => {
		const asset = await ctx.db.get(args.assetId)
		if (!asset) return null
		await requireMembership(ctx, asset.propertyId)
		return asset
	},
})

export const listDueMaintenance = query({
	args: { propertyId: v.id("properties") },
	handler: async (ctx, args) => {
		await requireMembership(ctx, args.propertyId)
		const now = Date.now()
		const assets = await ctx.db
			.query("assets")
			.withIndex("by_property", (q) => q.eq("propertyId", args.propertyId))
			.take(200)
		return assets.filter(
			(a) =>
				a.status === "active" &&
				a.nextMaintenanceDue !== undefined &&
				a.nextMaintenanceDue <= now,
		)
	},
})

export const create = mutation({
	args: {
		propertyId: v.id("properties"),
		name: v.string(),
		category: v.union(
			v.literal("boat"),
			v.literal("dock"),
			v.literal("watercraft"),
			v.literal("porch"),
			v.literal("cleaning_equipment"),
			v.literal("trailer"),
			v.literal("vehicle"),
			v.literal("tool"),
			v.literal("other"),
		),
		description: v.optional(v.string()),
		location: v.optional(v.string()),
		make: v.optional(v.string()),
		model: v.optional(v.string()),
		year: v.optional(v.number()),
		serialNumber: v.optional(v.string()),
		purchaseDate: v.optional(v.string()),
		purchaseCost: v.optional(v.number()),
		maintenanceIntervalDays: v.optional(v.number()),
		status: v.union(
			v.literal("active"),
			v.literal("in_storage"),
			v.literal("needs_service"),
			v.literal("retired"),
		),
		notes: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const { user } = await requireMembership(ctx, args.propertyId, "family_admin")
		const nextMaintenanceDue = computeNextMaintenanceDue(
			undefined,
			args.purchaseDate,
			args.maintenanceIntervalDays,
		)
		const assetId = await ctx.db.insert("assets", { ...args, nextMaintenanceDue })
		await logAudit(ctx, {
			propertyId: args.propertyId,
			actorUserId: user._id,
			entityType: "asset",
			entityId: assetId,
			action: "create",
		})
		return assetId
	},
})

export const update = mutation({
	args: {
		assetId: v.id("assets"),
		name: v.optional(v.string()),
		category: v.optional(
			v.union(
				v.literal("boat"),
				v.literal("dock"),
				v.literal("watercraft"),
				v.literal("porch"),
				v.literal("cleaning_equipment"),
				v.literal("trailer"),
				v.literal("vehicle"),
				v.literal("tool"),
				v.literal("other"),
			),
		),
		description: v.optional(v.string()),
		location: v.optional(v.string()),
		make: v.optional(v.string()),
		model: v.optional(v.string()),
		year: v.optional(v.number()),
		serialNumber: v.optional(v.string()),
		purchaseDate: v.optional(v.string()),
		purchaseCost: v.optional(v.number()),
		maintenanceIntervalDays: v.optional(v.number()),
		status: v.optional(
			v.union(
				v.literal("active"),
				v.literal("in_storage"),
				v.literal("needs_service"),
				v.literal("retired"),
			),
		),
		notes: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const asset = await ctx.db.get(args.assetId)
		if (!asset) throw new ConvexError("Asset not found")
		const { user } = await requireMembership(ctx, asset.propertyId, "family_admin")

		const { assetId, ...updates } = args
		const filtered = Object.fromEntries(
			Object.entries(updates).filter(([, val]) => val !== undefined),
		)

		const intervalDays = updates.maintenanceIntervalDays ?? asset.maintenanceIntervalDays
		const purchaseDate = updates.purchaseDate ?? asset.purchaseDate
		const nextMaintenanceDue = computeNextMaintenanceDue(
			asset.lastMaintenanceAt,
			purchaseDate,
			intervalDays,
		)

		await ctx.db.patch(assetId, { ...filtered, nextMaintenanceDue })
		await logAudit(ctx, {
			propertyId: asset.propertyId,
			actorUserId: user._id,
			entityType: "asset",
			entityId: assetId,
			action: "update",
		})
	},
})

export const recordMaintenance = mutation({
	args: {
		assetId: v.id("assets"),
		notes: v.optional(v.string()),
		createExpense: v.optional(v.boolean()),
		expenseCost: v.optional(v.number()),
		expenseDescription: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const asset = await ctx.db.get(args.assetId)
		if (!asset) throw new ConvexError("Asset not found")
		const { user } = await requireMembership(ctx, asset.propertyId)

		const now = Date.now()
		const nextMaintenanceDue = computeNextMaintenanceDue(
			now,
			asset.purchaseDate,
			asset.maintenanceIntervalDays,
		)

		await ctx.db.patch(args.assetId, {
			lastMaintenanceAt: now,
			nextMaintenanceDue,
			status: "active",
			notes: args.notes ?? asset.notes,
		})

		if (args.createExpense && args.expenseCost) {
			await ctx.db.insert("expenses", {
				propertyId: asset.propertyId,
				paidBy: user._id,
				amount: args.expenseCost,
				category: "repairs",
				date: new Date().toISOString().slice(0, 10),
				description: args.expenseDescription ?? `Maintenance: ${asset.name}`,
				splitMethod: "equal",
				reimbursementStatus: "na",
			})
		}

		await logAudit(ctx, {
			propertyId: asset.propertyId,
			actorUserId: user._id,
			entityType: "asset",
			entityId: args.assetId,
			action: "record_maintenance",
		})
	},
})

export const remove = mutation({
	args: { assetId: v.id("assets") },
	handler: async (ctx, args) => {
		const asset = await ctx.db.get(args.assetId)
		if (!asset) throw new ConvexError("Asset not found")
		const { user } = await requireMembership(ctx, asset.propertyId, "family_admin")
		await ctx.db.delete(args.assetId)
		await logAudit(ctx, {
			propertyId: asset.propertyId,
			actorUserId: user._id,
			entityType: "asset",
			entityId: args.assetId,
			action: "delete",
		})
	},
})
