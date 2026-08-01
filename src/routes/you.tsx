import { createFileRoute } from "@tanstack/react-router";
import { GameFeed } from "../components/feed/GameFeed";
import { GAMES } from "../games/registry";

export const Route = createFileRoute("/you")({ component: ForYouFeed });

function ForYouFeed() {
	return <GameFeed games={GAMES} tab="foryou" />;
}
