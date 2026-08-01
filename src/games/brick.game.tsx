import { useEffect, useRef, useState } from "react";
import { GameChrome } from "../components/game/GameChrome";
import type { GameMeta, GameProps } from "./kit";
import { sfx, useRun, useThemeColor } from "./kit";

export const meta: GameMeta = {
	title: "Brick Break",
	emoji: "🧱",
	desc: "One ball, one life. Clear the wall.",
	order: 29,
	accent: "#ff4d6d",
	instructions:
		"Drag to move the paddle. Clear every brick — you only get one ball.",
};

const COLS = 7;

export default function BrickBreak({
	level,
	active,
	onEnd,
	onPlayingChange,
}: GameProps) {
	const { playing, result, begin, finish, cancel } = useRun(onEnd);
	const ink = useThemeColor("text");
	const rows = 3 + Math.min(level, 4);
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const [left, setLeft] = useState(0);
	const run = useRef({
		px: 0.5,
		bx: 0,
		by: 0,
		vx: 0,
		vy: 0,
		bricks: [] as Array<{ x: number; y: number; alive: boolean }>,
		destroyed: 0,
	});

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
		const BW = (W - 40 - (COLS - 1) * 6) / COLS;
		const BH = 22;
		const PADDLE_W = Math.max(110 - level * 4, 70);
		const speed = 300 + level * 22;

		const r = run.current;
		r.px = 0.5;
		r.bx = W / 2;
		r.by = H * 0.6;
		const angle = -Math.PI / 3 + Math.random() * (Math.PI / 6);
		r.vx = Math.cos(angle) * speed;
		r.vy = Math.sin(angle) * speed - speed * 0.4;
		if (Math.abs(r.vy) < speed * 0.5) r.vy = -speed * 0.7;
		r.bricks = [];
		for (let row = 0; row < rows; row++) {
			for (let col = 0; col < COLS; col++) {
				r.bricks.push({
					x: 20 + col * (BW + 6),
					y: 90 + row * (BH + 6),
					alive: true,
				});
			}
		}
		r.destroyed = 0;
		setLeft(rows * COLS);

		let raf = 0;
		let last = performance.now();
		const loop = (now: number) => {
			const dt = Math.min((now - last) / 1000, 0.03);
			last = now;

			r.bx += r.vx * dt;
			r.by += r.vy * dt;
			if (r.bx < 8) {
				r.bx = 8;
				r.vx = Math.abs(r.vx);
			}
			if (r.bx > W - 8) {
				r.bx = W - 8;
				r.vx = -Math.abs(r.vx);
			}
			if (r.by < 8) {
				r.by = 8;
				r.vy = Math.abs(r.vy);
			}

			// paddle
			const padX = r.px * W;
			const padY = H - 60;
			if (
				r.vy > 0 &&
				r.by > padY - 10 &&
				r.by < padY + 10 &&
				Math.abs(r.bx - padX) < PADDLE_W / 2 + 8
			) {
				r.vy = -Math.abs(r.vy);
				const off = (r.bx - padX) / (PADDLE_W / 2);
				r.vx = off * speed * 0.9;
			}
			if (r.by > H + 20) {
				finish(false, r.destroyed * 6, "Ball lost");
				return;
			}

			// bricks
			for (const b of r.bricks) {
				if (!b.alive) continue;
				if (
					r.bx > b.x - 8 &&
					r.bx < b.x + BW + 8 &&
					r.by > b.y - 8 &&
					r.by < b.y + BH + 8
				) {
					b.alive = false;
					sfx.hit();
					r.destroyed += 1;
					setLeft(rows * COLS - r.destroyed);
					r.vy = -r.vy;
					if (r.destroyed >= rows * COLS) {
						finish(true, r.destroyed * 6 + 30);
						return;
					}
					break;
				}
			}

			// draw
			ctx.clearRect(0, 0, W, H);
			const palette = [
				"#ff4d6d",
				"#ff8a1e",
				"#ffd24d",
				"#3dffa0",
				"#00e5ff",
				"#7c5cff",
				"#b06bff",
			];
			r.bricks.forEach((b, i) => {
				if (!b.alive) return;
				ctx.fillStyle = palette[Math.floor(i / COLS) % palette.length];
				ctx.beginPath();
				ctx.roundRect(b.x, b.y, BW, BH, 5);
				ctx.fill();
			});
			ctx.fillStyle = ink.current;
			ctx.beginPath();
			ctx.roundRect(padX - PADDLE_W / 2, padY, PADDLE_W, 12, 6);
			ctx.fill();
			ctx.save();
			ctx.shadowColor = "#00e5ff";
			ctx.shadowBlur = 16;
			ctx.fillStyle = ink.current;
			ctx.beginPath();
			ctx.arc(r.bx, r.by, 8, 0, 7);
			ctx.fill();
			ctx.restore();

			raf = requestAnimationFrame(loop);
		};
		raf = requestAnimationFrame(loop);
		return () => cancelAnimationFrame(raf);
	}, [playing, level, rows, finish]);

	const move = (clientX: number) => {
		const cv = canvasRef.current;
		if (!cv || !playing) return;
		const rect = cv.getBoundingClientRect();
		run.current.px = Math.min(
			Math.max((clientX - rect.left) / rect.width, 0.08),
			0.92,
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
			chips={[`🧱 ${left} LEFT`]}
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
