import { createFileRoute } from "@tanstack/react-router";
import { seo } from "../lib/seo";

/** the feed is rendered by the _feed layout; this route only carries its head */
export const Route = createFileRoute("/_feed/daily")({
	head: () =>
		seo({
			title: "Daily challenge",
			description:
				"Three games, the same for every player, changing every day. Clear all three for a bonus and keep your streak alive.",
			path: "/daily",
		}),
});
