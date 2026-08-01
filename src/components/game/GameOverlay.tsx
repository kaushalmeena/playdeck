import type { GameResult } from "../../games/kit";

type Props = {
	emoji: string;
	title: string;
	accent: string;
	level: number;
	instructions: string;
	result: GameResult;
	onPlay: () => void;
};

function resultLine(result: NonNullable<GameResult>): string {
	const head = result.note ?? (result.won ? "Level cleared!" : "Game over");
	return `${head} · +${result.score} pts`;
}

/** the start / result screen shown whenever a run isn't in progress */
export function GameOverlay({
	emoji,
	title,
	accent,
	level,
	instructions,
	result,
	onPlay,
}: Props) {
	const gradient = `linear-gradient(135deg, ${accent}, #00e5ff)`;

	return (
		<div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-bg/60 px-6 text-center backdrop-blur-md">
			<div
				className="text-7xl"
				style={{ filter: `drop-shadow(0 0 26px ${accent})` }}
			>
				{emoji}
			</div>
			<h1
				className="bg-clip-text text-2xl font-black tracking-[0.3em] text-transparent"
				style={{ backgroundImage: gradient }}
			>
				{title.toUpperCase()}
			</h1>
			<div className="rounded-full border border-line bg-card px-4 py-1 text-xs font-extrabold tracking-[0.2em] text-accent2">
				LEVEL {level}
			</div>
			<p className="max-w-72 text-sm leading-relaxed text-muted">
				{result ? resultLine(result) : instructions}
			</p>
			<button
				type="button"
				onClick={(e) => {
					e.currentTarget.blur();
					onPlay();
				}}
				className="mt-2 rounded-full px-10 py-3.5 text-base font-extrabold text-white shadow-[0_8px_30px_rgba(124,92,255,0.4)]"
				style={{ backgroundImage: gradient }}
			>
				{result ? (result.won ? "▶ Next level" : "↻ Retry") : "▶ Play"}
			</button>
		</div>
	);
}
