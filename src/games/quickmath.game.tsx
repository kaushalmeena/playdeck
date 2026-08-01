import { useEffect, useRef, useState } from "react";
import { GameChrome } from "../components/GameChrome";
import type { GameMeta, GameProps } from "./kit";
import { randInt, shuffle, useCountdown, useRun } from "./kit";

export const meta: GameMeta = {
	title: "Quick Math",
	emoji: "➕",
	desc: "Mental math against the clock.",
	order: 7,
	accent: "#ffb13d",
	instructions:
		"Answer the equations before the timer melts. One wrong answer ends the run.",
};

const ROUNDS = 6;

type Q = { text: string; answers: Array<number>; correct: number };

function genQ(level: number): Q {
	const hi = 8 + level * 3;
	let a: number;
	let b: number;
	let correct: number;
	let text: string;
	const op = level < 3 ? randInt(0, 1) : level < 6 ? randInt(0, 2) : randInt(1, 2);
	if (op === 0) {
		a = randInt(2, hi);
		b = randInt(2, hi);
		correct = a + b;
		text = `${a} + ${b}`;
	} else if (op === 1) {
		a = randInt(2, hi);
		b = randInt(2, hi);
		if (b > a) [a, b] = [b, a];
		correct = a - b;
		text = `${a} − ${b}`;
	} else {
		a = randInt(2, Math.min(6 + level, 13));
		b = randInt(2, Math.min(6 + level, 13));
		correct = a * b;
		text = `${a} × ${b}`;
	}
	const decoys = new Set<number>();
	while (decoys.size < 3) {
		const d = correct + randInt(-6, 6) * (randInt(0, 1) ? 1 : 2);
		if (d !== correct && d >= 0) decoys.add(d);
	}
	return { text, answers: shuffle([correct, ...decoys]), correct };
}

export default function QuickMath({
	level,
	active,
	onEnd,
	onPlayingChange,
}: GameProps) {
	const { playing, result, begin, finish, cancel } = useRun(onEnd);
	const total = ROUNDS * Math.max(6 - level * 0.25, 2.5);
	const timeLeft = useCountdown(playing, total);

	const [q, setQ] = useState<Q>(() => genQ(level));
	const [round, setRound] = useState(1);
	const done = useRef(0);

	useEffect(() => {
		if (playing && timeLeft <= 0)
			finish(false, done.current * 15, "Time's up");
	}, [playing, timeLeft, finish]);
	useEffect(() => {
		if (!active && playing) cancel();
	}, [active, playing, cancel]);

	const start = () => {
		done.current = 0;
		setRound(1);
		setQ(genQ(level));
		begin();
	};

	const answer = (n: number) => {
		if (!playing) return;
		if (n !== q.correct) {
			finish(false, done.current * 15, "Wrong answer");
			return;
		}
		done.current += 1;
		if (done.current >= ROUNDS) {
			finish(true, ROUNDS * 15 + Math.ceil(timeLeft) * 2);
			return;
		}
		setRound(done.current + 1);
		setQ(genQ(level));
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
			chips={[`Q ${round}/${ROUNDS}`, `${Math.ceil(timeLeft)}s`]}
			progress={timeLeft / total}
			onPlay={start}
			onQuit={cancel}
			onPlayingChange={onPlayingChange}
		>
			<div className="flex h-full w-full flex-col items-center justify-center gap-8 px-6">
				<div className="text-5xl font-black tracking-wider">{q.text} = ?</div>
				<div className="grid w-full max-w-sm grid-cols-2 gap-3">
					{q.answers.map((n) => (
						<button
							key={n}
							type="button"
							onPointerDown={() => answer(n)}
							className="rounded-2xl border border-line bg-card py-5 text-2xl font-extrabold"
						>
							{n}
						</button>
					))}
				</div>
			</div>
		</GameChrome>
	);
}
