import type { GameEntry } from "../../games/registry";

type Props = {
	game: GameEntry;
	level: number;
	best: number;
	isFavorite: boolean;
	onToggleFavorite: () => void;
};

/** the shorts-style right rail: favourite toggle, level and best score */
export function CardRail({
	game,
	level,
	best,
	isFavorite,
	onToggleFavorite,
}: Props) {
	return (
		<div className="absolute right-3 bottom-6 z-30 flex flex-col items-center gap-3">
			<button
				type="button"
				onClick={(e) => {
					e.currentTarget.blur();
					onToggleFavorite();
				}}
				aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
				aria-pressed={isFavorite}
				className={`flex h-12 w-12 items-center justify-center rounded-full border text-xl backdrop-blur-md ${
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
	);
}
