import { createFileRoute, Outlet } from "@tanstack/react-router"
import { AppShell } from "#/components/layout/AppShell"

export const Route = createFileRoute("/_app")({
	// TODO: un-comment when auth is wired up
	// beforeLoad: async ({ context }) => {
	//   const session = await getSession()
	//   if (!session) throw redirect({ to: '/login' })
	// },
	component: AppLayout,
})

function AppLayout() {
	return (
		<AppShell>
			<Outlet />
		</AppShell>
	)
}
