import type { ReactNode } from "react";
import { useEffect } from "react";
import type { GameResult } from "../../games/kit";
import { GameOverlay } from "./GameOverlay";
import { GameTopBar } from "./GameTopBar";

export { Chip } from "./Chip";

type Props = {
	emoji: string;
	title: string;
	accent?: string;
	level: number;
	instructions: string;
	playing: boolean;
	result: GameResult;
	/** extra HUD chips while playing, e.g. ["🍏 2/5", "20 PTS"] */
	chips?: Array<string>;
	/** 0..1 — renders the standard timer bar while playing */
	progress?: number;
	onPlay: () => void;
	/** abort the current run (the ✕ button) */
	onQuit?: () => void;
	onPlayingChange?: (playing: boolean) => void;
	children: ReactNode;
};

const STAGE =
	"radial-gradient(120% 80% at 50% -10%, var(--t-stage) 0%, var(--t-bg) 60%)";

/**
 * The frame every game shares: stage background, in-run HUD, progress bar
 * and the start/result overlay. Games render only their play area as
 * children and stay free of presentation concerns.
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
			style={{ background: STAGE }}
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

			{playing ? (
				<GameTopBar level={level} chips={chips} onQuit={onQuit} />
			) : (
				<GameOverlay
					emoji={emoji}
					title={title}
					accent={accent}
					level={level}
					instructions={instructions}
					result={result}
					onPlay={onPlay}
				/>
			)}
		</div>
	);
}
