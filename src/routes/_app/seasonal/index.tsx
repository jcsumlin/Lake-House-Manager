import { useConvexQuery } from "@convex-dev/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { api } from "../../../../convex/_generated/api"
import { useCurrentMember } from "#/lib/auth/useCurrentMember"
import { ChevronRight, Leaf, Snowflake, Sun } from "lucide-react"

export const Route = createFileRoute("/_app/seasonal/")({
	component: SeasonalPage,
})

const CURRENT_MONTH = new Date().getMonth() + 1
const IS_CLOSING_SEASON = CURRENT_MONTH >= 9 || CURRENT_MONTH <= 4

function SeasonalPage() {
	const { property } = useCurrentMember()

	const templates = useConvexQuery(
		api.taskTemplates.list,
		property ? { propertyId: property._id } : "skip",
	)

	const closingTemplates = templates?.filter((t) => t.category === "closing")
	const openingTemplates = templates?.filter((t) => t.category === "opening")

	return (
		<div className="page-wrap py-6 space-y-5">
			<div className="rise-in">
				<p className="island-kicker mb-1" style={{ color: "var(--kicker)" }}>Seasonal</p>
				<h1 className="display-title text-2xl font-bold" style={{ color: "var(--sea-ink)" }}>
					{IS_CLOSING_SEASON ? "End of Season" : "Seasonal Hub"}
				</h1>
			</div>

			{/* Status card */}
			<div
				className="rise-in rounded-2xl p-5"
				style={{
					animationDelay: "40ms",
					background: IS_CLOSING_SEASON
						? "linear-gradient(135deg, rgba(96,165,250,0.12), rgba(30,58,138,0.08))"
						: "linear-gradient(135deg, rgba(74,222,128,0.12), rgba(47,106,74,0.08))",
					border: "1px solid var(--line)",
				}}
			>
				<div className="flex items-center gap-3 mb-2">
					{IS_CLOSING_SEASON ? (
						<Snowflake size={24} style={{ color: "#60a5fa" }} />
					) : (
						<Sun size={24} style={{ color: "#f59e0b" }} />
					)}
					<span className="text-sm font-semibold" style={{ color: "var(--sea-ink)" }}>
						{IS_CLOSING_SEASON ? "Winterization season" : "Open season"}
					</span>
				</div>
				<p className="text-xs" style={{ color: "var(--sea-ink-soft)" }}>
					{IS_CLOSING_SEASON
						? "Time to close up the lake house for the season. Start the closing wizard to walk through all the steps."
						: "Welcome back! Use the opening wizard to get everything set for the season."}
				</p>
			</div>

			{/* Actions */}
			<div className="rise-in space-y-2" style={{ animationDelay: "80ms" }}>
				<Link
					to="/seasonal/closing"
					className="island-shell rounded-xl px-4 py-4 flex items-center gap-3"
				>
					<span className="size-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(96,165,250,0.15)", color: "#60a5fa" }}>
						<Snowflake size={18} />
					</span>
					<div className="flex-1">
						<p className="text-sm font-semibold" style={{ color: "var(--sea-ink)" }}>Closing Wizard</p>
						<p className="text-xs" style={{ color: "var(--sea-ink-soft)" }}>
							{closingTemplates?.length
								? `${closingTemplates.length} template${closingTemplates.length !== 1 ? "s" : ""} available`
								: "Winterize your property step by step"}
						</p>
					</div>
					<ChevronRight size={16} style={{ color: "var(--sea-ink-soft)" }} />
				</Link>

				<div
					className="island-shell rounded-xl px-4 py-4 flex items-center gap-3 opacity-60"
					title="Coming soon"
				>
					<span className="size-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(74,222,128,0.15)", color: "var(--palm)" }}>
						<Leaf size={18} />
					</span>
					<div className="flex-1">
						<p className="text-sm font-semibold" style={{ color: "var(--sea-ink)" }}>Opening Wizard</p>
						<p className="text-xs" style={{ color: "var(--sea-ink-soft)" }}>
							{openingTemplates?.length
								? `${openingTemplates.length} template${openingTemplates.length !== 1 ? "s" : ""} available`
								: "Get the property ready for the season"}
						</p>
					</div>
					<span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "rgba(0,0,0,0.06)", color: "var(--sea-ink-soft)" }}>Soon</span>
				</div>
			</div>
		</div>
	)
}
