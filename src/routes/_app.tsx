import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router"
import { useConvexAuth } from "@convex-dev/auth/react"
import { useEffect } from "react"
import { AppShell } from "#/components/layout/AppShell"

export const Route = createFileRoute("/_app")({
	component: AppLayout,
})

function AppLayout() {
	const { isAuthenticated, isLoading } = useConvexAuth()
	const navigate = useNavigate()

	useEffect(() => {
		if (!isLoading && !isAuthenticated) {
			navigate({ to: "/login" })
		}
	}, [isAuthenticated, isLoading, navigate])

	if (isLoading || !isAuthenticated) return null

	return (
		<AppShell>
			<Outlet />
		</AppShell>
	)
}
