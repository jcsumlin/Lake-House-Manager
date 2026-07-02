import { v } from "convex/values"
import { internalAction, internalMutation, internalQuery, query } from "./_generated/server"
import { internal } from "./_generated/api"
import { requireMembership } from "./lib/auth"

const NWS_USER_AGENT = "LakeHouseManager/1.0 (admin@lakehouse.app)"
const DEDUP_WINDOW_MS = 12 * 60 * 60 * 1000 // 12 hours

// Public query: current conditions summary for the property
export const getAlerts = query({
	args: { propertyId: v.id("properties") },
	handler: async (ctx, args) => {
		await requireMembership(ctx, args.propertyId)
		const cutoff = Date.now() - DEDUP_WINDOW_MS
		return await ctx.db
			.query("weatherAlerts")
			.withIndex("by_property_and_checked", (q) =>
				q.eq("propertyId", args.propertyId).gte("checkedAt", cutoff),
			)
			.order("desc")
			.take(20)
	},
})

// Internal: get properties with weather alerts enabled
export const getWeatherEnabledProperties = internalQuery({
	args: {},
	handler: async (ctx) => {
		return await ctx.db
			.query("properties")
			.filter((q) =>
				q.and(
					q.eq(q.field("weatherAlertsEnabled"), true),
					q.neq(q.field("weatherApiLat"), undefined),
					q.neq(q.field("weatherApiLon"), undefined),
				),
			)
			.take(50)
	},
})

// Internal: check for recent alert of same type to prevent flooding
export const getRecentAlert = internalQuery({
	args: {
		propertyId: v.id("properties"),
		type: v.union(v.literal("storm"), v.literal("freeze"), v.literal("other")),
	},
	handler: async (ctx, args) => {
		const cutoff = Date.now() - DEDUP_WINDOW_MS
		return await ctx.db
			.query("weatherAlerts")
			.withIndex("by_property_and_type", (q) =>
				q.eq("propertyId", args.propertyId).eq("type", args.type),
			)
			.filter((q) => q.gte(q.field("checkedAt"), cutoff))
			.first()
	},
})

// Internal: create storm prep tasks
export const createStormPrepTasks = internalMutation({
	args: {
		propertyId: v.id("properties"),
		headline: v.string(),
		description: v.string(),
		severity: v.union(v.literal("watch"), v.literal("warning"), v.literal("advisory")),
	},
	handler: async (ctx, args) => {
		// Check dedup
		const recent = await ctx.db
			.query("weatherAlerts")
			.withIndex("by_property_and_type", (q) =>
				q.eq("propertyId", args.propertyId).eq("type", "storm"),
			)
			.filter((q) => q.gte(q.field("checkedAt"), Date.now() - DEDUP_WINDOW_MS))
			.first()

		if (recent?.tasksBulkCreated) return

		const alertId = await ctx.db.insert("weatherAlerts", {
			propertyId: args.propertyId,
			type: "storm",
			headline: args.headline,
			description: args.description,
			severity: args.severity,
			checkedAt: Date.now(),
			tasksBulkCreated: true,
			notificationSent: false,
		})

		// Get any property member to attribute tasks to
		const membership = await ctx.db
			.query("memberships")
			.withIndex("by_property", (q) => q.eq("propertyId", args.propertyId))
			.filter((q) => q.eq(q.field("status"), "active"))
			.first()
		if (!membership) return

		const stormTasks = [
			"Secure loose items on deck and porch",
			"Bring in outdoor furniture",
			"Check dock lines and bumpers",
			"Move boat to covered storage if possible",
			"Clear gutters and drains",
			"Charge backup power bank",
		]

		await Promise.all(
			stormTasks.map((title) =>
				ctx.db.insert("tasks", {
					propertyId: args.propertyId,
					title,
					type: "seasonal",
					status: "todo",
					priority: "high",
					createdBy: membership.userId,
					source: "weather_auto",
				}),
			),
		)

		return alertId
	},
})

// Internal: create freeze prep tasks
export const createFreezePrepTasks = internalMutation({
	args: {
		propertyId: v.id("properties"),
		headline: v.string(),
		forecastTempF: v.number(),
	},
	handler: async (ctx, args) => {
		const recent = await ctx.db
			.query("weatherAlerts")
			.withIndex("by_property_and_type", (q) =>
				q.eq("propertyId", args.propertyId).eq("type", "freeze"),
			)
			.filter((q) => q.gte(q.field("checkedAt"), Date.now() - DEDUP_WINDOW_MS))
			.first()

		if (recent?.tasksBulkCreated) return

		await ctx.db.insert("weatherAlerts", {
			propertyId: args.propertyId,
			type: "freeze",
			headline: args.headline,
			description: `Forecast low: ${args.forecastTempF}°F`,
			severity: args.forecastTempF < 28 ? "warning" : "watch",
			checkedAt: Date.now(),
			tasksBulkCreated: true,
			notificationSent: false,
		})

		const membership = await ctx.db
			.query("memberships")
			.withIndex("by_property", (q) => q.eq("propertyId", args.propertyId))
			.filter((q) => q.eq(q.field("status"), "active"))
			.first()
		if (!membership) return

		const freezeTasks = [
			"Drain and blow out water lines",
			"Shut off water supply to exterior hose bibs",
			"Disconnect and store garden hoses",
			"Add antifreeze to toilet traps if closing",
			"Check pipe insulation in crawl space",
			"Cover boat engine and drain cooling water",
		]

		await Promise.all(
			freezeTasks.map((title) =>
				ctx.db.insert("tasks", {
					propertyId: args.propertyId,
					title,
					type: "seasonal",
					status: "todo",
					priority: "urgent",
					createdBy: membership.userId,
					source: "freeze_auto",
				}),
			),
		)
	},
})

// Action: check weather for one property
export const checkWeather = internalAction({
	args: { propertyId: v.id("properties") },
	handler: async (ctx, args) => {
		const property = await ctx.runQuery(internal.weather.getPropertyWeatherConfig, {
			propertyId: args.propertyId,
		})
		if (!property?.weatherApiLat || !property?.weatherApiLon) return console.error("Property missing weather API coordinates")

		const { weatherApiLat: lat, weatherApiLon: lon } = property
		const freezeThreshold = property.freezeThresholdF ?? 36

		// Step 1: get active alerts
		const alertsResp = await fetch(
			`https://api.weather.gov/alerts/active?point=${lat},${lon}`,
			{ headers: { "User-Agent": NWS_USER_AGENT, Accept: "application/geo+json" } },
		)

		if (alertsResp.ok) {
			const alertsData = await alertsResp.json() as {
				features: Array<{ properties: { event: string; headline: string; description: string; severity: string } }>
			}
			const stormKeywords = ["Thunderstorm", "Tornado", "Wind", "Storm", "Hurricane"]
			const stormAlert = alertsData.features?.find((f) =>
				stormKeywords.some((kw) => f.properties.event?.includes(kw)),
			)
			if (stormAlert) {
				const rawSeverity = stormAlert.properties.severity?.toLowerCase() ?? ""
				const severity =
					rawSeverity.includes("warning")
						? "warning"
						: rawSeverity.includes("watch")
							? "watch"
							: "advisory"
				await ctx.runMutation(internal.weather.createStormPrepTasks, {
					propertyId: args.propertyId,
					headline: stormAlert.properties.headline ?? stormAlert.properties.event,
					description: stormAlert.properties.description ?? "",
					severity,
				})
			}
		}

		// Step 2: check freeze forecast (only Sep–Apr)
		const month = new Date().getMonth() + 1
		const inFreezeWindow = month <= 4 || month >= 9

		if (inFreezeWindow) {
			// Get gridpoint
			const pointResp = await fetch(
				`https://api.weather.gov/points/${lat},${lon}`,
				{ headers: { "User-Agent": NWS_USER_AGENT } },
			)
			if (pointResp.ok) {
				const pointData = await pointResp.json() as {
					properties: { forecastHourly: string; forecast: string }
				}
				const forecastUrl = pointData.properties?.forecast
				if (forecastUrl) {
					const forecastResp = await fetch(forecastUrl, {
						headers: { "User-Agent": NWS_USER_AGENT },
					})
					if (forecastResp.ok) {
						const forecastData = await forecastResp.json() as {
							properties: {
								periods: Array<{
									isDaytime: boolean
									temperature: number
									temperatureUnit: string
									name: string
								}>
							}
						}
						const nights = (forecastData.properties?.periods ?? []).filter(
							(p) => !p.isDaytime && p.temperatureUnit === "F",
						)
						const nextThreeNights = nights.slice(0, 3)
						const freezeNight = nextThreeNights.find(
							(p) => p.temperature < freezeThreshold,
						)
						if (freezeNight) {
							await ctx.runMutation(internal.weather.createFreezePrepTasks, {
								propertyId: args.propertyId,
								headline: `Freeze watch: ${freezeNight.name} low ${freezeNight.temperature}°F`,
								forecastTempF: freezeNight.temperature,
							})
						}
					}
				}
			}
		}

		// Send push notification if new tasks were created
		await ctx.runAction(internal.pushNotificationsActions.sendPushToProperty, {
			propertyId: args.propertyId,
			title: "Weather Alert",
			body: "New weather-related tasks have been created for your property.",
			url: "/tasks",
		})
	},
})

// Internal query: get property weather config
export const getPropertyWeatherConfig = internalQuery({
	args: { propertyId: v.id("properties") },
	handler: async (ctx, args) => {
		return await ctx.db.get(args.propertyId)
	},
})

// Action: sweep all weather-enabled properties
export const checkAllProperties = internalAction({
	args: {},
	handler: async (ctx) => {
		const properties = await ctx.runQuery(internal.weather.getWeatherEnabledProperties, {})
		for (const property of properties) {
			await ctx.runAction(internal.weather.checkWeather, { propertyId: property._id })
		}
	},
})
