import { useEffect, useRef, useState } from "react";
import { GameChrome } from "../components/game/GameChrome";
import type { GameMeta, GameProps } from "./kit";
import { sfx, useRun } from "./kit";

export const meta: GameMeta = {
	title: "Sky Stack",
	emoji: "🏗️",
	desc: "Drop the block. Keep what overlaps. Reach the top.",
	order: 19,
	accent: "#12b76a",
	instructions:
		"A block slides back and forth — tap to drop it on the stack. Only the overlap survives. Stack to the goal height.",
};

const BLOCK_H = 26;

export default function SkyStack({
	level,
	active,
	onEnd,
	onPlayingChange,
}: GameProps) {
	const { playing, result, begin, finish, cancel } = useRun(onEnd);
	const goal = 6 + Math.min(level, 8);
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const [layers, setLayers] = useState(0);
	const run = useRef({
		stack: [] as Array<{ x: number; w: number }>,
		curX: 0,
		curW: 0,
		dir: 1,
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
		const speed = 160 + level * 25;

		const r = run.current;
		r.stack = [{ x: W / 2 - W * 0.25, w: W * 0.5 }];
		r.curW = W * 0.5;
		r.curX = 0;
		r.dir = 1;
		setLayers(0);

		let raf = 0;
		let last = performance.now();
		const loop = (now: number) => {
			const dt = Math.min((now - last) / 1000, 0.05);
			last = now;
			r.curX += r.dir * speed * dt;
			if (r.curX + r.curW > W) {
				r.curX = W - r.curW;
				r.dir = -1;
			} else if (r.curX < 0) {
				r.curX = 0;
				r.dir = 1;
			}

			// draw
			ctx.clearRect(0, 0, W, H);
			const baseY = H - 80;
			const offset = Math.max(0, (r.stack.length + 1) * BLOCK_H - H * 0.55);
			r.stack.forEach((b, i) => {
				const y = baseY - i * BLOCK_H + offset;
				if (y < -BLOCK_H || y > H) return;
				ctx.fillStyle = i % 2 ? "#12b76a" : "#0fa05c";
				ctx.beginPath();
				ctx.roundRect(b.x, y, b.w, BLOCK_H - 3, 6);
				ctx.fill();
			});
			const curY = baseY - r.stack.length * BLOCK_H + offset;
			ctx.save();
			ctx.shadowColor = "#3dffa0";
			ctx.shadowBlur = 16;
			ctx.fillStyle = "#3dffa0";
			ctx.beginPath();
			ctx.roundRect(r.curX, curY, r.curW, BLOCK_H - 3, 6);
			ctx.fill();
			ctx.restore();

			raf = requestAnimationFrame(loop);
		};
		raf = requestAnimationFrame(loop);
		return () => cancelAnimationFrame(raf);
	}, [playing, level]);

	const drop = () => {
		if (!playing) return;
		const r = run.current;
		const top = r.stack[r.stack.length - 1];
		const left = Math.max(r.curX, top.x);
		const right = Math.min(r.curX + r.curW, top.x + top.w);
		const overlap = right - left;
		if (overlap <= 8) {
			finish(false, (r.stack.length - 1) * 12, "Missed the stack");
			return;
		}
		sfx.hit();
		r.stack.push({ x: left, w: overlap });
		r.curW = overlap;
		const built = r.stack.length - 1;
		setLayers(built);
		if (built >= goal) {
			finish(true, goal * 12 + Math.round(overlap / 4) + 15);
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
			chips={[`🏗️ ${layers}/${goal}`]}
			onPlay={begin}
			onQuit={cancel}
			onPlayingChange={onPlayingChange}
		>
			<button
				type="button"
				aria-label="Drop block"
				onPointerDown={drop}
				className="block h-full w-full touch-none border-0 bg-transparent p-0"
			>
				<canvas ref={canvasRef} className="h-full w-full" />
			</button>
		</GameChrome>
	);
}
