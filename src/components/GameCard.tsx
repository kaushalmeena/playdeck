import { Suspense } from "react";
import type { GameEntry } from "../games/registry";

type Props = {
	game: GameEntry;
	/** mount the (lazy) game component only when the card is near the viewport */
	mounted: boolean;
	/** true when this card is the one on screen */
	active: boolean;
	level: number;
	best: number;
	isFavorite: boolean;
	onToggleFavorite: () => void;
	onEnd: (won: boolean, score: number) => void;
	onPlayingChange: (playing: boolean) => void;
};

function Placeholder({ game }: { game: GameEntry }) {
	return (
		<div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-bg">
			<div className="text-6xl opacity-40">{game.emoji}</div>
			<div className="text-sm tracking-widest text-muted">
				{game.title.toUpperCase()}
			</div>
		</div>
	);
}

export function GameCard({
	game,
	mounted,
	active,
	level,
	best,
	isFavorite,
	onToggleFavorite,
	onEnd,
	onPlayingChange,
}: Props) {
	return (
		<section
			className="relative h-full w-full shrink-0 snap-start snap-always overflow-hidden"
			data-game={game.id}
		>
			{mounted ? (
				<Suspense fallback={<Placeholder game={game} />}>
					<game.Component
						level={level}
						active={active}
						onEnd={onEnd}
						onPlayingChange={onPlayingChange}
					/>
				</Suspense>
			) : (
				<Placeholder game={game} />
			)}

			{/* bottom-left: title + description */}
			<div className="pointer-events-none absolute bottom-6 left-4 z-30 max-w-[65%] drop-shadow-[0_2px_8px_rgba(0,0,0,0.35)]">
				<h2 className="text-lg font-extrabold tracking-wide">
					{game.emoji} {game.title}
				</h2>
				<p className="mt-1 text-sm text-muted">{game.desc}</p>
			</div>

			{/* right rail: favorite + stats, shorts-style */}
			<div className="absolute right-3 bottom-6 z-30 flex flex-col items-center gap-3">
				<button
					type="button"
					onClick={onToggleFavorite}
					aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
					aria-pressed={isFavorite}
					className={`flex h-12 w-12 cursor-pointer items-center justify-center rounded-full border text-xl backdrop-blur-md transition-transform active:scale-90 ${
						isFavorite
							? "border-danger/60 bg-danger/25 text-danger"
							: "border-line bg-card/70 text-text/80"
					}`}
				>
					{isFavorite ? "♥" : "♡"}
				</button>
				<div
					className="rounded-full border border-line bg-card/70 px-3 py-1.5 text-xs font-bold tracking-wider backdrop-blur-md"
					style={game.accent ? { color: game.accent } : undefined}
				>
					LV {level}
				</div>
				<div className="rounded-full border border-line bg-card/70 px-3 py-1.5 text-xs font-bold tracking-wider text-accent2 backdrop-blur-md">
					★ {best}
				</div>
			</div>
		</section>
	);
}
