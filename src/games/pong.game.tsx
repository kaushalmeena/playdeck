import { useEffect, useRef, useState } from "react";
import { GameChrome } from "../components/game/GameChrome";
import type { GameMeta, GameProps } from "./kit";
import { sfx, useRun, useThemeColor } from "./kit";

export const meta: GameMeta = {
	title: "Keep Up",
	emoji: "🏓",
	desc: "Don't let the ball drop. It keeps getting faster.",
	order: 30,
	accent: "#4d9fff",
	instructions:
		"Drag to move the paddle and keep the ball in the air. Every bounce counts — and speeds it up.",
};

export default function KeepUp({
	level,
	active,
	onEnd,
	onPlayingChange,
}: GameProps) {
	const { playing, result, begin, finish, cancel } = useRun(onEnd);
	const ink = useThemeColor("text");
	const goal = 10 + level * 3;
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const [bounces, setBounces] = useState(0);
	const run = useRef({ px: 0.5, bx: 0, by: 0, vx: 0, vy: 0, bounces: 0 });

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
		const PADDLE_W = 96;
		const speed = 260 + level * 15;

		const r = run.current;
		r.px = 0.5;
		r.bx = W / 2;
		r.by = H * 0.35;
		r.vx = speed * 0.5;
		r.vy = speed * 0.6;
		r.bounces = 0;
		setBounces(0);

		let raf = 0;
		let last = performance.now();
		const loop = (now: number) => {
			const dt = Math.min((now - last) / 1000, 0.03);
			last = now;

			r.bx += r.vx * dt;
			r.by += r.vy * dt;
			if (r.bx < 10) {
				r.bx = 10;
				r.vx = Math.abs(r.vx);
			}
			if (r.bx > W - 10) {
				r.bx = W - 10;
				r.vx = -Math.abs(r.vx);
			}
			if (r.by < 10) {
				r.by = 10;
				r.vy = Math.abs(r.vy);
			}

			const padX = r.px * W;
			const padY = H - 70;
			if (
				r.vy > 0 &&
				r.by > padY - 12 &&
				r.by < padY + 10 &&
				Math.abs(r.bx - padX) < PADDLE_W / 2 + 9
			) {
				r.vy = -Math.abs(r.vy) * 1.035;
				const off = (r.bx - padX) / (PADDLE_W / 2);
				r.vx = off * Math.abs(r.vy) * 0.85;
				sfx.bounce();
				r.bounces += 1;
				setBounces(r.bounces);
				if (r.bounces >= goal) {
					finish(true, goal * 8 + 20);
					return;
				}
			}
			if (r.by > H + 20) {
				finish(false, r.bounces * 8, "Dropped it");
				return;
			}

			// draw
			ctx.clearRect(0, 0, W, H);
			ctx.fillStyle = ink();
			ctx.beginPath();
			ctx.roundRect(padX - PADDLE_W / 2, padY, PADDLE_W, 13, 7);
			ctx.fill();
			ctx.save();
			ctx.shadowColor = "#4d9fff";
			ctx.shadowBlur = 18;
			ctx.fillStyle = ink();
			ctx.beginPath();
			ctx.arc(r.bx, r.by, 10, 0, 7);
			ctx.fill();
			ctx.restore();

			raf = requestAnimationFrame(loop);
		};
		raf = requestAnimationFrame(loop);
		return () => cancelAnimationFrame(raf);
	}, [playing, level, goal, finish, ink]);

	const move = (clientX: number) => {
		const cv = canvasRef.current;
		if (!cv || !playing) return;
		const rect = cv.getBoundingClientRect();
		run.current.px = Math.min(
			Math.max((clientX - rect.left) / rect.width, 0.06),
			0.94,
		);
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
			chips={[`🏓 ${bounces}/${goal}`]}
			onPlay={begin}
			onQuit={cancel}
			onPlayingChange={onPlayingChange}
		>
			<div
				className="h-full w-full touch-none"
				onPointerDown={(e) => move(e.clientX)}
				onPointerMove={(e) => move(e.clientX)}
			>
				<canvas ref={canvasRef} className="h-full w-full" />
			</div>
		</GameChrome>
	);
}
