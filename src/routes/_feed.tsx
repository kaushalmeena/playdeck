import {
	createFileRoute,
	Outlet,
	useRouterState,
} from "@tanstack/react-router";
import { GameFeed } from "../components/feed/GameFeed";
import { GAMES } from "../games/registry";
import { tabForPath } from "../lib/feed/ordering";

/**
 * A pathless layout that owns the feed.
 *
 * The tab routes below are only there to carry their own SEO head — the feed
 * itself lives here, so navigating between tabs re-renders it with a new tab
 * instead of tearing it down. That keeps the splash to the first load and
 * leaves the scroll position and loaded games intact.
 */
export const Route = createFileRoute("/_feed")({ component: FeedLayout });

function FeedLayout() {
	const pathname = useRouterState({ select: (s) => s.location.pathname });

	return (
		<>
			<GameFeed games={GAMES} tab={tabForPath(pathname)} />
			<Outlet />
		</>
	);
}
