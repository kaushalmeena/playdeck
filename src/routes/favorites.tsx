import { createFileRoute } from "@tanstack/react-router";
import { GameFeed } from "../components/feed/GameFeed";
import { GAMES } from "../games/registry";
import { seo } from "../lib/seo";

export const Route = createFileRoute("/favorites")({
	head: () =>
		seo({
			title: "Favourite games",
			description:
				"Every game you have starred in Playdeck, in one endless feed. Tap the heart on any card to add it.",
			path: "/favorites",
		}),
	component: FavoritesFeed,
});

function FavoritesFeed() {
	return <GameFeed games={GAMES} tab="favorites" />;
}
