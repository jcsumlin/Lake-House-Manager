import { useConvexQuery } from "@convex-dev/react-query"
import { api } from "../../../convex/_generated/api"

export function useCurrentMember() {
	const membership = useConvexQuery(api.properties.getMyMembership, {})
	const property = useConvexQuery(api.properties.getMyProperty, {})
	return { membership, property }
}

export type MemberRole = "super_admin" | "family_admin" | "family_member" | "guest"

export function canManageMembers(role?: MemberRole | null) {
	return role === "super_admin" || role === "family_admin"
}

export function canManageProperty(role?: MemberRole | null) {
	return role === "super_admin" || role === "family_admin"
}
