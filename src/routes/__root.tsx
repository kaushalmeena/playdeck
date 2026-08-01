import { createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { useEffect } from "react";

import { themeInitScript } from "../lib/theme";
import appCss from "../styles.css?url";

/** "/" locally, "/<repo>/" on GitHub Pages — always ends in a slash */
const BASE = import.meta.env.BASE_URL;

export const Route = createRootRoute({
	head: () => ({
		meta: [
			{
				charSet: "utf-8",
			},
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1, viewport-fit=cover",
			},
			{
				name: "theme-color",
				content: "#0b0b14",
			},
			{
				title: "Playdeck — swipe, play, level up",
			},
		],
		links: [
			{
				rel: "stylesheet",
				href: appCss,
			},
			{
				rel: "manifest",
				href: `${BASE}manifest.webmanifest`,
			},
			{
				rel: "icon",
				href: `${BASE}icon.svg`,
				type: "image/svg+xml",
			},
		],
		scripts: [
			{
				// apply saved / system theme before first paint
				children: themeInitScript,
			},
		],
	}),
	shellComponent: RootDocument,
});

function RootDocument({ children }: { children: React.ReactNode }) {
	// offline support (production only — caching would fight Vite in dev)
	useEffect(() => {
		if (import.meta.env.PROD && "serviceWorker" in navigator) {
			navigator.serviceWorker
				.register(`${BASE}sw.js`, { scope: BASE })
				.catch(() => {});
		}
	}, []);

	return (
		<html lang="en" suppressHydrationWarning>
			<head>
				<HeadContent />
			</head>
			<body>
				{children}
				<Scripts />
			</body>
		</html>
	);
}
