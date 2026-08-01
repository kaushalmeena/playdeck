import { createFileRoute } from "@tanstack/react-router";
import { seo } from "../lib/seo";

/** the feed is rendered by the _feed layout; this route only carries its head */
export const Route = createFileRoute("/_feed/you")({
	head: () =>
		seo({
			title: "Your games",
			description:
				"Your Playdeck feed, ordered by the games you actually play — favourites and high scores first.",
			path: "/you",
		}),
});
