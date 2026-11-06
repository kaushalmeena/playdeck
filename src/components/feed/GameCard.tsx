import { memo, useEffect, useState } from "react";

import type { GameEntry } from "../../games/registry";
import { CardRail } from "./CardRail";
import { CardPlaceholder, LockedCard } from "./CardStates";

export type GameCardProps = {
	game: GameEntry;
	/** load the game's component (the card is on or next to the screen) */
	mounted: boolean;
	/** this is the card currently filling the screen */
	active: boolean;
	locked: boolean;
	unlockAt: number;
	level: number;
	best: number;
	isFavorite: boolean;
	dailyDone: boolean;
	onToggleFavorite: () => void;
	onEnd: (won: boolean, score: number) => void;
	onPlayingChange: (playing: boolean) => void;
};

function GameCardImpl({
	game,
	mounted,
	active,
	locked,
	unlockAt,
	level,
	best,
	isFavorite,
	dailyDone,
	onToggleFavorite,
	onEnd,
	onPlayingChange,
}: GameCardProps) {
	// An already-downloaded game renders on the very first frame, so a card the
	// feed preloaded never flashes its placeholder.
	const [Game, setGame] = useState(() => game.loaded());

	useEffect(() => {
		if (!mounted || Game) return;
		let alive = true;
		game.load().then((Component) => {
			if (alive) setGame(() => Component);
		});
		return () => {
			alive = false;
		};
	}, [mounted, game, Game]);

	return (
		<section className="relative size-full overflow-hidden" data-game={game.id}>
			{locked ? (
				<LockedCard game={game} unlockAt={unlockAt} total={total} />
			) : mounted && Game ? (
				<Game
					level={level}
					active={active}
					onEnd={onEnd}
					onPlayingChange={onPlayingChange}
					onNext={onNext}
				/>
			) : (
				<CardPlaceholder game={game} />
			)}

			<div // text-shadow, not a drop-shadow filter: a filtered layer next to the
				// overlay's backdrop-filter stops painting in Chrome
				className="pointer-events-none absolute bottom-6 left-4 z-30 max-w-[65%] [text-shadow:0_2px_8px_rgb(0_0_0/0.45)]"
			>
				<h2 className="text-lg font-extrabold tracking-wide">
					{game.emoji} {game.title}
					{dailyDone && " ✅"}
				</h2>
				<p className="mt-1 text-sm text-muted">{game.desc}</p>
			</div>

			{!locked && (
				<CardRail
					game={game}
					level={level}
					best={best}
					isFavorite={isFavorite}
					onToggleFavorite={onToggleFavorite}
				/>
			)}
		</section>
	);
}

/**
 * Memoised: the feed re-renders on every scroll tick, and a re-render of a
 * live game would restart its animation loop.
 */
export const GameCard = memo(GameCardImpl);
