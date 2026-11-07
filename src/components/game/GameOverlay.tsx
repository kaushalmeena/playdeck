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
			{/*
			 * Tap anywhere to play: a full-size target behind the content, which
			 * is click-through. Hidden from assistive tech and the tab order —
			 * the real Play button below is the accessible control.
			 */}
			<button
				type="button"
				aria-hidden="true"
				tabIndex={-1}
				onClick={handlePlay}
				className="absolute inset-0 cursor-pointer"
			/>
			<div
				className={
					result
						? "pointer-events-none relative text-7xl"
						: "animate-bounce-slow pointer-events-none relative text-7xl"
				}
				style={{ filter: `drop-shadow(0 0 26px ${accent})` }}
			>
				{emoji}
			</div>
			<h1
				className="pointer-events-none relative bg-clip-text text-2xl font-black tracking-[0.3em] text-transparent"
				style={{ backgroundImage: gradient }}
			>
				{title.toUpperCase()}
			</h1>
			<div className="pointer-events-none relative rounded-full border border-line bg-card px-4 py-1 text-xs font-extrabold tracking-[0.2em] text-accent2">
				LEVEL {level}
			</div>
			{result ? (
				<ResultSummary result={result} accent={accent} />
			) : (
				<p className="pointer-events-none relative max-w-72 text-sm leading-relaxed text-muted">
					{instructions}
				</p>
			)}
			<button
				type="button"
				onClick={handlePlay}
				className="animate-play-glow relative mt-2 rounded-full px-10 py-3.5 text-base font-extrabold text-white transition-transform active:scale-95"
				style={{ backgroundImage: gradient, "--glow": accent } as CSSProperties}
			>
				{result ? (result.won ? "▶ Next level" : "↻ Retry") : "▶ Play"}
			</button>
			<p className="pointer-events-none relative text-[11px] font-bold tracking-[0.25em] text-muted/70">
				{result ? "TAP ANYWHERE TO GO AGAIN" : "TAP ANYWHERE TO START"}
			</p>
			{result && onNext && (
				<button
					type="button"
					onClick={handleNext}
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
		<div className="animate-result-in pointer-events-none relative">
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
