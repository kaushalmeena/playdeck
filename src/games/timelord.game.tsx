import { useEffect, useRef, useState } from "react";
import { GameChrome } from "../components/game/GameChrome";
import type { GameMeta, GameProps } from "./kit";
import { useRun } from "./kit";

export const meta: GameMeta = {
	title: "Stop Watch",
	emoji: "⏱️",
	desc: "Stop at exactly 3.00s — blind for the last stretch.",
	order: 26,
	accent: "#00b8d9",
	instructions:
		"The stopwatch hides after 1.5 seconds. Stop it as close to 3.00s as you can — tolerance shrinks each level.",
};

const TARGET = 3;
const ROUNDS = 3;

export default function StopWatch({
	level,
	active,
	onEnd,
	onPlayingChange,
}: GameProps) {
	const { playing, result, begin, finish, cancel } = useRun(onEnd);
	const tolerance = Math.max(0.45 - level * 0.025, 0.1);

	const [display, setDisplay] = useState("0.00");
	const [roundNo, setRoundNo] = useState(1);
	const [score, setScore] = useState(0);
	const run = useRef({ startedAt: 0, round: 1, score: 0 });

	useEffect(() => {
		if (!active && playing) cancel();
	}, [active, playing, cancel]);

	// tick the visible display (hidden past 1.5s)
	useEffect(() => {
		if (!playing) return;
		run.current.startedAt = performance.now();
		let raf = 0;
		const loop = () => {
			const t = (performance.now() - run.current.startedAt) / 1000;
			setDisplay(t <= 1.5 ? t.toFixed(2) : "?.??");
			raf = requestAnimationFrame(loop);
		};
		raf = requestAnimationFrame(loop);
		return () => cancelAnimationFrame(raf);
	}, [playing]);

	const start = () => {
		run.current = { startedAt: performance.now(), round: 1, score: 0 };
		setRoundNo(1);
		setScore(0);
		begin();
	};

	const stop = () => {
		if (!playing) return;
		const r = run.current;
		const t = (performance.now() - r.startedAt) / 1000;
		const err = Math.abs(t - TARGET);
		if (err > tolerance) {
			finish(false, r.score, `${t.toFixed(2)}s — off by ${err.toFixed(2)}`);
			return;
		}
		r.score += Math.round(5 + ((tolerance - err) / tolerance) * 25);
		setScore(r.score);
		if (r.round >= ROUNDS) {
			finish(true, r.score + 10);
			return;
		}
		r.round += 1;
		r.startedAt = performance.now();
		setRoundNo(r.round);
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
			chips={[`ROUND ${roundNo}/${ROUNDS}`, `${score} PTS`]}
			onPlay={start}
			onQuit={cancel}
			onPlayingChange={onPlayingChange}
		>
			<button
				type="button"
				aria-label="Stop the timer"
				onPointerDown={stop}
				className="flex h-full w-full flex-col items-center justify-center gap-8 border-0 bg-transparent"
			>
				<div className="font-black text-7xl tabular-nums tracking-wider text-accent2">
					{playing ? display : "3.00"}
				</div>
				<div className="text-sm font-bold tracking-[0.3em] text-muted">
					STOP AT {TARGET.toFixed(2)}s · ±{tolerance.toFixed(2)}s
				</div>
			</button>
		</GameChrome>
	);
}
