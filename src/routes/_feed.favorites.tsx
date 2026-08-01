import { createFileRoute } from "@tanstack/react-router";
import { seo } from "../lib/seo";

/** the feed is rendered by the _feed layout; this route only carries its head */
export const Route = createFileRoute("/_feed/favorites")({
	head: () =>
		seo({
			title: "Favourite games",
			description:
				"Every game you have starred in Playdeck, in one endless feed. Tap the heart on any card to add it.",
			path: "/favorites",
		}),
});
