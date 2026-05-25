import { authTables } from "@convex-dev/auth/server"
import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

export default defineSchema({
	...authTables,
	// --- Properties ---
	properties: defineTable({
		name: v.string(),
		timezone: v.string(),
		address: v.optional(v.string()),
		wifiName: v.optional(v.string()),
		wifiPassword: v.optional(v.string()),
		emergencyContacts: v.optional(v.string()),
		seasonalSettings: v.optional(v.any()),
	}),

	// --- Memberships ---
	memberships: defineTable({
		userId: v.id("users"),
		propertyId: v.id("properties"),
		role: v.union(
			v.literal("super_admin"),
			v.literal("family_admin"),
			v.literal("family_member"),
			v.literal("guest"),
		),
		status: v.union(
			v.literal("active"),
			v.literal("invited"),
			v.literal("suspended"),
		),
		email: v.optional(v.string()),
	})
		.index("by_user", ["userId"])
		.index("by_property", ["propertyId"])
		.index("by_user_and_property", ["userId", "propertyId"]),

	// --- Stays ---
	stays: defineTable({
		propertyId: v.id("properties"),
		createdBy: v.id("users"),
		startDate: v.string(), // ISO date string YYYY-MM-DD
		endDate: v.string(),
		status: v.union(
			v.literal("confirmed"),
			v.literal("tentative"),
			v.literal("cancelled"),
		),
		guestCount: v.optional(v.number()),
		notes: v.optional(v.string()),
		checkInChecklistTemplateId: v.optional(v.id("taskTemplates")),
		checkOutChecklistTemplateId: v.optional(v.id("taskTemplates")),
	})
		.index("by_property", ["propertyId"])
		.index("by_property_and_start", ["propertyId", "startDate"]),

	// --- Calendar Events ---
	calendarEvents: defineTable({
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
		startAt: v.number(), // Unix timestamp ms
		endAt: v.number(),
		linkedStayId: v.optional(v.id("stays")),
		notes: v.optional(v.string()),
		createdBy: v.id("users"),
	})
		.index("by_property", ["propertyId"])
		.index("by_property_and_start", ["propertyId", "startAt"]),

	// --- Tasks ---
	tasks: defineTable({
		propertyId: v.id("properties"),
		title: v.string(),
		description: v.optional(v.string()),
		type: v.union(
			v.literal("checklist"),
			v.literal("chore"),
			v.literal("maintenance"),
			v.literal("seasonal"),
			v.literal("other"),
		),
		status: v.union(
			v.literal("todo"),
			v.literal("in_progress"),
			v.literal("done"),
			v.literal("skipped"),
		),
		priority: v.union(
			v.literal("low"),
			v.literal("medium"),
			v.literal("high"),
			v.literal("urgent"),
		),
		assignedTo: v.optional(v.id("users")),
		dueAt: v.optional(v.number()),
		linkedStayId: v.optional(v.id("stays")),
		linkedMaintenanceId: v.optional(v.id("maintenanceIssues")),
		recurrenceRule: v.optional(v.string()),
		createdBy: v.id("users"),
	})
		.index("by_property", ["propertyId"])
		.index("by_property_and_status", ["propertyId", "status"])
		.index("by_stay", ["linkedStayId"])
		.index("by_assigned", ["assignedTo"]),

	// --- Task Templates ---
	taskTemplates: defineTable({
		propertyId: v.id("properties"),
		name: v.string(),
		category: v.union(
			v.literal("check_in"),
			v.literal("check_out"),
			v.literal("opening"),
			v.literal("closing"),
			v.literal("seasonal"),
			v.literal("custom"),
		),
		checklistItems: v.array(
			v.object({
				title: v.string(),
				order: v.number(),
			}),
		),
		seasonalTag: v.optional(v.string()),
	}).index("by_property", ["propertyId"]),

	// --- Maintenance Issues ---
	maintenanceIssues: defineTable({
		propertyId: v.id("properties"),
		title: v.string(),
		description: v.optional(v.string()),
		category: v.union(
			v.literal("plumbing"),
			v.literal("electrical"),
			v.literal("hvac"),
			v.literal("structural"),
			v.literal("appliance"),
			v.literal("dock_boat"),
			v.literal("landscaping"),
			v.literal("pest"),
			v.literal("other"),
		),
		area: v.optional(v.string()),
		priority: v.union(
			v.literal("low"),
			v.literal("medium"),
			v.literal("high"),
			v.literal("urgent"),
		),
		status: v.union(
			v.literal("open"),
			v.literal("in_progress"),
			v.literal("waiting_parts"),
			v.literal("waiting_vendor"),
			v.literal("resolved"),
			v.literal("wont_fix"),
		),
		reportedBy: v.id("users"),
		assignedTo: v.optional(v.id("users")),
		vendorId: v.optional(v.id("contacts")),
		estimatedCost: v.optional(v.number()),
		actualCost: v.optional(v.number()),
		photoStorageIds: v.optional(v.array(v.string())),
		openedAt: v.number(),
		resolvedAt: v.optional(v.number()),
	})
		.index("by_property", ["propertyId"])
		.index("by_property_and_status", ["propertyId", "status"])
		.index("by_property_and_priority", ["propertyId", "priority"]),

	// --- Expenses ---
	expenses: defineTable({
		propertyId: v.id("properties"),
		paidBy: v.id("users"),
		amount: v.number(),
		category: v.union(
			v.literal("utilities"),
			v.literal("repairs"),
			v.literal("supplies"),
			v.literal("food"),
			v.literal("fuel"),
			v.literal("insurance"),
			v.literal("taxes"),
			v.literal("services"),
			v.literal("other"),
		),
		date: v.string(), // ISO date YYYY-MM-DD
		description: v.string(),
		splitMethod: v.union(
			v.literal("equal"),
			v.literal("payer_only"),
			v.literal("custom"),
		),
		receiptStorageId: v.optional(v.string()),
		reimbursementStatus: v.union(
			v.literal("na"),
			v.literal("pending"),
			v.literal("settled"),
		),
	})
		.index("by_property", ["propertyId"])
		.index("by_property_and_date", ["propertyId", "date"])
		.index("by_payer", ["paidBy"]),

	// --- Inventory Items ---
	inventoryItems: defineTable({
		propertyId: v.id("properties"),
		name: v.string(),
		category: v.union(
			v.literal("cleaning"),
			v.literal("food"),
			v.literal("tools"),
			v.literal("outdoor"),
			v.literal("boat"),
			v.literal("safety"),
			v.literal("other"),
		),
		location: v.optional(v.string()),
		quantity: v.number(),
		unit: v.optional(v.string()),
		lowThreshold: v.optional(v.number()),
		restockNeeded: v.boolean(),
	})
		.index("by_property", ["propertyId"])
		.index("by_property_and_restock", ["propertyId", "restockNeeded"]),

	// --- Shopping List Items ---
	shoppingListItems: defineTable({
		propertyId: v.id("properties"),
		name: v.string(),
		quantity: v.optional(v.string()),
		addedBy: v.id("users"),
		status: v.union(v.literal("needed"), v.literal("purchased")),
		linkedInventoryItemId: v.optional(v.id("inventoryItems")),
	})
		.index("by_property", ["propertyId"])
		.index("by_property_and_status", ["propertyId", "status"]),

	// --- Documents ---
	documents: defineTable({
		propertyId: v.id("properties"),
		title: v.string(),
		category: v.union(
			v.literal("guide"),
			v.literal("manual"),
			v.literal("permit"),
			v.literal("insurance"),
			v.literal("contact"),
			v.literal("rules"),
			v.literal("other"),
		),
		description: v.optional(v.string()),
		fileStorageId: v.optional(v.string()),
		content: v.optional(v.string()), // inline markdown content
		visibility: v.union(v.literal("all"), v.literal("admins")),
		uploadedBy: v.id("users"),
	})
		.index("by_property", ["propertyId"])
		.index("by_property_and_category", ["propertyId", "category"]),

	// --- Contacts ---
	contacts: defineTable({
		propertyId: v.id("properties"),
		name: v.string(),
		type: v.union(
			v.literal("emergency"),
			v.literal("vendor"),
			v.literal("utility"),
			v.literal("neighbor"),
			v.literal("family"),
			v.literal("other"),
		),
		phone: v.optional(v.string()),
		email: v.optional(v.string()),
		notes: v.optional(v.string()),
	}).index("by_property", ["propertyId"]),

	// --- Announcements ---
	announcements: defineTable({
		propertyId: v.id("properties"),
		title: v.string(),
		body: v.string(),
		pinned: v.boolean(),
		createdBy: v.id("users"),
		expiresAt: v.optional(v.number()),
	})
		.index("by_property", ["propertyId"])
		.index("by_property_and_pinned", ["propertyId", "pinned"]),

	// --- Notifications ---
	notifications: defineTable({
		userId: v.id("users"),
		propertyId: v.id("properties"),
		type: v.string(),
		payload: v.any(),
		readAt: v.optional(v.number()),
	})
		.index("by_user", ["userId"])
		.index("by_user_and_read", ["userId", "readAt"]),

	// --- Audit Logs ---
	auditLogs: defineTable({
		propertyId: v.id("properties"),
		actorUserId: v.id("users"),
		entityType: v.string(),
		entityId: v.string(),
		action: v.string(),
		metadata: v.optional(v.any()),
	}).index("by_property", ["propertyId"]),
})
