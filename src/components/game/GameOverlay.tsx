import type { CSSProperties, MouseEvent } from "react";

import type { GameResult } from "../../games/kit";
import { useCountUp } from "../../hooks/useCountUp";
import { sfx } from "../../lib/sfx";

type Props = {
	emoji: string;
	title: string;
	accent: string;
	level: number;
	instructions: string;
	result: GameResult;
	onPlay: () => void;
	/** page the feed onward — offered once a run has finished */
	onNext?: () => void;
};

/** the start / result screen shown whenever a run isn't in progress */
export function GameOverlay({
	emoji,
	title,
	accent,
	level,
	instructions,
	result,
	onPlay,
	onNext,
}: Props) {
	const gradient = `linear-gradient(135deg, ${accent}, #00e5ff)`;

	const handlePlay = (e: MouseEvent<HTMLButtonElement>) => {
		e.currentTarget.blur();
		sfx.start();
		onPlay();
	};

	const handleNext = (e: MouseEvent<HTMLButtonElement>) => {
		e.currentTarget.blur();
		onNext?.();
	};

	return (
		<div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-bg/40 px-6 text-center backdrop-blur-md">
			<div
				className={result ? "text-7xl" : "animate-bounce-slow text-7xl"}
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
			{result ? (
				<ResultSummary result={result} accent={accent} />
			) : (
				<p className="max-w-72 text-sm leading-relaxed text-muted">
					{instructions}
				</p>
			)}
			{/*
			 * The ::before stretches this button's hit area over the whole
			 * overlay: tap anywhere to play, while it stays one real button for
			 * keyboards and screen readers.
			 */}
			<button
				type="button"
				onClick={handlePlay}
				className="animate-play-glow mt-2 rounded-full px-10 py-3.5 text-base font-extrabold text-white transition-transform before:absolute before:inset-0 before:content-[''] active:scale-95"
				style={{ backgroundImage: gradient, "--glow": accent } as CSSProperties}
			>
				{result ? (result.won ? "▶ Next level" : "↻ Retry") : "▶ Play"}
			</button>
			<p className="text-[11px] font-bold tracking-[0.25em] text-muted/70">
				{result ? "TAP ANYWHERE TO GO AGAIN" : "TAP ANYWHERE TO START"}
			</p>
			{result && onNext && (
				<button
					type="button"
					onClick={handleNext}
					// above the stretched play area
					className="relative z-10 rounded-full border border-line bg-card/80 px-6 py-2.5 text-sm font-bold text-text backdrop-blur-md transition-transform active:scale-95"
				>
					Next game ↓
				</button>
			)}
		</div>
	);
}

/** the headline and a counting-up score; the overlay remounts each run */
function ResultSummary({
	result,
	accent,
}: {
	result: NonNullable<GameResult>;
	accent: string;
}) {
	const score = useCountUp(result.score, result);
	const head = result.note ?? (result.won ? "Level cleared!" : "Game over");

	return (
		<div className="animate-result-in">
			<p
				className={
					result.won
						? "text-sm font-extrabold text-good"
						: "text-sm font-extrabold text-muted"
				}
			>
				{result.won ? `🔥 ${head}` : head}
			</p>
			<p
				className="mt-1 text-5xl font-black tabular-nums"
				style={{ color: result.won ? accent : undefined }}
			>
				+{score}
			</p>
		</div>
	);
}
