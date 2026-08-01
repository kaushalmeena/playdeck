import { createFileRoute } from "@tanstack/react-router";
import { GameFeed } from "../components/feed/GameFeed";
import { GAMES } from "../games/registry";

export const Route = createFileRoute("/favorites")({
	component: FavoritesFeed,
});

function FavoritesFeed() {
	return <GameFeed games={GAMES} tab="favorites" />;
}
