import clsx from "clsx";
import { useEffect, useRef, useState } from "react";
import { GameChrome } from "../components/game/GameChrome";
import type { GameMeta, GameProps } from "./kit";
import { useRun } from "./kit";

export const meta: GameMeta = {
	title: "Mind Match",
	emoji: "🧠",
	desc: "Match all the pairs before the clock melts.",
	order: 3,
	accent: "#d637a4",
	instructions:
		"Flip tiles and find every pair before the timer runs out. Higher levels: more pairs, less time.",
};

const EMOJIS = ["🍕", "🚀", "🐙", "🌵", "🎧", "🪩", "🍩", "👾", "🌈", "🔮"];

type Tile = { key: number; emoji: string; state: "closed" | "open" | "done" };

export default function MindMatch({
	level,
	active,
	onEnd,
	onPlayingChange,
}: GameProps) {
	const { playing, result, begin, finish, cancel } = useRun(onEnd);
	const pairs = Math.min(2 + level, 10);
	const totalTime = Math.max(pairs * 5 - level * 2, pairs * 2 + 4);

	const [tiles, setTiles] = useState<Array<Tile>>([]);
	const [matched, setMatched] = useState(0);
	const [timeLeft, setTimeLeft] = useState(totalTime);
	const lock = useRef(false);
	const openKeys = useRef<Array<number>>([]);
	const matchedRef = useRef(0);
	const flipBack = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

	const start = () => {
		const deck = [...EMOJIS.slice(0, pairs), ...EMOJIS.slice(0, pairs)]
			.map((emoji, key) => ({ emoji, key, r: Math.random() }))
			.sort((a, b) => a.r - b.r)
			.map(({ emoji, key }) => ({ key, emoji, state: "closed" as const }));
		setTiles(deck);
		setMatched(0);
		matchedRef.current = 0;
		openKeys.current = [];
		lock.current = false;
		setTimeLeft(totalTime);
		begin();
	};

	// countdown
	useEffect(() => {
		if (!playing) return;
		const t = setInterval(() => {
			setTimeLeft((s) => {
				if (s <= 0.1) {
					finish(false, matchedRef.current * 20, "Time's up");
					return 0;
				}
				return s - 0.1;
			});
		}, 100);
		return () => clearInterval(t);
	}, [playing, finish]);

	// cancel when scrolled away; clear pending flip-back on unmount
	useEffect(() => {
		if (!active && playing) cancel();
	}, [active, playing, cancel]);
	useEffect(() => () => clearTimeout(flipBack.current), []);

	const flip = (key: number) => {
		if (!playing || lock.current) return;
		const tile = tiles.find((t) => t.key === key);
		if (!tile || tile.state !== "closed") return;

		const open = [...openKeys.current, key];
		setTiles((ts) =>
			ts.map((t) => (t.key === key ? { ...t, state: "open" } : t)),
		);
		if (open.length < 2) {
			openKeys.current = open;
			return;
		}
		openKeys.current = [];
		const [a, b] = open.map((k) => tiles.find((t) => t.key === k));
		if (a && b && a.emoji === b.emoji) {
			setTiles((ts) =>
				ts.map((t) => (open.includes(t.key) ? { ...t, state: "done" } : t)),
			);
			matchedRef.current += 1;
			setMatched(matchedRef.current);
			if (matchedRef.current >= pairs) {
				finish(true, pairs * 20 + Math.ceil(timeLeft) * 2);
			}
		} else {
			lock.current = true;
			flipBack.current = setTimeout(() => {
				setTiles((ts) =>
					ts.map((t) => (t.state === "open" ? { ...t, state: "closed" } : t)),
				);
				lock.current = false;
			}, 600);
		}
	};

	const cols =
		tiles.length <= 8
			? Math.ceil(tiles.length / 3)
			: Math.ceil(Math.sqrt(tiles.length));

	return (
		<GameChrome
			emoji={meta.emoji}
			title={meta.title}
			accent={meta.accent}
			level={level}
			instructions={meta.instructions}
			playing={playing}
			result={result}
			chips={[`${matched}/${pairs} PAIRS`, `${Math.ceil(timeLeft)}s`]}
			onQuit={cancel}
			onPlay={start}
			onPlayingChange={onPlayingChange}
		>
			{/* timer bar */}
			{playing && (
				<div
					className="absolute top-0 left-0 z-10 h-1 w-full origin-left bg-linear-to-r from-[#d637a4] to-[#ff5cd0] transition-transform duration-100"
					style={{ transform: `scaleX(${Math.max(timeLeft / totalTime, 0)})` }}
				/>
			)}
			<div className="flex h-full w-full items-center justify-center px-4 pt-24 pb-10">
				<div
					className="grid gap-2.5"
					style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
				>
					{tiles.map((t) => (
						<button
							key={t.key}
							type="button"
							onClick={() => flip(t.key)}
							className={clsx(
								"flex h-[min(18vw,84px)] w-[min(18vw,84px)] cursor-pointer items-center justify-center rounded-xl border text-3xl transition-all duration-150",
								t.state === "done"
									? "border-good bg-good/10 opacity-55"
									: t.state === "open"
										? "scale-105 border-[#d637a4] bg-accent/15"
										: "border-line bg-card",
							)}
						>
							<span
								className={t.state === "closed" ? "opacity-0" : "opacity-100"}
							>
								{t.emoji}
							</span>
						</button>
					))}
				</div>
			</div>
		</GameChrome>
	);
}
