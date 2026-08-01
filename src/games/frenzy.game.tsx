import { useEffect, useRef, useState } from "react";
import { GameChrome } from "../components/game/GameChrome";
import type { GameMeta, GameProps } from "./kit";
import { sfx, useCountdown, useRun } from "./kit";

export const meta: GameMeta = {
	title: "Tap Frenzy",
	emoji: "👆",
	desc: "Five seconds. Tap like your score depends on it.",
	order: 9,
	accent: "#ff4d6d",
	instructions:
		"Hit the tap quota before the 5 seconds run out. The quota grows every level.",
};

const DURATION = 5;

export default function TapFrenzy({
	level,
	active,
	onEnd,
	onPlayingChange,
}: GameProps) {
	const { playing, result, begin, finish, cancel } = useRun(onEnd);
	const goal = 25 + level * 4;
	const timeLeft = useCountdown(playing, DURATION);
	const [taps, setTaps] = useState(0);
	const tapsRef = useRef(0);

	useEffect(() => {
		if (playing && timeLeft <= 0)
			finish(false, tapsRef.current * 3, "Too slow");
	}, [playing, timeLeft, finish]);
	useEffect(() => {
		if (!active && playing) cancel();
	}, [active, playing, cancel]);

	const start = () => {
		tapsRef.current = 0;
		setTaps(0);
		begin();
	};

	const tap = () => {
		if (!playing) return;
		sfx.step();
		tapsRef.current += 1;
		setTaps(tapsRef.current);
		if (tapsRef.current >= goal) {
			finish(true, goal * 3 + Math.ceil(timeLeft * 5) + 30);
		}
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
			chips={[`${taps}/${goal}`, `${timeLeft.toFixed(1)}s`]}
			progress={timeLeft / DURATION}
			onPlay={start}
			onQuit={cancel}
			onPlayingChange={onPlayingChange}
		>
			<div className="flex h-full w-full items-center justify-center">
				<button
					type="button"
					onPointerDown={tap}
					className="flex h-[min(70vw,320px)] w-[min(70vw,320px)] items-center justify-center rounded-full border-2 border-danger bg-danger/15 text-6xl font-black text-danger shadow-[0_0_80px_rgba(255,77,109,0.35)]"
				>
					{playing ? taps : "TAP"}
				</button>
			</div>
		</GameChrome>
	);
}
