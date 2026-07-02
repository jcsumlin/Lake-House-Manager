import { Email } from "@convex-dev/auth/providers/Email"
import { Password } from "@convex-dev/auth/providers/Password"
import { convexAuth } from "@convex-dev/auth/server"

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
	providers: [
		Password,
		Email({
			id: "resend-magic-link",
			// True magic link: no email re-check needed on verification, only the token
			authorize: undefined,
			sendVerificationRequest: async ({ identifier: email, url }) => {
				// return console.log(`Send magic link to ${email}: ${url}`)
				const apiKey = process.env.AUTH_RESEND_KEY
				if (!apiKey) throw new Error("AUTH_RESEND_KEY is not set")
				const from =
					process.env.AUTH_EMAIL_FROM ?? "Lake House Manager <noreply@chatsumlin.com>"
				const res = await fetch("https://api.resend.com/emails", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${apiKey}`,
					},
					body: JSON.stringify({
						from,
						to: email,
						subject: "Sign in to Lake House Manager",
						html: `<p>Click the link below to sign in. This link expires in 10 minutes.</p><p><a href="${url}">Sign in to Lake House Manager</a></p>`,
					}),
				})
				if (!res.ok) {
					throw new Error(`Resend API error: ${await res.text()}`)
				}
			},
		}),
	],
})
