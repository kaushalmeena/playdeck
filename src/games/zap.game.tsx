import clsx from "clsx";
import { useEffect, useRef, useState } from "react";
import { GameChrome } from "../components/game/GameChrome";
import type { GameMeta, GameProps } from "./kit";
import { useRun } from "./kit";

export const meta: GameMeta = {
	title: "Zap Bot",
	emoji: "🤖",
	desc: "Whack the rogue bots. Mind the bombs.",
	order: 6,
	accent: "#ff8a1e",
	instructions:
		"Rogue bots pop out of the grid — tap them before they hide. Hit the target count in 20 seconds. Never tap a 💣.",
};

const DURATION = 20;

type Cell = { icon: string; flash: "hit" | "boom" | null };
const EMPTY: Array<Cell> = Array.from({ length: 9 }, () => ({
	icon: "",
	flash: null,
}));

export default function ZapBot({
	level,
	active,
	onEnd,
	onPlayingChange,
}: GameProps) {
	const { playing, result, begin, finish, cancel } = useRun(onEnd);
	const goal = 8 + level * 2;
	const uptime = Math.max(950 - level * 55, 380);

	const [cells, setCells] = useState<Array<Cell>>(EMPTY);
	const [hits, setHits] = useState(0);
	const [timeLeft, setTimeLeft] = useState(DURATION);

	const run = useRef({ botAt: -1, isBomb: false, hits: 0 });
	const moveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
		undefined,
	);

	const move = () => {
		const r = run.current;
		let next = r.botAt;
		while (next === r.botAt) next = (Math.random() * 9) | 0;
		r.botAt = next;
		r.isBomb = level >= 3 && Math.random() < 0.22;
		setCells(
			EMPTY.map((c, i) =>
				i === next ? { icon: r.isBomb ? "💣" : "🤖", flash: null } : c,
			),
		);
		moveTimer.current = setTimeout(move, uptime);
	};

	const start = () => {
		run.current = { botAt: -1, isBomb: false, hits: 0 };
		setHits(0);
		setTimeLeft(DURATION);
		setCells(EMPTY);
		begin();
		move();
	};

	// countdown; win/lose is decided when it hits zero
	useEffect(() => {
		if (!playing) return;
		const t = setInterval(() => {
			setTimeLeft((s) => {
				if (s <= 0.1) {
					const h = run.current.hits;
					clearTimeout(moveTimer.current);
					finish(
						h >= goal,
						h * 10 + (h >= goal ? 30 : 0),
						h >= goal ? undefined : "Not enough zaps",
					);
					return 0;
				}
				return s - 0.1;
			});
		}, 100);
		return () => clearInterval(t);
	}, [playing, goal, finish]);

	// stop the bot when the run ends for any reason; cancel when scrolled away
	useEffect(() => {
		if (!playing) clearTimeout(moveTimer.current);
	}, [playing]);
	useEffect(() => {
		if (!active && playing) cancel();
	}, [active, playing, cancel]);
	useEffect(() => () => clearTimeout(moveTimer.current), []);

	const tap = (i: number) => {
		const r = run.current;
		if (!playing || i !== r.botAt) return;
		clearTimeout(moveTimer.current);
		if (r.isBomb) {
			setCells(
				EMPTY.map((c, j) => (j === i ? { icon: "💥", flash: "boom" } : c)),
			);
			finish(false, r.hits * 10, "Boom");
			return;
		}
		r.hits += 1;
		setHits(r.hits);
		setCells(EMPTY.map((c, j) => (j === i ? { icon: "💥", flash: "hit" } : c)));
		if (r.hits >= goal) {
			finish(true, r.hits * 10 + 30);
			return;
		}
		moveTimer.current = setTimeout(move, 120);
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
			chips={[`🎯 ${hits}/${goal}`, `${Math.ceil(timeLeft)}s`]}
			onQuit={cancel}
			onPlay={start}
			onPlayingChange={onPlayingChange}
		>
			{/* timer bar */}
			{playing && (
				<div
					className="absolute top-0 left-0 z-10 h-1 w-full origin-left bg-linear-to-r from-[#ff8a1e] to-[#ffb13d] transition-transform duration-100"
					style={{ transform: `scaleX(${Math.max(timeLeft / DURATION, 0)})` }}
				/>
			)}
			<div className="flex h-full w-full items-center justify-center">
				<div className="grid grid-cols-3 gap-3.5">
					{cells.map((c, i) => (
						<button
							// biome-ignore lint/suspicious/noArrayIndexKey: fixed 3×3 grid
							key={i}
							type="button"
							onPointerDown={() => tap(i)}
							className={clsx(
								"flex h-[min(26vw,120px)] w-[min(26vw,120px)] cursor-pointer items-center justify-center rounded-2xl border-2 text-[min(15vw,60px)] transition-transform duration-75 active:scale-95",
								c.flash === "hit"
									? "border-good bg-good/15"
									: c.flash === "boom"
										? "border-danger bg-danger/15"
										: "border-line bg-card",
							)}
						>
							{c.icon}
						</button>
					))}
				</div>
			</div>
		</GameChrome>
	);
}
