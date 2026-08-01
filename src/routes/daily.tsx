import { createFileRoute } from "@tanstack/react-router";
import { GameFeed } from "../components/feed/GameFeed";
import { GAMES } from "../games/registry";

export const Route = createFileRoute("/daily")({ component: DailyFeed });

function DailyFeed() {
	return <GameFeed games={GAMES} tab="daily" />;
}
