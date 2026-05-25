import { v } from "convex/values"
import { internalMutation } from "./_generated/server"

/**
 * Creates a new user directly from the Convex dashboard.
 * Optionally adds them as a member of a property.
 *
 * Call this from: Dashboard → Functions → admin:createUser → Run
 */
export const createUser = internalMutation({
	args: {
		name: v.string(),
		email: v.string(),
		propertyId: v.optional(v.id("properties")),
		role: v.optional(
			v.union(
				v.literal("super_admin"),
				v.literal("family_admin"),
				v.literal("family_member"),
				v.literal("guest"),
			),
		),
	},
	handler: async (ctx, args) => {
		// Check if user with this email already exists
		const existing = await ctx.db
			.query("users")
			.withIndex("email", (q) => q.eq("email", args.email))
			.unique()

		if (existing) {
			throw new Error(`User with email ${args.email} already exists (id: ${existing._id})`)
		}

		const userId = await ctx.db.insert("users", {
			name: args.name,
			email: args.email,
		})

		if (args.propertyId) {
			await ctx.db.insert("memberships", {
				userId,
				propertyId: args.propertyId,
				role: args.role ?? "family_member",
				status: "invited",
				email: args.email,
			})
		}

		return { userId, email: args.email }
	},
})
