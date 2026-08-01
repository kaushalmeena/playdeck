import { Link } from "@tanstack/react-router";
import type { Tab } from "../../lib/feed/ordering";

export const TAB_ROUTES: Array<{ tab: Tab; to: string; label: string }> = [
	{ tab: "all", to: "/", label: "All" },
	{ tab: "foryou", to: "/you", label: "You" },
	{ tab: "favorites", to: "/favorites", label: "♥" },
	{ tab: "daily", to: "/daily", label: "📅" },
];

type Props = {
	favoriteCount: number;
	dailyComplete: boolean;
};

export function FeedTabs({ favoriteCount, dailyComplete }: Props) {
	return (
		<nav className="pointer-events-auto flex gap-1 rounded-full border border-line bg-card/80 p-1 backdrop-blur-md">
			{TAB_ROUTES.map(({ tab, to, label }) => (
				<Link
					key={tab}
					to={to}
					viewTransition
					activeOptions={{ exact: true }}
					className="rounded-full px-3 py-1 text-xs font-bold tracking-wide text-muted transition-colors data-[status=active]:bg-gradient-to-r data-[status=active]:from-accent data-[status=active]:to-accent2 data-[status=active]:text-white"
				>
					{tab === "favorites" ? `♥ ${favoriteCount}` : label}
					{tab === "daily" && dailyComplete && " ✅"}
				</Link>
			))}
		</nav>
	);
}
