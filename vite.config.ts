import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";

/**
 * GitHub Pages serves a project site from /<repo>/, so the deploy workflow
 * builds with BASE_PATH set. Locally it stays "/" and nothing changes.
 */
const base = process.env.BASE_PATH ?? "/";
const SITE_ORIGIN =
	process.env.VITE_SITE_URL ?? "https://kaushalmeena.github.io";
const basepath = base === "/" ? undefined : base.replace(/\/$/, "");

const config = defineConfig({
	base,
	resolve: { tsconfigPaths: true },
	plugins: [
		tailwindcss(),
		tanstackStart({
			router: { basepath },
			// crawl every route into static HTML so Pages can serve the app
			// without a server. Note: enabling `spa` here would divert the root
			// render to _shell.html and leave no index.html at all.
			prerender: { enabled: true, crawlLinks: true },
			// emitted next to the prerendered pages for search engines
			sitemap: { enabled: true, host: `${SITE_ORIGIN}${base}` },
		}),
		viteReact(),
	],
});

export default config;
