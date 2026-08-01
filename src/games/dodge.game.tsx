import { useEffect, useRef } from "react";
import { GameChrome } from "../components/game/GameChrome";
import type { GameMeta, GameProps } from "./kit";
import { randInt, useCountdown, useRun } from "./kit";

export const meta: GameMeta = {
	title: "Dodge Rush",
	emoji: "🏃",
	desc: "Three lanes. Falling blocks. Survive.",
	order: 13,
	accent: "#00e5ff",
	instructions:
		"Tap the left or right half of the screen to switch lanes. Dodge the falling blocks for 15 seconds.",
};

const DURATION = 15;

export default function DodgeRush({
	level,
	active,
	onEnd,
	onPlayingChange,
}: GameProps) {
	const { playing, result, begin, finish, cancel } = useRun(onEnd);
	const timeLeft = useCountdown(playing, DURATION);
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const run = useRef({
		lane: 1,
		blocks: [] as Array<{ lane: number; y: number }>,
		sinceSpawn: 0,
	});

	useEffect(() => {
		if (playing && timeLeft <= 0) finish(true, DURATION * 8 + level * 10);
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
		const laneX = (l: number) => W * (0.25 + l * 0.25);
		const speed = (H / 2.4) * (1 + level * 0.08);
		const spawnEvery = Math.max(0.8 - level * 0.04, 0.35);

		run.current = { lane: 1, blocks: [], sinceSpawn: 0 };
		let raf = 0;
		let last = performance.now();
		const started = last;

		const loop = (now: number) => {
			const dt = Math.min((now - last) / 1000, 0.05);
			last = now;
			const r = run.current;

			r.sinceSpawn += dt;
			if (r.sinceSpawn >= spawnEvery) {
				r.sinceSpawn = 0;
				r.blocks.push({ lane: randInt(0, 2), y: -40 });
			}
			for (const b of r.blocks) b.y += speed * dt;
			r.blocks = r.blocks.filter((b) => b.y < H + 60);

			// collision with the player zone
			const py = H - 90;
			for (const b of r.blocks) {
				if (b.lane === r.lane && b.y > py - 44 && b.y < py + 26) {
					const survived = (now - started) / 1000;
					finish(false, Math.floor(survived) * 8, "Squashed");
					return;
				}
			}

			// draw
			ctx.clearRect(0, 0, W, H);
			ctx.strokeStyle = "rgba(124,92,255,0.25)";
			ctx.lineWidth = 2;
			for (const l of [0.375, 0.625]) {
				ctx.beginPath();
				ctx.moveTo(W * l, 0);
				ctx.lineTo(W * l, H);
				ctx.stroke();
			}
			ctx.fillStyle = "#ff4d6d";
			for (const b of r.blocks) {
				ctx.beginPath();
				ctx.roundRect(laneX(b.lane) - 22, b.y - 22, 44, 44, 8);
				ctx.fill();
			}
			ctx.save();
			ctx.shadowColor = "#00e5ff";
			ctx.shadowBlur = 20;
			ctx.fillStyle = "#eaffff";
			ctx.beginPath();
			ctx.arc(laneX(r.lane), py, 16, 0, 7);
			ctx.fill();
			ctx.restore();

			raf = requestAnimationFrame(loop);
		};
		raf = requestAnimationFrame(loop);
		return () => cancelAnimationFrame(raf);
	}, [playing, level, finish]);

	const steer = (dir: number) => {
		if (!playing) return;
		run.current.lane = Math.min(Math.max(run.current.lane + dir, 0), 2);
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
			chips={[`${Math.ceil(timeLeft)}s LEFT`]}
			progress={timeLeft / DURATION}
			onPlay={begin}
			onQuit={cancel}
			onPlayingChange={onPlayingChange}
		>
			<div
				className="h-full w-full touch-none"
				onPointerDown={(e) => {
					const mid = (e.currentTarget as HTMLElement).clientWidth / 2;
					steer(e.nativeEvent.offsetX < mid ? -1 : 1);
				}}
			>
				<canvas ref={canvasRef} className="h-full w-full" />
			</div>
		</GameChrome>
	);
}
