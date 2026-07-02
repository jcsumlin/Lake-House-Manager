import { defineConfig } from "vite"
import { devtools } from "@tanstack/devtools-vite"
import { tanstackStart } from "@tanstack/react-start/plugin/vite"
import viteReact from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import { cloudflare } from "@cloudflare/vite-plugin"
import { VitePWA } from "vite-plugin-pwa"

const config = defineConfig({
	resolve: { tsconfigPaths: true },
	environments: {
		// The Cloudflare worker environment is named after the wrangler worker
		// (hyphens replaced with underscores). Its dep optimizer can't resolve
		// TanStack Start's virtual module IDs (#tanstack-router-entry etc.)
		// so we exclude the whole chain from pre-bundling.
		lake_house_manager: {
			// Only exclude start-server-core — it contains dynamic imports of
			// virtual modules (#tanstack-router-entry etc.) that rolldown can't
			// resolve during optimization. The broader react-start chain is kept
			// in the optimizer so CJS deps (react, react-dom) are wrapped to ESM.
			optimizeDeps: {
				exclude: ["@tanstack/start-server-core"],
			},
		},
	},
	plugins: [
		devtools(),
		cloudflare(),
		tailwindcss(),
		tanstackStart(),
		viteReact(),
		VitePWA({
			registerType: "autoUpdate",
			manifest: false, // use existing public/manifest.json
			workbox: {
				globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
				runtimeCaching: [
					{
						urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
						handler: "CacheFirst",
						options: {
							cacheName: "google-fonts-cache",
							expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
						},
					},
				],
			},
			devOptions: {
				enabled: false,
			},
		}),
	],
})

export default config
