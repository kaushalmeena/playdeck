import { useCallback, useEffect, useRef, useState } from "react";
import { GameChrome } from "../components/GameChrome";
import type { GameMeta, GameProps } from "./kit";
import { useRun } from "./kit";

export const meta: GameMeta = {
	title: "Neon Snake",
	emoji: "🐍",
	desc: "Swipe to steer. Eat the orbs, don't eat yourself.",
	order: 2,
	accent: "#12b76a",
	instructions:
		"Swipe (or arrow keys) to steer. Eat the glowing orbs to clear the level — walls and your own tail are fatal.",
};

type Vec = { x: number; y: number };

export default function NeonSnake({
	level,
	active,
	onEnd,
	onPlayingChange,
}: GameProps) {
	const { playing, result, begin, finish, cancel } = useRun(onEnd);
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const [eaten, setEaten] = useState(0);
	const goal = 4 + level;

	const run = useRef({
		snake: [] as Array<Vec>,
		dir: { x: 1, y: 0 } as Vec,
		queued: null as Vec | null,
		food: { x: 8, y: 8 } as Vec,
		eaten: 0,
		cols: 15,
		rows: 15,
		cell: 20,
		ox: 0,
		oy: 0,
	});
	const touch = useRef<Vec | null>(null);

	const layout = useCallback(() => {
		const cv = canvasRef.current;
		if (!cv) return;
		const w = cv.clientWidth;
		const h = cv.clientHeight;
		const dpr = Math.min(window.devicePixelRatio || 1, 2);
		cv.width = w * dpr;
		cv.height = h * dpr;
		cv.getContext("2d")?.setTransform(dpr, 0, 0, dpr, 0, 0);
		const r = run.current;
		r.cell = Math.floor(Math.min(w, h) / 17);
		r.cols = Math.floor((w - 8) / r.cell);
		r.rows = Math.floor((h - 150) / r.cell);
		r.ox = Math.floor((w - r.cols * r.cell) / 2);
		r.oy = Math.floor((h - r.rows * r.cell) / 2) + 24;
	}, []);

	const draw = useCallback(() => {
		const cv = canvasRef.current;
		const ctx = cv?.getContext("2d");
		if (!cv || !ctx) return;
		const r = run.current;
		ctx.clearRect(0, 0, cv.clientWidth, cv.clientHeight);
		// board — a touch darker than the stage in both themes
		const light = document.documentElement.classList.contains("light");
		ctx.fillStyle = light ? "rgba(25,25,50,.08)" : "rgba(24,24,38,.5)";
		ctx.beginPath();
		ctx.roundRect(
			r.ox - 4,
			r.oy - 4,
			r.cols * r.cell + 8,
			r.rows * r.cell + 8,
			12,
		);
		ctx.fill();
		// food
		ctx.save();
		ctx.shadowColor = "#3dffa0";
		ctx.shadowBlur = 18;
		ctx.fillStyle = "#3dffa0";
		ctx.beginPath();
		ctx.arc(
			r.ox + r.food.x * r.cell + r.cell / 2,
			r.oy + r.food.y * r.cell + r.cell / 2,
			r.cell * 0.32,
			0,
			7,
		);
		ctx.fill();
		ctx.restore();
		// snake
		r.snake.forEach((s, i) => {
			const t = i / r.snake.length;
			ctx.fillStyle =
				i === 0
					? "#eaffe9"
					: `rgba(${(18 + 40 * t) | 0},183,${(106 + 80 * (1 - t)) | 0},${1 - t * 0.5})`;
			ctx.beginPath();
			ctx.roundRect(
				r.ox + s.x * r.cell + 1.5,
				r.oy + s.y * r.cell + 1.5,
				r.cell - 3,
				r.cell - 3,
				i === 0 ? 7 : 5,
			);
			ctx.fill();
		});
	}, []);

	const placeFood = useCallback(() => {
		const r = run.current;
		do {
			r.food = {
				x: (Math.random() * r.cols) | 0,
				y: (Math.random() * r.rows) | 0,
			};
		} while (r.snake.some((s) => s.x === r.food.x && s.y === r.food.y));
	}, []);

	const start = () => {
		layout();
		const r = run.current;
		const cy = (r.rows / 2) | 0;
		r.snake = [
			{ x: 5, y: cy },
			{ x: 4, y: cy },
			{ x: 3, y: cy },
		];
		r.dir = { x: 1, y: 0 };
		r.queued = null;
		r.eaten = 0;
		setEaten(0);
		placeFood();
		begin();
	};

	// the game loop lives in an effect so pausing = clearing the interval
	useEffect(() => {
		if (!playing) return;
		draw();
		const tick = setInterval(
			() => {
				const r = run.current;
				if (r.queued) {
					r.dir = r.queued;
					r.queued = null;
				}
				const head = { x: r.snake[0].x + r.dir.x, y: r.snake[0].y + r.dir.y };
				if (
					head.x < 0 ||
					head.y < 0 ||
					head.x >= r.cols ||
					head.y >= r.rows ||
					r.snake.some((s) => s.x === head.x && s.y === head.y)
				) {
					finish(false, r.eaten * 10, "Crashed");
					return;
				}
				r.snake.unshift(head);
				if (head.x === r.food.x && head.y === r.food.y) {
					r.eaten += 1;
					setEaten(r.eaten);
					if (r.eaten >= goal) {
						finish(true, r.eaten * 10 + level * 5);
						return;
					}
					placeFood();
				} else {
					r.snake.pop();
				}
				draw();
			},
			Math.max(160 - level * 8, 60),
		);
		return () => clearInterval(tick);
	}, [playing, level, goal, finish, draw, placeFood]);

	// cancel when scrolled away
	useEffect(() => {
		if (!active && playing) cancel();
	}, [active, playing, cancel]);

	// keep canvas sized to the card
	useEffect(() => {
		layout();
		window.addEventListener("resize", layout);
		return () => window.removeEventListener("resize", layout);
	}, [layout]);

	const turn = useCallback((nx: number, ny: number) => {
		const r = run.current;
		if (nx === -r.dir.x && ny === -r.dir.y) return; // no reversing
		r.queued = { x: nx, y: ny };
	}, []);

	useEffect(() => {
		if (!playing) return;
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "ArrowUp" || e.key === "w") turn(0, -1);
			else if (e.key === "ArrowDown" || e.key === "s") turn(0, 1);
			else if (e.key === "ArrowLeft" || e.key === "a") turn(-1, 0);
			else if (e.key === "ArrowRight" || e.key === "d") turn(1, 0);
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [playing, turn]);

	return (
		<GameChrome
			emoji={meta.emoji}
			title={meta.title}
			accent={meta.accent}
			level={level}
			instructions={meta.instructions}
			playing={playing}
			result={result}
			chips={[`🍏 ${eaten}/${goal}`, `${eaten * 10} PTS`]}
			onQuit={cancel}
			onPlay={start}
			onPlayingChange={onPlayingChange}
		>
			<canvas
				ref={canvasRef}
				className="h-full w-full touch-none"
				onTouchStart={(e) => {
					touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
				}}
				onTouchEnd={(e) => {
					if (!touch.current || !playing) return;
					const dx = e.changedTouches[0].clientX - touch.current.x;
					const dy = e.changedTouches[0].clientY - touch.current.y;
					touch.current = null;
					if (Math.abs(dx) < 18 && Math.abs(dy) < 18) return;
					if (Math.abs(dx) > Math.abs(dy)) turn(Math.sign(dx), 0);
					else turn(0, Math.sign(dy));
				}}
			/>
		</GameChrome>
	);
}
