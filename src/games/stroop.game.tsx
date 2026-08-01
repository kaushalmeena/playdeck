import { useEffect, useRef, useState } from "react";
import { GameChrome } from "../components/GameChrome";
import type { GameMeta, GameProps } from "./kit";
import { pick, useCountdown, useRun } from "./kit";

export const meta: GameMeta = {
	title: "Color Clash",
	emoji: "🎨",
	desc: "Does the word match its ink? Trust your eyes, not your brain.",
	order: 8,
	accent: "#ff5cd0",
	instructions:
		"A color word appears in some ink. Tap MATCH if the word and ink agree, CLASH if they don't. Fast.",
};

const COLORS = [
	{ name: "RED", hex: "#ff4d6d" },
	{ name: "GREEN", hex: "#3dffa0" },
	{ name: "BLUE", hex: "#4d9fff" },
	{ name: "YELLOW", hex: "#ffd24d" },
	{ name: "PINK", hex: "#ff5cd0" },
];

type Round = { word: string; ink: string; match: boolean };

function genRound(): Round {
	const word = pick(COLORS);
	const match = Math.random() < 0.5;
	const ink = match
		? word
		: pick(COLORS.filter((c) => c.name !== word.name));
	return { word: word.name, ink: ink.hex, match };
}

export default function ColorClash({
	level,
	active,
	onEnd,
	onPlayingChange,
}: GameProps) {
	const { playing, result, begin, finish, cancel } = useRun(onEnd);
	const rounds = 6 + Math.min(level, 8);
	const total = rounds * Math.max(2.2 - level * 0.08, 1.1);
	const timeLeft = useCountdown(playing, total);

	const [round, setRound] = useState<Round>(genRound);
	const done = useRef(0);
	const [doneCount, setDoneCount] = useState(0);

	useEffect(() => {
		if (playing && timeLeft <= 0)
			finish(false, done.current * 12, "Time's up");
	}, [playing, timeLeft, finish]);
	useEffect(() => {
		if (!active && playing) cancel();
	}, [active, playing, cancel]);

	const start = () => {
		done.current = 0;
		setDoneCount(0);
		setRound(genRound());
		begin();
	};

	const answer = (saysMatch: boolean) => {
		if (!playing) return;
		if (saysMatch !== round.match) {
			finish(false, done.current * 12, "Fooled you");
			return;
		}
		done.current += 1;
		setDoneCount(done.current);
		if (done.current >= rounds) {
			finish(true, rounds * 12 + Math.ceil(timeLeft) * 2);
			return;
		}
		setRound(genRound());
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
				<div
					className="text-6xl font-black tracking-[0.15em]"
					style={{ color: round.ink }}
				>
					{round.word}
				</div>
				<div className="flex w-full max-w-sm gap-3">
					<button
						type="button"
						onPointerDown={() => answer(true)}
						className="flex-1 rounded-2xl border border-good/50 bg-good/10 py-5 text-lg font-extrabold text-good"
					>
						MATCH
					</button>
					<button
						type="button"
						onPointerDown={() => answer(false)}
						className="flex-1 rounded-2xl border border-danger/50 bg-danger/10 py-5 text-lg font-extrabold text-danger"
					>
						CLASH
					</button>
				</div>
			</div>
		</GameChrome>
	);
}
