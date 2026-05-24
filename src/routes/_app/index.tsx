import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/_app/")({
	component: Dashboard,
})

function Dashboard() {
	return (
		<div className="page-wrap py-8">
			<div className="rise-in">
				<p
					className="island-kicker mb-2"
					style={{ color: "var(--kicker)" }}
				>
					Dashboard
				</p>
				<h1
					className="display-title text-3xl font-bold mb-1"
					style={{ color: "var(--sea-ink)" }}
				>
					Good morning
				</h1>
				<p
					className="text-sm mb-8"
					style={{ color: "var(--sea-ink-soft)" }}
				>
					Here's what's happening at the lake house.
				</p>
			</div>

			{/* Placeholder cards */}
			<div
				className="rise-in rounded-2xl p-6 island-shell"
				style={{ animationDelay: "80ms" }}
			>
				<p
					className="island-kicker mb-3"
					style={{ color: "var(--kicker)" }}
				>
					Coming soon
				</p>
				<p style={{ color: "var(--sea-ink-soft)" }} className="text-sm">
					The dashboard is under construction. Upcoming stays, open tasks, and
					maintenance items will appear here.
				</p>
			</div>
		</div>
	)
}
