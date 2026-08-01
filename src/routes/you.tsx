import { createFileRoute } from "@tanstack/react-router";
import { GameFeed } from "../components/feed/GameFeed";
import { GAMES } from "../games/registry";
import { seo } from "../lib/seo";

export const Route = createFileRoute("/you")({
	head: () =>
		seo({
			title: "Your games",
			description:
				"Your Playdeck feed, ordered by the games you actually play — favourites and high scores first.",
			path: "/you",
		}),
	component: ForYouFeed,
});

function ForYouFeed() {
	return <GameFeed games={GAMES} tab="foryou" />;
}
