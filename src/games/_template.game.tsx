/**
 * GameShorts game template.
 *
 * 1. Copy this file to src/games/<your-game>.game.tsx (no leading
 *    underscore — files starting with "_" are ignored by the feed).
 * 2. Fill in `meta`. That's all the registration needed: the feed
 *    auto-discovers every *.game.tsx file in this folder and lazy-loads
 *    it when its card scrolls into view.
 * 3. Scale your difficulty from `level`, and call `finish(won, score)`
 *    when a run ends — the score adds to the player's global total and a
 *    win bumps this game's level.
 * 4. Cancel a live run when `active` goes false (the user scrolled away).
 */
import { useEffect, useState } from "react";
import { GameChrome } from "../components/game/GameChrome";
import type { GameMeta, GameProps } from "./kit";
import { sfx, useRun } from "./kit";

export const meta: GameMeta = {
	title: "My Game",
	emoji: "🕹️",
	desc: "One-line description shown on the card.",
	order: 99,
	accent: "#7c5cff",
	instructions: "Tap the target 10 times. Replace this with your game.",
};

export default function MyGame({
	level,
	active,
	onEnd,
	onPlayingChange,
}: GameProps) {
	const { playing, result, begin, finish, cancel } = useRun(onEnd);
	const [taps, setTaps] = useState(0);
	const goal = 10 + level * 2; // scale difficulty from the level

	// cancel a live run when the card scrolls away
	useEffect(() => {
		if (!active && playing) cancel();
	}, [active, playing, cancel]);

	const start = () => {
		setTaps(0);
		begin();
	};

	const tap = () => {
		if (!playing) return;
		const next = taps + 1;
		sfx.good();
		setTaps(next);
		if (next >= goal) finish(true, next * 5); // adds to the global total
	};

	return (
		<GameChrome
			emoji={meta.emoji}
			title={meta.title}
			accent={meta.accent}
			level={level}
			instructions={meta.instructions}
			playing={playing}
			result={result}
			chips={[`${taps}/${goal}`, `${taps * 5} PTS`]}
			onPlay={start}
			onPlayingChange={onPlayingChange}
		>
			<div className="flex h-full w-full items-center justify-center">
				<button
					type="button"
					onPointerDown={tap}
					className="cursor-pointer text-8xl transition-transform active:scale-90"
				>
					🎯
				</button>
			</div>
		</GameChrome>
	);
}
