import { useEffect, useRef } from "react";
import { GameChrome } from "../components/game/GameChrome";
import type { GameMeta, GameProps } from "./kit";
import { useCountdown, useRun } from "./kit";

export const meta: GameMeta = {
	title: "Orbit Dash",
	emoji: "🪐",
	desc: "Circle the ring. Tap to reverse. Dodge the red arcs.",
	order: 32,
	accent: "#b06bff",
	instructions:
		"Your comet orbits the ring — tap anywhere to reverse direction and dodge the red danger arcs. Survive 15 seconds.",
};

const DURATION = 15;

type Arc = { start: number; span: number };

export default function OrbitDash({
	level,
	active,
	onEnd,
	onPlayingChange,
}: GameProps) {
	const { playing, result, begin, finish, cancel } = useRun(onEnd);
	const timeLeft = useCountdown(playing, DURATION);
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const run = useRef({ angle: 0, dir: 1, arcs: [] as Array<Arc>, sinceArc: 0 });

	useEffect(() => {
		if (playing && timeLeft <= 0) finish(true, DURATION * 8 + level * 12);
	}, [playing, timeLeft, finish, level]);
	useEffect(() => {
		if (!active && playing) cancel();
	}, [active, playing, cancel]);

	useEffect(() => {
		if (!playing) return;
		const cv = canvasRef.current;
		const ctx = cv?.getContext("2d");
		if (!cv || !ctx) return;
		const dpr = Math.min(window.devicePixelRatio || 1, 2);
		cv.width = cv.clientWidth * dpr;
		cv.height = cv.clientHeight * dpr;
		ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
		const W = cv.clientWidth;
		const H = cv.clientHeight;
		const cx = W / 2;
		const cy = H / 2;
		const R = Math.min(W, H) * 0.32;
		const angSpeed = (1.6 + level * 0.12) * Math.PI; // rad/s
		const arcEvery = Math.max(1.6 - level * 0.08, 0.8);

		const r = run.current;
		r.angle = -Math.PI / 2;
		r.dir = 1;
		r.arcs = [];
		r.sinceArc = 0;
		const started = performance.now();

		let raf = 0;
		let last = started;
		const loop = (now: number) => {
			const dt = Math.min((now - last) / 1000, 0.04);
			last = now;

			r.angle += r.dir * angSpeed * dt;
			r.sinceArc += dt;
			if (r.sinceArc >= arcEvery && r.arcs.length < 3 + Math.min(level, 3)) {
				r.sinceArc = 0;
				// spawn away from the comet
				const start = r.angle + (Math.PI / 2) * (1 + Math.random() * 2) * r.dir;
				r.arcs.push({ start, span: 0.5 + Math.random() * 0.5 });
			}
			if (r.arcs.length > 3 + Math.min(level, 3)) r.arcs.shift();

			// collision
			const norm = (a: number) =>
				((a % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
			for (const arc of r.arcs) {
				const rel = norm(r.angle - arc.start);
				if (rel >= 0 && rel <= arc.span) {
					const survived = (now - started) / 1000;
					finish(false, Math.floor(survived) * 8, "Burned up");
					return;
				}
			}

			// draw
			ctx.clearRect(0, 0, W, H);
			ctx.strokeStyle = "rgba(124,92,255,0.35)";
			ctx.lineWidth = 4;
			ctx.beginPath();
			ctx.arc(cx, cy, R, 0, 7);
			ctx.stroke();
			ctx.strokeStyle = "#ff4d6d";
			ctx.lineWidth = 10;
			for (const arc of r.arcs) {
				ctx.beginPath();
				ctx.arc(cx, cy, R, arc.start, arc.start + arc.span);
				ctx.stroke();
			}
			ctx.save();
			ctx.shadowColor = "#b06bff";
			ctx.shadowBlur = 20;
			ctx.fillStyle = "#efe3ff";
			ctx.beginPath();
			ctx.arc(cx + Math.cos(r.angle) * R, cy + Math.sin(r.angle) * R, 11, 0, 7);
			ctx.fill();
			ctx.restore();

			raf = requestAnimationFrame(loop);
		};
		raf = requestAnimationFrame(loop);
		return () => cancelAnimationFrame(raf);
	}, [playing, level, finish]);

	return (
		<GameChrome
			emoji={meta.emoji}
			title={meta.title}
			accent={meta.accent}
			level={level}
			instructions={meta.instructions}
			playing={playing}
			result={result}
			chips={[`${Math.ceil(timeLeft)}s LEFT`]}
			progress={timeLeft / DURATION}
			onPlay={begin}
			onQuit={cancel}
			onPlayingChange={onPlayingChange}
		>
			<button
				type="button"
				aria-label="Reverse direction"
				onPointerDown={() => {
					if (playing) run.current.dir *= -1;
				}}
				className="block h-full w-full touch-none border-0 bg-transparent p-0"
			>
				<canvas ref={canvasRef} className="h-full w-full" />
			</button>
		</GameChrome>
	);
}
