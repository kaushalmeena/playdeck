import { useEffect, useRef, useState } from "react";
import { GameChrome } from "../components/game/GameChrome";
import type { GameMeta, GameProps } from "./kit";
import { randInt, useCountdown, useRun } from "./kit";

export const meta: GameMeta = {
	title: "Star Catch",
	emoji: "🧺",
	desc: "Catch the falling stars. Not the bombs.",
	order: 27,
	accent: "#ffb13d",
	instructions:
		"Drag to move the basket. Catch the star quota — miss three stars (or catch one bomb) and it's over.",
};

const DURATION = 25;

type Item = { x: number; y: number; bomb: boolean };

export default function StarCatch({
	level,
	active,
	onEnd,
	onPlayingChange,
}: GameProps) {
	const { playing, result, begin, finish, cancel } = useRun(onEnd);
	const goal = 10 + level * 2;
	const timeLeft = useCountdown(playing, DURATION);
	const canvasRef = useRef<HTMLCanvasElement>(null);

	const [caught, setCaught] = useState(0);
	const [missed, setMissed] = useState(0);
	const timeLeftRef = useRef(DURATION);
	timeLeftRef.current = timeLeft;
	const run = useRef({
		px: 0.5,
		items: [] as Array<Item>,
		sinceSpawn: 0,
		caught: 0,
		missed: 0,
	});

	useEffect(() => {
		if (playing && timeLeft <= 0)
			finish(false, run.current.caught * 10, "Time's up");
	}, [playing, timeLeft, finish]);
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
		const speed = (H / 3) * (1 + level * 0.07);
		const spawnEvery = Math.max(0.9 - level * 0.04, 0.4);
		const BASKET_W = 84;

		run.current = { px: 0.5, items: [], sinceSpawn: 0, caught: 0, missed: 0 };
		setCaught(0);
		setMissed(0);

		let raf = 0;
		let last = performance.now();
		const loop = (now: number) => {
			const dt = Math.min((now - last) / 1000, 0.05);
			last = now;
			const r = run.current;

			r.sinceSpawn += dt;
			if (r.sinceSpawn >= spawnEvery) {
				r.sinceSpawn = 0;
				r.items.push({
					x: randInt(30, W - 30),
					y: -30,
					bomb: level >= 3 && Math.random() < 0.2,
				});
			}
			const bx = r.px * W;
			const by = H - 70;
			const keep: Array<Item> = [];
			for (const it of r.items) {
				it.y += speed * dt;
				const inBasket =
					it.y > by - 26 &&
					it.y < by + 14 &&
					Math.abs(it.x - bx) < BASKET_W / 2;
				if (inBasket) {
					if (it.bomb) {
						finish(false, r.caught * 10, "Caught a bomb");
						return;
					}
					r.caught += 1;
					setCaught(r.caught);
					if (r.caught >= goal) {
						finish(true, goal * 10 + Math.ceil(timeLeftRef.current) * 2);
						return;
					}
					continue;
				}
				if (it.y > H + 30) {
					if (!it.bomb) {
						r.missed += 1;
						setMissed(r.missed);
						if (r.missed >= 3) {
							finish(false, r.caught * 10, "Too many misses");
							return;
						}
					}
					continue;
				}
				keep.push(it);
			}
			r.items = keep;

			// draw
			ctx.clearRect(0, 0, W, H);
			ctx.font = "26px system-ui";
			ctx.textAlign = "center";
			for (const it of r.items) ctx.fillText(it.bomb ? "💣" : "⭐", it.x, it.y);
			ctx.font = "40px system-ui";
			ctx.fillText("🧺", bx, by + 10);

			raf = requestAnimationFrame(loop);
		};
		raf = requestAnimationFrame(loop);
		return () => cancelAnimationFrame(raf);
	}, [playing, level, goal, finish]);

	const move = (clientX: number) => {
		const cv = canvasRef.current;
		if (!cv || !playing) return;
		const rect = cv.getBoundingClientRect();
		run.current.px = Math.min(
			Math.max((clientX - rect.left) / rect.width, 0.05),
			0.95,
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
			chips={[
				`⭐ ${caught}/${goal}`,
				`💔 ${missed}/3`,
				`${Math.ceil(timeLeft)}s`,
			]}
			progress={timeLeft / DURATION}
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
