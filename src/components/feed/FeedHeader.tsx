import { useNavigate } from "@tanstack/react-router";
import { sfx } from "../../lib/sfx";
import type { Theme } from "../../lib/theme";
import { Logo } from "../Logo";
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
		<header className="pointer-events-none absolute inset-x-0 top-0 z-40 flex items-center justify-between gap-1.5 bg-linear-to-b from-bg/95 via-bg/60 to-transparent px-3 pt-3 pb-8 sm:gap-2 sm:px-4">
			<button
				type="button"
				onClick={(e) => {
					e.currentTarget.blur();
					sfx.press();
					if (isHome) onLogoRewind();
					else navigate({ to: "/" });
				}}
				aria-label="Back to the start"
				className="pointer-events-auto flex shrink-0 items-center gap-2 border-0 bg-transparent p-0 text-base font-black tracking-widest whitespace-nowrap"
			>
				<Logo size={22} />
				{/* the wordmark needs room the narrowest phones don't have */}
				<span className="hidden bg-linear-to-r from-accent to-accent2 bg-clip-text text-transparent sm:inline">
					PLAYDECK
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
