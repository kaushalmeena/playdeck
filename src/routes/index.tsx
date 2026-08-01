import { createFileRoute } from "@tanstack/react-router";
import { GameFeed } from "../components/GameFeed";
import { GAMES } from "../games/registry";

export const Route = createFileRoute("/")({
	component: Home,
});

function Home() {
	return <GameFeed games={GAMES} />;
}
