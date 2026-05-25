import { v } from "convex/values"

export const ROLES = ["super_admin", "family_admin", "family_member", "guest"] as const
export type Role = (typeof ROLES)[number]

const ROLE_RANK: Record<Role, number> = {
	super_admin: 3,
	family_admin: 2,
	family_member: 1,
	guest: 0,
}

export function hasMinRole(role: Role, minRole: Role): boolean {
	return ROLE_RANK[role] >= ROLE_RANK[minRole]
}

export const roleValidator = v.union(
	v.literal("super_admin"),
	v.literal("family_admin"),
	v.literal("family_member"),
	v.literal("guest"),
)
