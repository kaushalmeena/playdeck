import type { GameEntry } from "../../games/registry";

/** shown while a card's lazy chunk is still loading, or when it's off-screen */
export function CardPlaceholder({ game }: { game: GameEntry }) {
	return (
		<div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-bg">
			<div className="text-6xl opacity-40">{game.emoji}</div>
			<div className="text-sm tracking-widest text-muted">
				{game.title.toUpperCase()}
			</div>
		</div>
	);
}

/** teaser for a game the player hasn't unlocked yet */
export function LockedCard({
	game,
	unlockAt,
}: {
	game: GameEntry;
	unlockAt: number;
}) {
	return (
		<div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-bg">
			<div className="text-7xl opacity-30 grayscale">{game.emoji}</div>
			<div className="text-5xl">🔒</div>
			<div className="text-sm font-bold tracking-widest text-muted">
				{game.title.toUpperCase()}
			</div>
			<div className="rounded-full border border-line bg-card px-4 py-1.5 text-xs font-extrabold tracking-wider text-accent2">
				UNLOCKS AT 🏆 {unlockAt.toLocaleString()}
			</div>
		</div>
	);
}
