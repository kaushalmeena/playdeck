import { memo, Suspense } from "react";
import type { GameEntry } from "../../games/registry";
import { CardRail } from "./CardRail";
import { CardPlaceholder, LockedCard } from "./CardStates";

export type GameCardProps = {
	game: GameEntry;
	/** mount the lazy game component (the card is on or next to the screen) */
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
	return (
		<section
			className="relative h-full w-full shrink-0 snap-start snap-always overflow-hidden"
			data-game={game.id}
		>
			{locked ? (
				<LockedCard game={game} unlockAt={unlockAt} />
			) : mounted ? (
				<Suspense fallback={<CardPlaceholder game={game} />}>
					<game.Component
						level={level}
						active={active}
						onEnd={onEnd}
						onPlayingChange={onPlayingChange}
					/>
				</Suspense>
			) : (
				<CardPlaceholder game={game} />
			)}

			<div className="pointer-events-none absolute bottom-6 left-4 z-30 max-w-[65%] drop-shadow-[0_2px_8px_rgba(0,0,0,0.35)]">
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
