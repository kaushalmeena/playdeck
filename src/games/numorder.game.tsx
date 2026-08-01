import clsx from "clsx";
import { useEffect, useRef, useState } from "react";
import { GameChrome } from "../components/game/GameChrome";
import type { GameMeta, GameProps } from "./kit";
import { shuffle, useCountdown, useRun } from "./kit";

export const meta: GameMeta = {
	title: "Number Order",
	emoji: "🔢",
	desc: "Tap 1, 2, 3… faster than you can count.",
	order: 11,
	accent: "#7c5cff",
	instructions:
		"Tap the numbers in ascending order before time runs out. One wrong tap ends it.",
};

export default function NumberOrder({
	level,
	active,
	onEnd,
	onPlayingChange,
}: GameProps) {
	const { playing, result, begin, finish, cancel } = useRun(onEnd);
	const count = Math.min(6 + level, 15);
	const total = count * Math.max(1.3 - level * 0.05, 0.7);
	const timeLeft = useCountdown(playing, total);

	const [tiles, setTiles] = useState<Array<number>>([]);
	const [next, setNext] = useState(1);
	const nextRef = useRef(1);

	useEffect(() => {
		if (playing && timeLeft <= 0)
			finish(false, (nextRef.current - 1) * 8, "Time's up");
	}, [playing, timeLeft, finish]);
	useEffect(() => {
		if (!active && playing) cancel();
	}, [active, playing, cancel]);

	const start = () => {
		setTiles(shuffle(Array.from({ length: count }, (_, i) => i + 1)));
		nextRef.current = 1;
		setNext(1);
		begin();
	};

	const tap = (n: number) => {
		if (!playing) return;
		if (n !== nextRef.current) {
			finish(false, (nextRef.current - 1) * 8, "Wrong number");
			return;
		}
		if (n === count) {
			finish(true, count * 10 + Math.ceil(timeLeft) * 3);
			return;
		}
		nextRef.current += 1;
		setNext(nextRef.current);
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
			chips={[`NEXT ${next}`, `${Math.ceil(timeLeft)}s`]}
			progress={timeLeft / total}
			onPlay={start}
			onQuit={cancel}
			onPlayingChange={onPlayingChange}
		>
			<div className="flex h-full w-full items-center justify-center px-4">
				<div className="grid w-[min(88vw,420px)] grid-cols-4 gap-2.5">
					{tiles.map((n) => (
						<button
							key={n}
							type="button"
							onPointerDown={() => tap(n)}
							className={clsx(
								"aspect-square rounded-xl border text-xl font-extrabold transition-opacity",
								n < next
									? "border-good bg-good/10 text-good opacity-40"
									: "border-line bg-card",
							)}
						>
							{n}
						</button>
					))}
				</div>
			</div>
		</GameChrome>
	);
}
