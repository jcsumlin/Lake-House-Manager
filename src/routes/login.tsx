import { useAuthActions } from "@convex-dev/auth/react"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useConvexAuth } from "@convex-dev/auth/react"
import { ArrowRight, Loader2, Mail } from "lucide-react"
import { useEffect, useState } from "react"
import { Button } from "#/components/ui/button"
import { Input } from "#/components/ui/input"
import { Label } from "#/components/ui/label"

export const Route = createFileRoute("/login")({
	component: LoginPage,
})

type Mode = "magic" | "password"
type Status = "idle" | "loading" | "sent" | "error"

function LoginPage() {
	const { signIn } = useAuthActions()
	const { isAuthenticated } = useConvexAuth()
	const navigate = useNavigate()
	const [mode, setMode] = useState<Mode>("magic")
	const [email, setEmail] = useState("")
	const [password, setPassword] = useState("")
	const [status, setStatus] = useState<Status>("idle")
	const [errorMsg, setErrorMsg] = useState("")

	useEffect(() => {
		if (isAuthenticated) {
			navigate({ to: "/" })
		}
	}, [isAuthenticated, navigate])

	async function handleMagicLink(e: React.FormEvent) {
		e.preventDefault()
		if (!email) return
		setStatus("loading")
		setErrorMsg("")
		try {
			await signIn("resend-magic-link", { email })
			setStatus("sent")
		} catch {
			setStatus("error")
			setErrorMsg("Could not send the link. Try again.")
		}
	}

	async function handlePassword(e: React.FormEvent) {
		e.preventDefault()
		if (!email || !password) return
		setStatus("loading")
		setErrorMsg("")
		try {
			await signIn("password", { email, password, flow: "signIn" })
		} catch {
			setStatus("error")
			setErrorMsg("Incorrect email or password.")
		}
	}

	return (
		<div className="min-h-dvh flex flex-col items-center justify-center px-4 py-12 relative">
			{/* Decorative wave rings */}
			<div
				aria-hidden
				className="pointer-events-none absolute inset-0 overflow-hidden"
			>
				<div
					className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full opacity-20"
					style={{
						background:
							"radial-gradient(circle, var(--lagoon) 0%, transparent 70%)",
					}}
				/>
				<div
					className="absolute -bottom-32 -right-32 w-[500px] h-[500px] rounded-full opacity-15"
					style={{
						background:
							"radial-gradient(circle, var(--palm) 0%, transparent 70%)",
					}}
				/>
			</div>

			{/* Card */}
			<div
				className="relative w-full max-w-md island-shell rounded-2xl px-8 py-10 rise-in sm:px-10"
				style={{ borderRadius: "1.25rem" }}
			>
				{/* Brand mark */}
				<div className="mb-8 text-center">
					<div
						className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4"
						style={{
							background: "linear-gradient(135deg, var(--palm), var(--lagoon-deep))",
							boxShadow: "0 4px 12px rgba(47, 106, 74, 0.35)",
						}}
					>
						{/* Lake wave SVG mark */}
						<svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
							<path
								d="M3 16c1.5-2 3-3 4.5-3s3 1.5 4.5 3 3 3 4.5 3"
								stroke="white"
								strokeWidth="2"
								strokeLinecap="round"
							/>
							<path
								d="M3 11c1.5-2 3-3 4.5-3s3 1.5 4.5 3 3 3 4.5 3"
								stroke="rgba(255,255,255,0.6)"
								strokeWidth="2"
								strokeLinecap="round"
							/>
							<path
								d="M3 6c1.5-2 3-3 4.5-3s3 1.5 4.5 3 3 3 4.5 3"
								stroke="rgba(255,255,255,0.3)"
								strokeWidth="2"
								strokeLinecap="round"
							/>
						</svg>
					</div>

					<h1
						className="display-title text-3xl font-bold leading-tight"
						style={{ color: "var(--sea-ink)" }}
					>
						Welcome home.
					</h1>
					<p
						className="mt-2 text-sm leading-relaxed"
						style={{ color: "var(--sea-ink-soft)" }}
					>
						Sign in to manage your lake house with your family.
					</p>
				</div>

				{/* Magic link sent state */}
				{status === "sent" ? (
					<div
						className="rounded-xl p-5 text-center"
						style={{
							background: "rgba(47, 106, 74, 0.08)",
							border: "1px solid rgba(47, 106, 74, 0.18)",
						}}
					>
						<Mail
							size={28}
							className="mx-auto mb-3"
							style={{ color: "var(--palm)" }}
						/>
						<p
							className="font-semibold text-sm mb-1"
							style={{ color: "var(--sea-ink)" }}
						>
							Check your inbox
						</p>
						<p
							className="text-xs leading-relaxed"
							style={{ color: "var(--sea-ink-soft)" }}
						>
							We sent a sign-in link to{" "}
							<strong style={{ color: "var(--sea-ink)" }}>{email}</strong>.
							<br />
							The link expires in 10 minutes.
						</p>
						<button
							type="button"
							onClick={() => setStatus("idle")}
							className="mt-4 text-xs underline underline-offset-2"
							style={{ color: "var(--lagoon-deep)" }}
						>
							Try a different email
						</button>
					</div>
				) : (
					<>
						{/* Mode toggle */}
						<div
							className="flex gap-1 p-1 rounded-xl mb-6"
							style={{
								background: "rgba(23, 58, 64, 0.06)",
								border: "1px solid var(--line)",
							}}
						>
							{(
								[
									{ key: "magic", label: "Magic link" },
									{ key: "password", label: "Password" },
								] as const
							).map(({ key, label }) => (
								<button
									key={key}
									type="button"
									onClick={() => { setMode(key); setStatus("idle"); setErrorMsg("") }}
									className="flex-1 text-xs font-semibold py-1.5 rounded-lg transition-all"
									style={{
										background:
											mode === key
												? "var(--surface-strong)"
												: "transparent",
										color:
											mode === key
												? "var(--sea-ink)"
												: "var(--sea-ink-soft)",
										boxShadow:
											mode === key
												? "0 1px 4px rgba(23,58,64,0.1)"
												: "none",
									}}
								>
									{label}
								</button>
							))}
						</div>

						{mode === "magic" ? (
							<form onSubmit={handleMagicLink} className="space-y-4">
								<div className="space-y-1.5">
									<Label
										htmlFor="email"
										className="text-xs font-semibold"
										style={{ color: "var(--sea-ink-soft)" }}
									>
										Email address
									</Label>
									<Input
										id="email"
										type="email"
										placeholder="you@example.com"
										autoComplete="email"
										value={email}
										onChange={(e) => setEmail(e.target.value)}
										required
										className="h-11"
										style={{
											background: "rgba(255,255,255,0.6)",
											borderColor: "var(--line)",
										}}
									/>
								</div>

								{errorMsg && (
									<p className="text-xs" style={{ color: "var(--destructive)" }}>
										{errorMsg}
									</p>
								)}

								<Button
									type="submit"
									disabled={status === "loading" || !email}
									className="w-full h-11 font-semibold gap-2"
									style={{
										background:
											"linear-gradient(135deg, var(--palm), var(--lagoon-deep))",
										color: "white",
										border: "none",
									}}
								>
									{status === "loading" ? (
										<Loader2 size={16} className="animate-spin" />
									) : (
										<>
											Send magic link
											<ArrowRight size={15} />
										</>
									)}
								</Button>
							</form>
						) : (
							<form onSubmit={handlePassword} className="space-y-4">
								<div className="space-y-1.5">
									<Label
										htmlFor="email-pw"
										className="text-xs font-semibold"
										style={{ color: "var(--sea-ink-soft)" }}
									>
										Email address
									</Label>
									<Input
										id="email-pw"
										type="email"
										placeholder="you@example.com"
										autoComplete="email"
										value={email}
										onChange={(e) => setEmail(e.target.value)}
										required
										className="h-11"
										style={{
											background: "rgba(255,255,255,0.6)",
											borderColor: "var(--line)",
										}}
									/>
								</div>

								<div className="space-y-1.5">
									<div className="flex items-center justify-between">
										<Label
											htmlFor="password"
											className="text-xs font-semibold"
											style={{ color: "var(--sea-ink-soft)" }}
										>
											Password
										</Label>
										<button
											type="button"
											onClick={() => setMode("magic")}
											className="text-xs underline underline-offset-2"
											style={{ color: "var(--lagoon-deep)" }}
										>
											Forgot?
										</button>
									</div>
									<Input
										id="password"
										type="password"
										placeholder="••••••••"
										autoComplete="current-password"
										value={password}
										onChange={(e) => setPassword(e.target.value)}
										required
										className="h-11"
										style={{
											background: "rgba(255,255,255,0.6)",
											borderColor: "var(--line)",
										}}
									/>
								</div>

								{errorMsg && (
									<p className="text-xs" style={{ color: "var(--destructive)" }}>
										{errorMsg}
									</p>
								)}

								<Button
									type="submit"
									disabled={status === "loading" || !email || !password}
									className="w-full h-11 font-semibold gap-2"
									style={{
										background:
											"linear-gradient(135deg, var(--palm), var(--lagoon-deep))",
										color: "white",
										border: "none",
									}}
								>
									{status === "loading" ? (
										<Loader2 size={16} className="animate-spin" />
									) : (
										<>
											Sign in
											<ArrowRight size={15} />
										</>
									)}
								</Button>
							</form>
						)}
					</>
				)}

				{/* Invite notice */}
				<p
					className="mt-6 text-center text-xs leading-relaxed"
					style={{ color: "var(--sea-ink-soft)" }}
				>
					This app is invite-only.{" "}
					<span style={{ color: "var(--sea-ink)" }}>
						Ask a family admin to invite you.
					</span>
				</p>
			</div>

			{/* Footer */}
			<p
				className="mt-8 text-xs"
				style={{ color: "var(--sea-ink-soft)", opacity: 0.6 }}
			>
				Lake House Manager · Private family app
			</p>
		</div>
	)
}
