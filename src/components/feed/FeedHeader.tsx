import { useNavigate } from "@tanstack/react-router";
import type { Theme } from "../../lib/theme";
import { FeedStats } from "./FeedStats";
import { FeedTabs } from "./FeedTabs";

type Props = {
	total: number;
	streak: number;
	combo: number;
	favoriteCount: number;
	dailyComplete: boolean;
	theme: Theme;
	onToggleTheme: () => void;
	/** already on "/" — rewind the feed instead of navigating */
	onLogoRewind: () => void;
	isHome: boolean;
};

export function FeedHeader({
	total,
	streak,
	combo,
	favoriteCount,
	dailyComplete,
	theme,
	onToggleTheme,
	onLogoRewind,
	isHome,
}: Props) {
	const navigate = useNavigate();

	return (
		<header className="pointer-events-none absolute inset-x-0 top-0 z-40 flex items-center justify-between gap-2 bg-gradient-to-b from-bg/95 via-bg/60 to-transparent px-4 pt-3 pb-8">
			<button
				type="button"
				onClick={(e) => {
					e.currentTarget.blur();
					if (isHome) onLogoRewind();
					else navigate({ to: "/", viewTransition: true });
				}}
				aria-label="Back to the start"
				className="pointer-events-auto border-0 bg-transparent p-0 text-base font-black tracking-widest"
			>
				🎮{" "}
				<span className="bg-gradient-to-r from-accent to-accent2 bg-clip-text text-transparent">
					GAMESHORTS
				</span>
			</button>

			<FeedTabs favoriteCount={favoriteCount} dailyComplete={dailyComplete} />

			<FeedStats
				total={total}
				streak={streak}
				combo={combo}
				theme={theme}
				onToggleTheme={onToggleTheme}
			/>
		</header>
	);
}
