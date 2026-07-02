import { createFileRoute, Link } from "@tanstack/react-router"
import { Bell, Building2, CalendarClock, ChevronRight, CloudLightning, Users, User } from "lucide-react"

export const Route = createFileRoute("/_app/settings/")({
	component: SettingsPage,
})

const SECTIONS = [
	{ to: "/settings/profile", icon: <User size={18} />, label: "Profile", description: "Your name and preferences" },
	{ to: "/settings/house", icon: <Building2 size={18} />, label: "House settings", description: "Property name, timezone, Wi-Fi" },
	{ to: "/settings/members", icon: <Users size={18} />, label: "Members", description: "Invite and manage family access" },
	{ to: "/settings/notifications", icon: <Bell size={18} />, label: "Notifications", description: "Push alerts for this device" },
	{ to: "/settings/reminders", icon: <CalendarClock size={18} />, label: "Reminders", description: "Pre-arrival task scheduling" },
	{ to: "/settings/weather", icon: <CloudLightning size={18} />, label: "Weather & Alerts", description: "Freeze watch and storm alerts" },
]

function SettingsPage() {
	return (
		<div className="page-wrap py-6">
			<div className="rise-in mb-6">
				<p className="island-kicker mb-1" style={{ color: "var(--kicker)" }}>Settings</p>
				<h1 className="display-title text-2xl font-bold" style={{ color: "var(--sea-ink)" }}>Settings</h1>
			</div>

			<div className="rise-in space-y-2" style={{ animationDelay: "60ms" }}>
				{SECTIONS.map((s) => (
					<Link
						key={s.to}
						to={s.to}
						className="island-shell rounded-2xl px-5 py-4 flex items-center gap-4"
					>
						<span
							className="size-10 rounded-xl flex items-center justify-center shrink-0"
							style={{ background: "rgba(47,106,74,0.1)", color: "var(--palm)" }}
						>
							{s.icon}
						</span>
						<div className="flex-1">
							<p className="font-semibold text-sm" style={{ color: "var(--sea-ink)" }}>{s.label}</p>
							<p className="text-xs" style={{ color: "var(--sea-ink-soft)" }}>{s.description}</p>
						</div>
						<ChevronRight size={16} style={{ color: "var(--sea-ink-soft)" }} />
					</Link>
				))}
			</div>
		</div>
	)
}
