import { useRouter } from "@tanstack/react-router"
import { AlertTriangle, RefreshCw } from "lucide-react"

interface Props {
	error: Error
	reset?: () => void
}

export function ErrorBoundary({ error, reset }: Props) {
	const router = useRouter()

	const isDev = import.meta.env.DEV

	return (
		<div className="min-h-dvh flex flex-col items-center justify-center px-6 py-16 text-center">
			{/* Icon */}
			<div
				className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6"
				style={{
					background: "rgba(220, 80, 60, 0.08)",
					border: "1px solid rgba(220, 80, 60, 0.18)",
				}}
			>
				<AlertTriangle size={28} style={{ color: "#dc503c" }} />
			</div>

			<h1
				className="display-title text-2xl font-bold mb-3"
				style={{ color: "var(--sea-ink)" }}
			>
				Something went wrong
			</h1>

			<p
				className="text-sm max-w-sm leading-relaxed mb-2"
				style={{ color: "var(--sea-ink-soft)" }}
			>
				An unexpected error occurred. Try refreshing the page — if it keeps
				happening, let the house admin know.
			</p>

			{/* Dev error detail */}
			{isDev && error?.message && (
				<pre
					className="mt-4 mb-6 text-left text-xs px-4 py-3 rounded-xl max-w-lg w-full overflow-auto"
					style={{
						background: "rgba(23, 58, 64, 0.06)",
						border: "1px solid var(--line)",
						color: "var(--sea-ink)",
					}}
				>
					{error.message}
					{error.stack ? `\n\n${error.stack}` : ""}
				</pre>
			)}

			<div className="flex flex-col sm:flex-row gap-3 mt-4">
				{reset && (
					<button
						type="button"
						onClick={reset}
						className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
						style={{
							background: "linear-gradient(135deg, var(--palm), var(--lagoon-deep))",
							color: "white",
						}}
					>
						<RefreshCw size={15} />
						Try again
					</button>
				)}

				<button
					type="button"
					onClick={() => {
						reset?.()
						router.navigate({ to: "/" })
					}}
					className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
					style={{
						background: "rgba(255,255,255,0.6)",
						border: "1px solid var(--line)",
						color: "var(--sea-ink)",
					}}
				>
					Go home
				</button>
			</div>
		</div>
	)
}
