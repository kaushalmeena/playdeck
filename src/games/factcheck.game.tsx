import { useEffect, useRef, useState } from "react";
import { GameChrome } from "../components/game/GameChrome";
import type { GameMeta, GameProps } from "./kit";
import { randInt, sfx, useCountdown, useRun } from "./kit";

export const meta: GameMeta = {
	title: "Fact Check",
	emoji: "✅",
	desc: "7 × 8 = 54. True or false? Think fast.",
	order: 24,
	accent: "#12b76a",
	instructions:
		"Equations fly at you — call each one TRUE or FALSE before the clock runs out. One mistake ends it.",
};

type Fact = { text: string; truth: boolean };

function genFact(level: number): Fact {
	const hi = Math.min(6 + level, 13);
	const a = randInt(2, hi);
	const b = randInt(2, hi);
	const truth = Math.random() < 0.5;
	const shown = truth
		? a * b
		: a * b + randInt(1, 3) * (Math.random() < 0.5 ? 1 : -1);
	return { text: `${a} × ${b} = ${shown}`, truth };
}

export default function FactCheck({
	level,
	active,
	onEnd,
	onPlayingChange,
}: GameProps) {
	const { playing, result, begin, finish, cancel } = useRun(onEnd);
	const rounds = 8 + Math.min(level, 8);
	const total = rounds * Math.max(2.4 - level * 0.1, 1.2);
	const timeLeft = useCountdown(playing, total);

	const [fact, setFact] = useState<Fact>(() => genFact(level));
	const done = useRef(0);
	const [doneCount, setDoneCount] = useState(0);

	useEffect(() => {
		if (playing && timeLeft <= 0) finish(false, done.current * 10, "Time's up");
	}, [playing, timeLeft, finish]);
	useEffect(() => {
		if (!active && playing) cancel();
	}, [active, playing, cancel]);

	const start = () => {
		done.current = 0;
		setDoneCount(0);
		setFact(genFact(level));
		begin();
	};

	const answer = (truth: boolean) => {
		if (!playing) return;
		if (truth !== fact.truth) {
			finish(false, done.current * 10, "Wrong call");
			return;
		}
		sfx.good();
		done.current += 1;
		setDoneCount(done.current);
		if (done.current >= rounds) {
			finish(true, rounds * 10 + Math.ceil(timeLeft) * 2);
			return;
		}
		setFact(genFact(level));
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
				<div className="text-5xl font-black tracking-wide">{fact.text}</div>
				<div className="flex w-full max-w-sm gap-3">
					<button
						type="button"
						onPointerDown={() => answer(true)}
						className="flex-1 rounded-2xl border border-good/50 bg-good/10 py-5 text-lg font-extrabold text-good"
					>
						✓ TRUE
					</button>
					<button
						type="button"
						onPointerDown={() => answer(false)}
						className="flex-1 rounded-2xl border border-danger/50 bg-danger/10 py-5 text-lg font-extrabold text-danger"
					>
						✗ FALSE
					</button>
				</div>
			</div>
		</GameChrome>
	);
}
