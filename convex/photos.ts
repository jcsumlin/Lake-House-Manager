import { ConvexError, v } from "convex/values"
import { action, internalQuery, mutation, query } from "./_generated/server"
import { internal } from "./_generated/api"
import { requireMembership } from "./lib/auth"

export const listByProperty = query({
	args: { propertyId: v.id("properties") },
	handler: async (ctx, args) => {
		await requireMembership(ctx, args.propertyId)
		const photos = await ctx.db
			.query("photos")
			.withIndex("by_property_and_uploaded", (q) => q.eq("propertyId", args.propertyId))
			.order("desc")
			.take(200)
		return await Promise.all(
			photos.map(async (p) => ({ ...p, url: await ctx.storage.getUrl(p.storageId) })),
		)
	},
})

export const listByStay = query({
	args: { stayId: v.id("stays") },
	handler: async (ctx, args) => {
		const stay = await ctx.db.get(args.stayId)
		if (!stay) return []
		await requireMembership(ctx, stay.propertyId)
		const photos = await ctx.db
			.query("photos")
			.withIndex("by_stay", (q) => q.eq("linkedStayId", args.stayId))
			.order("desc")
			.take(100)
		return await Promise.all(
			photos.map(async (p) => ({ ...p, url: await ctx.storage.getUrl(p.storageId) })),
		)
	},
})

export const listByMaintenance = query({
	args: { maintenanceId: v.id("maintenanceIssues") },
	handler: async (ctx, args) => {
		const issue = await ctx.db.get(args.maintenanceId)
		if (!issue) return []
		await requireMembership(ctx, issue.propertyId)
		const photos = await ctx.db
			.query("photos")
			.withIndex("by_maintenance", (q) => q.eq("linkedMaintenanceId", args.maintenanceId))
			.order("desc")
			.take(100)
		return await Promise.all(
			photos.map(async (p) => ({ ...p, url: await ctx.storage.getUrl(p.storageId) })),
		)
	},
})

export const listByAsset = query({
	args: { assetId: v.id("assets") },
	handler: async (ctx, args) => {
		const asset = await ctx.db.get(args.assetId)
		if (!asset) return []
		await requireMembership(ctx, asset.propertyId)
		const photos = await ctx.db
			.query("photos")
			.withIndex("by_asset", (q) => q.eq("linkedAssetId", args.assetId))
			.order("desc")
			.take(100)
		return await Promise.all(
			photos.map(async (p) => ({ ...p, url: await ctx.storage.getUrl(p.storageId) })),
		)
	},
})

export const addPhoto = mutation({
	args: {
		propertyId: v.id("properties"),
		storageId: v.id("_storage"),
		caption: v.optional(v.string()),
		takenAt: v.optional(v.number()),
		linkedStayId: v.optional(v.id("stays")),
		linkedMaintenanceId: v.optional(v.id("maintenanceIssues")),
		linkedAssetId: v.optional(v.id("assets")),
		width: v.optional(v.number()),
		height: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		const { user } = await requireMembership(ctx, args.propertyId)
		return await ctx.db.insert("photos", {
			...args,
			uploadedBy: user._id,
			uploadedAt: Date.now(),
		})
	},
})

export const removePhoto = mutation({
	args: { photoId: v.id("photos") },
	handler: async (ctx, args) => {
		const photo = await ctx.db.get(args.photoId)
		if (!photo) throw new ConvexError("Photo not found")
		await requireMembership(ctx, photo.propertyId)
		await ctx.storage.delete(photo.storageId)
		await ctx.db.delete(args.photoId)
	},
})

export const updateCaption = mutation({
	args: { photoId: v.id("photos"), caption: v.string() },
	handler: async (ctx, args) => {
		const photo = await ctx.db.get(args.photoId)
		if (!photo) throw new ConvexError("Photo not found")
		await requireMembership(ctx, photo.propertyId)
		await ctx.db.patch(args.photoId, { caption: args.caption })
	},
})

// Internal query used by generateUploadUrl action to verify membership
export const checkMembership = internalQuery({
	args: { propertyId: v.id("properties") },
	handler: async (ctx, args) => {
		const result = await requireMembership(ctx, args.propertyId)
		return result.membership._id
	},
})

export const generateUploadUrl = action({
	args: { propertyId: v.id("properties") },
	handler: async (ctx, args) => {
		await ctx.runQuery(internal.photos.checkMembership, { propertyId: args.propertyId })
		return await ctx.storage.generateUploadUrl()
	},
})
