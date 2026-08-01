import { useEffect, useRef, useState } from "react";
import { GameChrome } from "../components/game/GameChrome";
import type { GameMeta, GameProps } from "./kit";
import { randInt, useRun, useTimers } from "./kit";

export const meta: GameMeta = {
	title: "RPS React",
	emoji: "✊",
	desc: "Beat the hand — or lose to it on purpose. Read fast.",
	order: 16,
	accent: "#ff8a1e",
	instructions:
		"A hand appears with an order: WIN or LOSE against it. Pick the right counter before the window closes.",
};

const HANDS = ["✊", "✋", "✌️"];
// what beats index i / what loses to index i
const BEATS = [1, 2, 0]; // paper beats rock, scissors beats paper, rock beats scissors
const LOSES = [2, 0, 1];

export default function RpsReact({
	level,
	active,
	onEnd,
	onPlayingChange,
}: GameProps) {
	const { playing, result, begin, finish, cancel } = useRun(onEnd);
	const { after, clearAll } = useTimers();
	const rounds = 5 + Math.min(level, 7);
	const windowMs = Math.max(2200 - level * 120, 900);

	const [bot, setBot] = useState(0);
	const [wantWin, setWantWin] = useState(true);
	const [round, setRound] = useState(1);
	const done = useRef(0);

	useEffect(() => {
		if (!active && playing) {
			clearAll();
			cancel();
		}
	}, [active, playing, cancel, clearAll]);

	const nextRound = () => {
		setBot(randInt(0, 2));
		setWantWin(level < 2 ? true : Math.random() < 0.6);
		after(windowMs, () => {
			finish(false, done.current * 14, "Too slow");
		});
	};

	const start = () => {
		done.current = 0;
		setRound(1);
		begin();
		nextRound();
	};

	const choose = (i: number) => {
		if (!playing) return;
		clearAll();
		const correct = wantWin ? BEATS[bot] : LOSES[bot];
		if (i !== correct) {
			finish(false, done.current * 14, "Wrong hand");
			return;
		}
		done.current += 1;
		if (done.current >= rounds) {
			finish(true, rounds * 14 + 20);
			return;
		}
		setRound(done.current + 1);
		nextRound();
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
			chips={[`ROUND ${round}/${rounds}`]}
			onPlay={start}
			onQuit={() => {
				clearAll();
				cancel();
			}}
			onPlayingChange={onPlayingChange}
		>
			<div className="flex h-full w-full flex-col items-center justify-center gap-8 px-6">
				<div
					className={`text-sm font-black tracking-[0.4em] ${wantWin ? "text-good" : "text-danger"}`}
				>
					{playing ? (wantWin ? "WIN AGAINST" : "LOSE AGAINST") : ""}
				</div>
				<div className="text-8xl">{playing ? HANDS[bot] : "❔"}</div>
				<div className="flex gap-3">
					{HANDS.map((h, i) => (
						<button
							key={h}
							type="button"
							onPointerDown={() => choose(i)}
							className="flex h-20 w-20 items-center justify-center rounded-2xl border border-line bg-card text-4xl"
						>
							{h}
						</button>
					))}
				</div>
			</div>
		</GameChrome>
	);
}
