import { useEffect, useRef, useState } from "react";
import { GameChrome } from "../components/game/GameChrome";
import type { GameMeta, GameProps } from "./kit";
import { randInt, sfx, useCountdown, useRun } from "./kit";

export const meta: GameMeta = {
	title: "Odd · Even",
	emoji: "⚖️",
	desc: "A number flashes. Call its parity before it's gone.",
	order: 31,
	accent: "#ffd24d",
	instructions:
		"Numbers fly past — tap ODD or EVEN for each one before the clock runs out. One mistake ends it.",
};

export default function OddEven({
	level,
	active,
	onEnd,
	onPlayingChange,
}: GameProps) {
	const { playing, result, begin, finish, cancel } = useRun(onEnd);
	const rounds = 8 + Math.min(level, 10);
	const total = rounds * Math.max(1.8 - level * 0.08, 0.9);
	const timeLeft = useCountdown(playing, total);

	const [num, setNum] = useState(7);
	const done = useRef(0);
	const [doneCount, setDoneCount] = useState(0);

	useEffect(() => {
		if (playing && timeLeft <= 0) finish(false, done.current * 9, "Time's up");
	}, [playing, timeLeft, finish]);
	useEffect(() => {
		if (!active && playing) cancel();
	}, [active, playing, cancel]);

	const start = () => {
		done.current = 0;
		setDoneCount(0);
		setNum(randInt(1, 99 + level * 20));
		begin();
	};

	const answer = (odd: boolean) => {
		if (!playing) return;
		if ((num % 2 === 1) !== odd) {
			finish(false, done.current * 9, "Wrong parity");
			return;
		}
		sfx.good();
		done.current += 1;
		setDoneCount(done.current);
		if (done.current >= rounds) {
			finish(true, rounds * 9 + Math.ceil(timeLeft) * 2);
			return;
		}
		setNum(randInt(1, 99 + level * 20));
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
			chips={[`${doneCount}/${rounds}`, `${Math.ceil(timeLeft)}s`]}
			progress={timeLeft / total}
			onPlay={start}
			onQuit={cancel}
			onPlayingChange={onPlayingChange}
		>
			<div className="flex h-full w-full flex-col items-center justify-center gap-12 px-6">
				<div className="text-7xl font-black tracking-wider tabular-nums">
					{num}
				</div>
				<div className="flex w-full max-w-sm gap-3">
					<button
						type="button"
						onPointerDown={() => answer(true)}
						className="flex-1 rounded-2xl border border-accent/50 bg-accent/10 py-5 text-lg font-extrabold text-accent"
					>
						ODD
					</button>
					<button
						type="button"
						onPointerDown={() => answer(false)}
						className="flex-1 rounded-2xl border border-accent2/50 bg-accent2/10 py-5 text-lg font-extrabold text-accent2"
					>
						EVEN
					</button>
				</div>
			</div>
		</GameChrome>
	);
}
