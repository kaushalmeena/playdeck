import type { ReactNode } from "react";
import { useEffect } from "react";
import type { GameResult } from "../games/kit";

type Props = {
	emoji: string;
	title: string;
	accent?: string;
	level: number;
	instructions: string;
	playing: boolean;
	result: GameResult;
	/** extra topbar chips while playing, e.g. ["🍏 2/5", "20 PTS"] */
	chips?: Array<string>;
	/** 0..1 — renders the standard timer bar at the top while playing */
	progress?: number;
	onPlay: () => void;
	/** abort the current run (the ✕ button while playing) */
	onQuit?: () => void;
	onPlayingChange?: (playing: boolean) => void;
	children: ReactNode;
};

export function Chip({ children }: { children: ReactNode }) {
	return (
		<span className="rounded-full border border-line bg-card/85 px-3.5 py-1.5 text-xs font-extrabold tracking-wider">
			{children}
		</span>
	);
}

/**
 * Shared shell around every game: background, in-run topbar, quit button,
 * progress bar and the start / result overlay. Keeps all games looking
 * like one product.
 */
export function GameChrome({
	emoji,
	title,
	accent = "#7c5cff",
	level,
	instructions,
	playing,
	result,
	chips,
	progress,
	onPlay,
	onQuit,
	onPlayingChange,
	children,
}: Props) {
	// let the feed lock scrolling while a run is live
	useEffect(() => {
		onPlayingChange?.(playing);
		return () => onPlayingChange?.(false);
	}, [playing, onPlayingChange]);

	return (
		<div
			className="relative h-full w-full select-none overflow-hidden"
			style={{
				background:
					"radial-gradient(120% 80% at 50% -10%, var(--t-stage) 0%, var(--t-bg) 60%)",
			}}
		>
			{children}

			{playing && progress !== undefined && (
				<div
					className="absolute top-0 left-0 z-10 h-1 w-full origin-left transition-transform duration-100"
					style={{
						transform: `scaleX(${Math.min(Math.max(progress, 0), 1)})`,
						backgroundImage: `linear-gradient(90deg, ${accent}, #00e5ff)`,
					}}
				/>
			)}

			{playing && (
				<div className="pointer-events-none absolute inset-x-0 top-16 z-10 flex justify-center gap-2">
					<Chip>LV {level}</Chip>
					{chips?.map((c) => (
						<Chip key={c}>{c}</Chip>
					))}
				</div>
			)}

			{playing && onQuit && (
				<button
					type="button"
					aria-label="Quit game"
					onClick={(e) => {
						e.currentTarget.blur();
						onQuit();
					}}
					className="absolute top-16 right-3 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-line bg-card/85 text-sm text-muted backdrop-blur-md"
				>
					✕
				</button>
			)}

			{!playing && (
				<div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-bg/60 px-6 text-center backdrop-blur-md">
					<div
						className="text-7xl"
						style={{ filter: `drop-shadow(0 0 26px ${accent})` }}
					>
						{emoji}
					</div>
					<h1
						className="bg-clip-text text-2xl font-black tracking-[0.3em] text-transparent"
						style={{
							backgroundImage: `linear-gradient(135deg, ${accent}, #00e5ff)`,
						}}
					>
						{title.toUpperCase()}
					</h1>
					<div className="rounded-full border border-line bg-card px-4 py-1 text-xs font-extrabold tracking-[0.2em] text-accent2">
						LEVEL {level}
					</div>
					<p className="max-w-72 text-sm leading-relaxed text-muted">
						{result
							? `${result.note ?? (result.won ? "Level cleared!" : "Game over")} · +${result.score} pts`
							: instructions}
					</p>
					<button
						type="button"
						onClick={(e) => {
							e.currentTarget.blur();
							onPlay();
						}}
						className="mt-2 rounded-full px-10 py-3.5 text-base font-extrabold text-white shadow-[0_8px_30px_rgba(124,92,255,0.4)]"
						style={{
							backgroundImage: `linear-gradient(135deg, ${accent}, #00e5ff)`,
						}}
					>
						{result ? (result.won ? "▶ Next level" : "↻ Retry") : "▶ Play"}
					</button>
				</div>
			)}
		</div>
	);
}
