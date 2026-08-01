import { useEffect, useRef, useState } from "react";
import { GameChrome } from "../components/game/GameChrome";
import type { GameMeta, GameProps } from "./kit";
import { randInt, useCountdown, useRun } from "./kit";

export const meta: GameMeta = {
	title: "Odd One Out",
	emoji: "🔍",
	desc: "One tile is a little different. Find it.",
	order: 10,
	accent: "#00b8d9",
	instructions:
		"Every round, one tile is a slightly different shade. Tap it. The difference shrinks each level.",
};

type Board = { n: number; odd: number; hue: number; delta: number };

function genBoard(level: number): Board {
	const n = Math.min(3 + Math.ceil(level / 3), 6);
	return {
		n,
		odd: randInt(0, n * n - 1),
		hue: randInt(0, 359),
		delta: Math.max(18 - level * 1.3, 6),
	};
}

export default function OddOneOut({
	level,
	active,
	onEnd,
	onPlayingChange,
}: GameProps) {
	const { playing, result, begin, finish, cancel } = useRun(onEnd);
	const rounds = 5 + Math.min(level, 5);
	const total = rounds * Math.max(4 - level * 0.15, 2);
	const timeLeft = useCountdown(playing, total);

	const [board, setBoard] = useState<Board>(() => genBoard(level));
	const done = useRef(0);
	const [doneCount, setDoneCount] = useState(0);

	useEffect(() => {
		if (playing && timeLeft <= 0) finish(false, done.current * 15, "Time's up");
	}, [playing, timeLeft, finish]);
	useEffect(() => {
		if (!active && playing) cancel();
	}, [active, playing, cancel]);

	const start = () => {
		done.current = 0;
		setDoneCount(0);
		setBoard(genBoard(level));
		begin();
	};

	const tap = (i: number) => {
		if (!playing) return;
		if (i !== board.odd) {
			finish(false, done.current * 15, "Wrong tile");
			return;
		}
		done.current += 1;
		setDoneCount(done.current);
		if (done.current >= rounds) {
			finish(true, rounds * 15 + Math.ceil(timeLeft) * 2);
			return;
		}
		setBoard(genBoard(level));
	};

	const cells = Array.from({ length: board.n * board.n }, (_, i) => i);

	return (
		<GameChrome
			emoji={meta.emoji}
			title={meta.title}
			accent={meta.accent}
			level={level}
			instructions={meta.instructions}
			playing={playing}
			result={result}
			chips={[`${doneCount}/${rounds}`, `${Math.ceil(timeLeft)}s`]}
			progress={timeLeft / total}
			onPlay={start}
			onQuit={cancel}
			onPlayingChange={onPlayingChange}
		>
			<div className="flex h-full w-full items-center justify-center px-4">
				<div
					className="grid gap-2"
					style={{
						gridTemplateColumns: `repeat(${board.n}, minmax(0, 1fr))`,
						width: "min(84vw, 400px)",
					}}
				>
					{cells.map((i) => (
						<button
							key={`${board.hue}-${i}`}
							type="button"
							onPointerDown={() => tap(i)}
							className="aspect-square rounded-xl border border-line"
							style={{
								background: `hsl(${board.hue}, 70%, ${i === board.odd ? 55 + board.delta : 55}%)`,
							}}
						/>
					))}
				</div>
			</div>
		</GameChrome>
	);
}
