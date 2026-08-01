import { useEffect, useRef, useState } from "react";
import { GameChrome } from "../components/game/GameChrome";
import type { GameMeta, GameProps } from "./kit";
import { randInt, useCountdown, useRun } from "./kit";

export const meta: GameMeta = {
	title: "Higher Lower",
	emoji: "🃏",
	desc: "Will the next number be higher or lower? Build the streak.",
	order: 15,
	accent: "#b06bff",
	instructions:
		"Guess whether the next number (1–99) is higher or lower than the current one. Hit the streak goal before time's up.",
};

const DURATION = 20;

export default function HigherLower({
	level,
	active,
	onEnd,
	onPlayingChange,
}: GameProps) {
	const { playing, result, begin, finish, cancel } = useRun(onEnd);
	const goal = 5 + Math.ceil(level / 2);
	const timeLeft = useCountdown(playing, DURATION);

	const [cur, setCur] = useState(50);
	const [streak, setStreak] = useState(0);
	const streakRef = useRef(0);

	useEffect(() => {
		if (playing && timeLeft <= 0)
			finish(false, streakRef.current * 12, "Time's up");
	}, [playing, timeLeft, finish]);
	useEffect(() => {
		if (!active && playing) cancel();
	}, [active, playing, cancel]);

	const start = () => {
		setCur(randInt(20, 80));
		streakRef.current = 0;
		setStreak(0);
		begin();
	};

	const guess = (higher: boolean) => {
		if (!playing) return;
		let next = cur;
		while (next === cur) next = randInt(1, 99);
		const correct = higher ? next > cur : next < cur;
		setCur(next);
		if (!correct) {
			finish(false, streakRef.current * 12, `It was ${next}`);
			return;
		}
		streakRef.current += 1;
		setStreak(streakRef.current);
		if (streakRef.current >= goal) {
			finish(true, goal * 12 + Math.ceil(timeLeft) * 3);
		}
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
			chips={[`🔥 ${streak}/${goal}`, `${Math.ceil(timeLeft)}s`]}
			progress={timeLeft / DURATION}
			onPlay={start}
			onQuit={cancel}
			onPlayingChange={onPlayingChange}
		>
			<div className="flex h-full w-full flex-col items-center justify-center gap-10 px-6">
				<div className="flex h-44 w-32 items-center justify-center rounded-2xl border-2 border-line bg-card text-6xl font-black shadow-[0_8px_40px_rgba(176,107,255,0.25)]">
					{cur}
				</div>
				<div className="flex w-full max-w-sm gap-3">
					<button
						type="button"
						onPointerDown={() => guess(false)}
						className="flex-1 rounded-2xl border border-danger/50 bg-danger/10 py-5 text-lg font-extrabold text-danger"
					>
						▼ LOWER
					</button>
					<button
						type="button"
						onPointerDown={() => guess(true)}
						className="flex-1 rounded-2xl border border-good/50 bg-good/10 py-5 text-lg font-extrabold text-good"
					>
						▲ HIGHER
					</button>
				</div>
			</div>
		</GameChrome>
	);
}
