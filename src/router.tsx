import { createRouter as createTanStackRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export function getRouter() {
	const router = createTanStackRouter({
		routeTree,
		// the feed manages its own scroll position per tab
		scrollRestoration: false,
		defaultPreload: "intent",
		defaultPreloadStaleTime: 0,
		// cross-fade between tabs with the View Transitions API (see styles.css)
		defaultViewTransition: true,
	});

	return router;
}

declare module "@tanstack/react-router" {
	interface Register {
		router: ReturnType<typeof getRouter>;
	}
}
