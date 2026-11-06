import type { GameEntry } from "../../games/registry";
import { stageFor } from "../../lib/stage";

/**
 * Shown while a card's chunk is still downloading, or when it is off-screen.
 *
 * Dressed to match the splash and the game overlay, because a bare emoji on a
 * flat background reads as broken styling rather than as loading.
 */
export function CardPlaceholder({ game }: { game: GameEntry }) {
	return (
		<div
			className="absolute inset-0 flex flex-col items-center justify-center gap-4"
			style={{ background: stageFor(game.accent) }}
		>
			<div
				className="animate-bounce-slow text-7xl"
				style={
					game.accent
						? { filter: `drop-shadow(0 0 26px ${game.accent})` }
						: undefined
				}
			>
				{game.emoji}
			</div>
			<div className="text-sm font-black tracking-[0.3em] text-muted">
				{game.title.toUpperCase()}
			</div>
			<div
				className="h-1 w-28 overflow-hidden rounded-full bg-line"
				role="progressbar"
				aria-label={`Loading ${game.title}`}
			>
				<div className="animate-slide h-full w-1/3 rounded-full bg-linear-to-r from-accent to-accent2" />
			</div>
		</div>
	);
}

/** teaser for a game the player hasn't unlocked yet */
export function LockedCard({
	game,
	unlockAt,
	total,
}: {
	game: GameEntry;
	unlockAt: number;
	/** the player's global score — how far along the unlock they are */
	total: number;
}) {
	const progress = unlockAt > 0 ? Math.min(total / unlockAt, 1) : 1;
	return (
		<div
			className="absolute inset-0 flex flex-col items-center justify-center gap-4"
			style={{ background: stageFor(game.accent) }}
		>
			<div className="text-7xl opacity-30 grayscale">{game.emoji}</div>
			<div className="text-5xl">🔒</div>
			<div className="text-sm font-bold tracking-widest text-muted">
				{game.title.toUpperCase()}
			</div>
			<div className="rounded-full border border-line bg-card px-4 py-1.5 text-xs font-extrabold tracking-wider text-accent2">
				UNLOCKS AT 🏆 {unlockAt.toLocaleString()}
			</div>
			<div className="w-48">
				<div
					className="h-2 overflow-hidden rounded-full bg-line"
					role="progressbar"
					aria-label={`Unlock progress for ${game.title}`}
					aria-valuemin={0}
					aria-valuemax={unlockAt}
					aria-valuenow={Math.min(total, unlockAt)}
				>
					<div
						className="h-full rounded-full bg-linear-to-r from-accent to-accent2"
						style={{ width: `${progress * 100}%` }}
					/>
				</div>
				<p className="mt-2 text-center text-xs text-muted">
					{Math.max(unlockAt - total, 0).toLocaleString()} pts to go — play any
					game to earn them
				</p>
			</div>
		</div>
	);
}
