import { useCallback, useEffect, useRef, useState } from "react";
import { GameChrome } from "../components/game/GameChrome";
import type { GameMeta, GameProps } from "./kit";
import { sfx, useGameKeys, useRun, useThemeColor } from "./kit";

export const meta: GameMeta = {
	title: "Glow Flap",
	emoji: "🚀",
	desc: "Tap to thrust. Thread the gates.",
	order: 4,
	accent: "#00b8d9",
	instructions:
		"Tap (or space) to thrust upward. Thread every gate — the gaps get meaner each level.",
};

type Gate = { x: number; cy: number; passed: boolean };

export default function GlowFlap({
	level,
	active,
	onEnd,
	onPlayingChange,
}: GameProps) {
	const { playing, result, begin, finish, cancel } = useRun(onEnd);
	const ink = useThemeColor("text");
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const [passed, setPassed] = useState(0);
	const goal = 5 + level;
	const gap = Math.max(215 - level * 9, 125);
	const speed = 2.3 + level * 0.12;

	const run = useRef({
		y: 0,
		vel: 0,
		gates: [] as Array<Gate>,
		passed: 0,
		trail: [] as Array<{ x: number; y: number }>,
	});

	const size = useCallback(() => {
		const cv = canvasRef.current;
		if (!cv) return { w: 0, h: 0 };
		const dpr = Math.min(window.devicePixelRatio || 1, 2);
		if (cv.width !== cv.clientWidth * dpr) {
			cv.width = cv.clientWidth * dpr;
			cv.height = cv.clientHeight * dpr;
			cv.getContext("2d")?.setTransform(dpr, 0, 0, dpr, 0, 0);
		}
		return { w: cv.clientWidth, h: cv.clientHeight };
	}, []);

	const start = () => {
		const { w, h } = size();
		const r = run.current;
		r.y = h * 0.45;
		r.vel = 0;
		r.passed = 0;
		r.trail = [];
		r.gates = [];
		const m = 90;
		for (let i = 0; i < goal; i++) {
			r.gates.push({
				x: w + 120 + i * Math.max(240, w * 0.45),
				cy: m + gap / 2 + Math.random() * Math.max(h - 2 * m - gap, 40),
				passed: false,
			});
		}
		setPassed(0);
		begin();
	};

	const flap = () => {
		if (!playing) return;
		sfx.flap();
		run.current.vel = -7.4;
	};

	// physics + render loop
	useEffect(() => {
		if (!playing) return;
		let raf = 0;
		const shipX = () => size().w * 0.28;
		const loop = () => {
			const cv = canvasRef.current;
			const ctx = cv?.getContext("2d");
			if (!cv || !ctx) return;
			const { w, h } = size();
			const r = run.current;
			const sx = shipX();

			r.vel += 0.42;
			r.y += r.vel;
			r.trail.unshift({ x: sx, y: r.y });
			if (r.trail.length > 14) r.trail.pop();
			for (const g of r.gates) g.x -= speed;

			const radius = 12;
			if (r.y < radius || r.y > h - radius) {
				finish(false, r.passed * 10, "Crashed");
				return;
			}
			for (const g of r.gates) {
				const hw = 30;
				if (!g.passed && g.x + hw < sx) {
					sfx.step();
					g.passed = true;
					r.passed += 1;
					setPassed(r.passed);
					if (r.passed >= goal) {
						finish(true, r.passed * 10 + 25);
						return;
					}
				}
				if (
					Math.abs(g.x - sx) < hw + radius &&
					Math.abs(r.y - g.cy) > gap / 2 - radius
				) {
					finish(false, r.passed * 10, "Crashed");
					return;
				}
			}

			// draw
			ctx.clearRect(0, 0, w, h);
			for (const g of r.gates) {
				if (g.x < -80 || g.x > w + 120) continue;
				ctx.save();
				ctx.shadowColor = "#7c5cff";
				ctx.shadowBlur = g.passed ? 0 : 14;
				ctx.fillStyle = g.passed ? "rgba(61,255,160,.25)" : "#6c4fe8";
				ctx.beginPath();
				ctx.roundRect(g.x - 30, -8, 60, g.cy - gap / 2 + 8, 10);
				ctx.fill();
				ctx.beginPath();
				ctx.roundRect(
					g.x - 30,
					g.cy + gap / 2,
					60,
					h - (g.cy + gap / 2) + 8,
					10,
				);
				ctx.fill();
				ctx.restore();
			}
			r.trail.forEach((t, i) => {
				ctx.fillStyle = `rgba(0,229,255,${0.35 * (1 - i / 14)})`;
				ctx.beginPath();
				ctx.arc(t.x - i * 2, t.y, Math.max(10 * (1 - i / 16), 1), 0, 7);
				ctx.fill();
			});
			ctx.save();
			ctx.shadowColor = "#00e5ff";
			ctx.shadowBlur = 22;
			ctx.fillStyle = ink();
			ctx.beginPath();
			ctx.arc(sx, r.y, 11, 0, 7);
			ctx.fill();
			ctx.restore();

			raf = requestAnimationFrame(loop);
		};
		raf = requestAnimationFrame(loop);
		return () => cancelAnimationFrame(raf);
	}, [playing, gap, speed, goal, finish, size, ink]);

	// cancel when scrolled away
	useEffect(() => {
		if (!active && playing) cancel();
	}, [active, playing, cancel]);

	useGameKeys(playing, { Space: flap, ArrowUp: flap });

	return (
		<GameChrome
			emoji={meta.emoji}
			title={meta.title}
			accent={meta.accent}
			level={level}
			instructions={meta.instructions}
			playing={playing}
			result={result}
			chips={[`🚪 ${passed}/${goal}`, `${passed * 10} PTS`]}
			onQuit={cancel}
			onPlay={start}
			onPlayingChange={onPlayingChange}
		>
			<button
				type="button"
				aria-label="Thrust"
				onPointerDown={flap}
				className="block h-full w-full cursor-pointer touch-none border-0 bg-transparent p-0"
			>
				<canvas ref={canvasRef} className="h-full w-full" />
			</button>
		</GameChrome>
	);
}
