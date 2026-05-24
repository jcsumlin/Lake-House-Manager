import { Link, useRouter } from "@tanstack/react-router"
import { ArrowLeft, Home } from "lucide-react"

export function NotFound() {
	const router = useRouter()

	return (
		<div className="min-h-dvh flex flex-col items-center justify-center px-6 py-16 text-center">
			{/* Decorative waves */}
			<div aria-hidden className="mb-8 relative w-40 h-24 mx-auto">
				{[0, 1, 2, 3].map((i) => (
					<svg
						key={i}
						className="absolute inset-x-0"
						style={{
							top: `${i * 18}px`,
							opacity: 1 - i * 0.2,
						}}
						viewBox="0 0 160 24"
						fill="none"
					>
						<path
							d={`M0 ${12 + (i % 2 === 0 ? 4 : -4)}
                 C20 ${12 + (i % 2 === 0 ? -4 : 4)},
                   40 ${12 + (i % 2 === 0 ? 4 : -4)},
                   80 ${12 + (i % 2 === 0 ? -4 : 4)}
                 S140 ${12 + (i % 2 === 0 ? 4 : -4)},
                    160 ${12 + (i % 2 === 0 ? -4 : 4)}`}
							stroke={i % 2 === 0 ? "var(--lagoon)" : "var(--palm)"}
							strokeWidth="2.5"
							strokeLinecap="round"
						/>
					</svg>
				))}
			</div>

			{/* 404 */}
			<p
				className="display-title font-bold leading-none mb-2"
				style={{
					fontSize: "clamp(5rem, 20vw, 9rem)",
					color: "var(--sand)",
					textShadow: "0 2px 0 var(--line)",
					letterSpacing: "-0.03em",
				}}
			>
				404
			</p>

			<h1
				className="display-title text-2xl font-bold mt-2 mb-3"
				style={{ color: "var(--sea-ink)" }}
			>
				Lost on the lake?
			</h1>

			<p
				className="text-sm max-w-xs leading-relaxed mb-8"
				style={{ color: "var(--sea-ink-soft)" }}
			>
				This dock doesn't exist. You may have followed a broken link or the page
				was moved.
			</p>

			<div className="flex flex-col sm:flex-row gap-3">
				<button
					type="button"
					onClick={() => router.history.back()}
					className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
					style={{
						background: "rgba(255,255,255,0.6)",
						border: "1px solid var(--line)",
						color: "var(--sea-ink)",
					}}
				>
					<ArrowLeft size={15} />
					Go back
				</button>

				<Link
					to="/"
					className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
					style={{
						background: "linear-gradient(135deg, var(--palm), var(--lagoon-deep))",
						color: "white",
					}}
				>
					<Home size={15} />
					Back to home
				</Link>
			</div>
		</div>
	)
}
