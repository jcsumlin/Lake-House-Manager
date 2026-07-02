import { WifiOff } from "lucide-react"
import { useEffect, useState } from "react"

export function OfflineBanner() {
	const [isOffline, setIsOffline] = useState(
		typeof navigator !== "undefined" ? !navigator.onLine : false,
	)

	useEffect(() => {
		function onOnline() { setIsOffline(false) }
		function onOffline() { setIsOffline(true) }
		window.addEventListener("online", onOnline)
		window.addEventListener("offline", onOffline)
		return () => {
			window.removeEventListener("online", onOnline)
			window.removeEventListener("offline", onOffline)
		}
	}, [])

	if (!isOffline) return null

	return (
		<div
			className="sticky top-0 z-40 flex items-center gap-2 px-4 py-2 text-sm font-semibold"
			style={{ background: "#e07000", color: "white" }}
		>
			<WifiOff size={14} />
			You're offline. Changes will sync when reconnected.
		</div>
	)
}
