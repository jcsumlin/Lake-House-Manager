import { betterAuth } from "better-auth"
import { magicLink } from "better-auth/plugins"
import { convexBetterAuthReactStart } from "@convex-dev/better-auth/react-start"

const convexSiteUrl = process.env.CONVEX_SITE_URL ?? ""
const convexUrl = process.env.VITE_CONVEX_URL ?? ""

export const auth = betterAuth({
	plugins: [
		magicLink({
			sendMagicLink: async ({ email, url }) => {
				// TODO: wire up email provider (Resend, Postmark, etc.)
				console.log(`Magic link for ${email}: ${url}`)
			},
		}),
	],
})

export const { getToken, handler, fetchAuthQuery, fetchAuthMutation } =
	convexBetterAuthReactStart({
		convexUrl,
		convexSiteUrl,
	})
