import { useConvexMutation, useConvexQuery } from "@convex-dev/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { api } from "../../../../convex/_generated/api"
import { useCurrentMember } from "#/lib/auth/useCurrentMember"
import { Bell, BellOff, CheckCircle2, Loader2 } from "lucide-react"
import { useState } from "react"
import { Button } from "#/components/ui/button"

export const Route = createFileRoute("/_app/settings/notifications")({
	component: NotificationsSettingsPage,
})

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined

function urlB64ToUint8Array(base64String: string): ArrayBuffer {
	const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
	const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
	const rawData = atob(base64)
	const outputArray = new Uint8Array(rawData.length)
	for (let i = 0; i < rawData.length; ++i) {
		outputArray[i] = rawData.charCodeAt(i)
	}
	return outputArray.buffer as ArrayBuffer
}

function NotificationsSettingsPage() {
	const { property } = useCurrentMember()
	const [subscribing, setSubscribing] = useState(false)
	const [unsubscribing, setUnsubscribing] = useState(false)
	const [permissionState, setPermissionState] = useState<NotificationPermission | null>(
		typeof Notification !== "undefined" ? Notification.permission : null,
	)

	const unreadNotifications = useConvexQuery(
		api.pushNotifications.listUnread,
		property ? { propertyId: property._id } : "skip",
	)

	const subscribeMutation = useConvexMutation(api.pushNotifications.subscribe)
	const unsubscribeMutation = useConvexMutation(api.pushNotifications.unsubscribe)
	const markReadMutation = useConvexMutation(api.pushNotifications.markRead)

	async function handleSubscribe() {
		if (!property || !VAPID_PUBLIC_KEY) return
		setSubscribing(true)
		try {
			const permission = await Notification.requestPermission()
			setPermissionState(permission)
			if (permission !== "granted") return

			const registration = await navigator.serviceWorker.ready
			const sub = await registration.pushManager.subscribe({
				userVisibleOnly: true,
				applicationServerKey: urlB64ToUint8Array(VAPID_PUBLIC_KEY),
			})
			const json = sub.toJSON()
			await subscribeMutation({
				propertyId: property._id,
				endpoint: sub.endpoint,
				p256dh: json.keys?.p256dh ?? "",
				auth: json.keys?.auth ?? "",
				userAgent: navigator.userAgent,
			})
		} finally {
			setSubscribing(false)
		}
	}

	async function handleUnsubscribe() {
		setUnsubscribing(true)
		try {
			const registration = await navigator.serviceWorker.ready
			const sub = await registration.pushManager.getSubscription()
			if (sub) {
				await sub.unsubscribe()
				await unsubscribeMutation({ endpoint: sub.endpoint })
			}
		} finally {
			setUnsubscribing(false)
		}
	}

	const pushSupported =
		typeof window !== "undefined" &&
		"serviceWorker" in navigator &&
		"PushManager" in window

	return (
		<div className="page-wrap py-6 space-y-5 max-w-lg">
			<div className="rise-in">
				<p className="island-kicker mb-1" style={{ color: "var(--kicker)" }}>Settings</p>
				<h1 className="display-title text-2xl font-bold" style={{ color: "var(--sea-ink)" }}>Notifications</h1>
			</div>

			{/* Push subscription */}
			<div className="rise-in island-shell rounded-2xl p-5" style={{ animationDelay: "40ms" }}>
				<div className="flex items-center gap-3 mb-3">
					<Bell size={18} style={{ color: "var(--lagoon)" }} />
					<div>
						<p className="text-sm font-semibold" style={{ color: "var(--sea-ink)" }}>Push Notifications</p>
						<p className="text-xs" style={{ color: "var(--sea-ink-soft)" }}>
							{!pushSupported
								? "Not supported in this browser"
								: permissionState === "granted"
									? "Enabled on this device"
									: permissionState === "denied"
										? "Blocked — allow in browser settings"
										: "Get alerts for weather, reminders, and more"}
						</p>
					</div>
				</div>

				{!VAPID_PUBLIC_KEY && (
					<p className="text-xs px-3 py-2 rounded-lg" style={{ background: "rgba(224,112,0,0.1)", color: "#e07000" }}>
						VITE_VAPID_PUBLIC_KEY not configured.
					</p>
				)}

				{pushSupported && VAPID_PUBLIC_KEY && permissionState !== "denied" && (
					<div className="flex gap-2">
						{permissionState !== "granted" ? (
							<Button
								size="sm"
								onClick={handleSubscribe}
								disabled={subscribing}
								style={{ background: "var(--lagoon)", color: "white", border: "none" }}
							>
								{subscribing ? <Loader2 size={14} className="animate-spin" /> : <Bell size={14} />}
								<span className="ml-1">Enable Push</span>
							</Button>
						) : (
							<Button
								size="sm"
								variant="ghost"
								onClick={handleUnsubscribe}
								disabled={unsubscribing}
							>
								{unsubscribing ? <Loader2 size={14} className="animate-spin" /> : <BellOff size={14} />}
								<span className="ml-1">Disable</span>
							</Button>
						)}
					</div>
				)}
			</div>

			{/* Unread notifications */}
			{unreadNotifications && unreadNotifications.length > 0 && (
				<div className="rise-in island-shell rounded-2xl p-4" style={{ animationDelay: "80ms" }}>
					<p className="text-sm font-semibold mb-3" style={{ color: "var(--sea-ink)" }}>
						Unread ({unreadNotifications.length})
					</p>
					<div className="space-y-2">
						{unreadNotifications.map((n) => (
							<div key={n._id} className="flex items-start justify-between gap-3">
								<div className="flex-1 min-w-0">
									<p className="text-sm" style={{ color: "var(--sea-ink)" }}>{n.type}</p>
									<p className="text-xs" style={{ color: "var(--sea-ink-soft)" }}>
										{new Date(n._creationTime).toLocaleDateString()}
									</p>
								</div>
								<button
									type="button"
									onClick={() => markReadMutation({ notificationId: n._id })}
									className="shrink-0"
								>
									<CheckCircle2 size={16} style={{ color: "var(--palm)" }} />
								</button>
							</div>
						))}
					</div>
				</div>
			)}

			{unreadNotifications?.length === 0 && (
				<div className="rise-in island-shell rounded-2xl p-8 text-center" style={{ animationDelay: "80ms" }}>
					<p className="text-sm" style={{ color: "var(--sea-ink-soft)" }}>No unread notifications.</p>
				</div>
			)}
		</div>
	)
}
