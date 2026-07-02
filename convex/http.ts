import { httpRouter } from "convex/server"
import { httpAction } from "./_generated/server"
import { internal } from "./_generated/api"
import { auth } from "./auth"

const http = httpRouter()
auth.addHttpRoutes(http)

// Offline mutation endpoints for Workbox background sync
http.route({
	path: "/api/offline/task-complete",
	method: "POST",
	handler: httpAction(async (ctx, req) => {
		const authHeader = req.headers.get("Authorization")
		if (!authHeader?.startsWith("Bearer ")) {
			return new Response("Unauthorized", { status: 401 })
		}

		let body: { taskId: string }
		try {
			body = await req.json()
		} catch {
			return new Response("Invalid JSON", { status: 400 })
		}

		if (!body.taskId) {
			return new Response("Missing taskId", { status: 400 })
		}

		await ctx.runMutation(internal.tasks.completeOffline, { taskId: body.taskId as never })
		return new Response(JSON.stringify({ ok: true }), {
			status: 200,
			headers: { "Content-Type": "application/json" },
		})
	}),
})

http.route({
	path: "/api/offline/shopping-item-add",
	method: "POST",
	handler: httpAction(async (ctx, req) => {
		const authHeader = req.headers.get("Authorization")
		if (!authHeader?.startsWith("Bearer ")) {
			return new Response("Unauthorized", { status: 401 })
		}

		let body: { propertyId: string; name: string; quantity?: string }
		try {
			body = await req.json()
		} catch {
			return new Response("Invalid JSON", { status: 400 })
		}

		if (!body.propertyId || !body.name) {
			return new Response("Missing required fields", { status: 400 })
		}

		await ctx.runMutation(internal.tasks.addShoppingItemOffline, {
			propertyId: body.propertyId as never,
			name: body.name,
			quantity: body.quantity,
		})
		return new Response(JSON.stringify({ ok: true }), {
			status: 200,
			headers: { "Content-Type": "application/json" },
		})
	}),
})

http.route({
	path: "/api/offline/issue-report",
	method: "POST",
	handler: httpAction(async (ctx, req) => {
		const authHeader = req.headers.get("Authorization")
		if (!authHeader?.startsWith("Bearer ")) {
			return new Response("Unauthorized", { status: 401 })
		}

		let body: { propertyId: string; title: string; description?: string; priority?: string }
		try {
			body = await req.json()
		} catch {
			return new Response("Invalid JSON", { status: 400 })
		}

		if (!body.propertyId || !body.title) {
			return new Response("Missing required fields", { status: 400 })
		}

		await ctx.runMutation(internal.tasks.reportIssueOffline, {
			propertyId: body.propertyId as never,
			title: body.title,
			description: body.description,
			priority: (body.priority as "low" | "medium" | "high" | "urgent") ?? "medium",
		})
		return new Response(JSON.stringify({ ok: true }), {
			status: 200,
			headers: { "Content-Type": "application/json" },
		})
	}),
})

export default http
