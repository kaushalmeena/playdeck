import { createFileRoute } from "@tanstack/react-router";
import { GameFeed } from "../components/feed/GameFeed";
import { GAMES } from "../games/registry";
import { seo } from "../lib/seo";

export const Route = createFileRoute("/daily")({
	head: () =>
		seo({
			title: "Daily challenge",
			description:
				"Three games, the same for every player, changing every day. Clear all three for a bonus and keep your streak alive.",
			path: "/daily",
		}),
	component: DailyFeed,
});

function DailyFeed() {
	return <GameFeed games={GAMES} tab="daily" />;
}
