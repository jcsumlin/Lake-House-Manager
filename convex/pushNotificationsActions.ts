"use node";

import { v } from "convex/values"
import { internalAction } from "./_generated/server"
import { internal } from "./_generated/api"
import webPush from "web-push"

function setupVapid() {
	const publicKey = process.env.VAPID_PUBLIC_KEY
	const privateKey = process.env.VAPID_PRIVATE_KEY
	const subject = process.env.VAPID_SUBJECT ?? "mailto:admin@lakehouse.app"
	if (!publicKey || !privateKey) {
		console.warn("VAPID keys not configured — push notifications disabled")
		return false
	}
	webPush.setVapidDetails(subject, publicKey, privateKey)
	return true
}

export const sendPushToUser = internalAction({
	args: {
		userId: v.id("users"),
		title: v.string(),
		body: v.string(),
		url: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		if (!setupVapid()) return

		const subs = await ctx.runQuery(internal.pushNotifications.getUserSubscriptions, {
			userId: args.userId,
		})

		const payload = JSON.stringify({ title: args.title, body: args.body, url: args.url })

		for (const sub of subs) {
			try {
				await webPush.sendNotification(
					{ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
					payload,
				)
			} catch (err: unknown) {
				const statusCode = (err as { statusCode?: number }).statusCode
				if (statusCode === 410) {
					await ctx.runMutation(internal.pushNotifications.deleteSubscription, {
						endpoint: sub.endpoint,
					})
				}
			}
		}
	},
})

export const sendPushToProperty = internalAction({
	args: {
		propertyId: v.id("properties"),
		title: v.string(),
		body: v.string(),
		url: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		if (!setupVapid()) return

		const subs = await ctx.runQuery(internal.pushNotifications.getPropertySubscriptions, {
			propertyId: args.propertyId,
		})

		const payload = JSON.stringify({ title: args.title, body: args.body, url: args.url })

		for (const sub of subs) {
			try {
				await webPush.sendNotification(
					{ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
					payload,
				)
			} catch (err: unknown) {
				const statusCode = (err as { statusCode?: number }).statusCode
				if (statusCode === 410) {
					await ctx.runMutation(internal.pushNotifications.deleteSubscription, {
						endpoint: sub.endpoint,
					})
				}
			}
		}
	},
})
