import { useEffect, useRef, useState } from "react";
import { GameChrome } from "../components/GameChrome";
import type { GameMeta, GameProps } from "./kit";
import { randInt, useRun } from "./kit";

export const meta: GameMeta = {
	title: "Perfect Stop",
	emoji: "🛑",
	desc: "Stop the slider inside the zone. It only gets faster.",
	order: 12,
	accent: "#3dffa0",
	instructions:
		"The cursor sweeps back and forth — tap to stop it inside the glowing zone. Miss once and it's over.",
};

export default function PerfectStop({
	level,
	active,
	onEnd,
	onPlayingChange,
}: GameProps) {
	const { playing, result, begin, finish, cancel } = useRun(onEnd);
	const rounds = 3 + Math.min(level, 5);
	const zoneW = Math.max(24 - level * 1.5, 8);

	const [round, setRound] = useState(1);
	const [zone, setZone] = useState(50);
	const [score, setScore] = useState(0);
	const run = useRef({ pos: 0, dir: 1, round: 1, score: 0, zone: 50 });
	const cursorRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!active && playing) cancel();
	}, [active, playing, cancel]);

	// sweep the cursor with rAF, writing style directly (no re-renders)
	useEffect(() => {
		if (!playing) return;
		let raf = 0;
		let last = performance.now();
		const loop = (now: number) => {
			const dt = (now - last) / 1000;
			last = now;
			const r = run.current;
			const speed = (55 + level * 8) * (1 + (r.round - 1) * 0.15);
			r.pos += r.dir * speed * dt;
			if (r.pos >= 100) {
				r.pos = 100;
				r.dir = -1;
			} else if (r.pos <= 0) {
				r.pos = 0;
				r.dir = 1;
			}
			if (cursorRef.current) cursorRef.current.style.left = `${r.pos}%`;
			raf = requestAnimationFrame(loop);
		};
		raf = requestAnimationFrame(loop);
		return () => cancelAnimationFrame(raf);
	}, [playing, level]);

	const start = () => {
		run.current = { pos: 0, dir: 1, round: 1, score: 0, zone: randInt(18, 82) };
		setZone(run.current.zone);
		setRound(1);
		setScore(0);
		begin();
	};

	const stop = () => {
		if (!playing) return;
		const r = run.current;
		const err = Math.abs(r.pos - r.zone);
		if (err > zoneW / 2) {
			finish(false, r.score, "Missed the zone");
			return;
		}
		r.score += 15 + Math.round((1 - err / (zoneW / 2)) * 10);
		setScore(r.score);
		if (r.round >= rounds) {
			finish(true, r.score + 15);
			return;
		}
		r.round += 1;
		r.zone = randInt(18, 82);
		setRound(r.round);
		setZone(r.zone);
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
			chips={[`ROUND ${round}/${rounds}`, `${score} PTS`]}
			onPlay={start}
			onQuit={cancel}
			onPlayingChange={onPlayingChange}
		>
			<button
				type="button"
				aria-label="Stop the cursor"
				onPointerDown={stop}
				className="flex h-full w-full flex-col items-center justify-center gap-10 border-0 bg-transparent px-8"
			>
				<div className="relative h-5 w-full max-w-md rounded-full border border-line bg-card">
					{/* target zone */}
					<div
						className="absolute top-0 h-full rounded-full bg-good/30 shadow-[0_0_24px_rgba(61,255,160,0.5)]"
						style={{ left: `${zone - zoneW / 2}%`, width: `${zoneW}%` }}
					/>
					{/* cursor */}
					<div
						ref={cursorRef}
						className="absolute -top-2 h-9 w-1.5 -translate-x-1/2 rounded-full bg-accent2 shadow-[0_0_16px_rgba(0,229,255,0.8)]"
						style={{ left: "0%" }}
					/>
				</div>
				<div className="text-sm font-bold tracking-[0.3em] text-muted">
					TAP TO STOP
				</div>
			</button>
		</GameChrome>
	);
}
