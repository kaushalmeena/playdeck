import { createFileRoute } from "@tanstack/react-router";
import { GameFeed } from "../components/feed/GameFeed";
import { GAMES } from "../games/registry";
import { SITE, seo } from "../lib/seo";

export const Route = createFileRoute("/")({
	head: () => seo({ title: SITE.tagline, description: SITE.description }),
	component: AllFeed,
});

function AllFeed() {
	return <GameFeed games={GAMES} tab="all" />;
}
