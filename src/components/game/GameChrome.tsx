import type { ReactNode } from "react";
import { useEffect, useRef } from "react";

import type { GameResult } from "../../games/kit";
import { useAutoJuice } from "../../hooks/useAutoJuice";
import { stageFor } from "../../lib/stage";
import { GameOverlay } from "./GameOverlay";
import { GameTopBar } from "./GameTopBar";
import { JuiceLayer } from "./JuiceLayer";

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
	/** page the feed to the next game (offered on the result screen) */
	onNext?: () => void;
	/** abort the current run (the ✕ button) */
	onQuit?: () => void;
	onPlayingChange?: (playing: boolean) => void;
	children: ReactNode;
};

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
	onNext,
	onQuit,
	onPlayingChange,
	children,
}: Props) {
	// let the feed lock scrolling while a run is live
	const stage = useRef<HTMLDivElement>(null);
	useAutoJuice(playing, accent);

	useEffect(() => {
		onPlayingChange?.(playing);
		return () => onPlayingChange?.(false);
	}, [playing, onPlayingChange]);

	return (
		<div
			ref={stage}
			className="relative size-full overflow-hidden select-none"
			style={{ background: stageFor(accent) }}
		>
			{children}

			<JuiceLayer live={playing} accent={accent} stageRef={stage} />

			{playing && progress !== undefined && (
				<div
					// sits just under the feed header, which would otherwise cover it
					className="absolute inset-x-4 top-14 z-10 h-1.5 origin-left rounded-full transition-transform duration-100"
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
					onNext={onNext}
				/>
			)}
		</div>
	);
}
