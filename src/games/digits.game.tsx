import clsx from "clsx";
import { useEffect, useRef, useState } from "react";
import { GameChrome } from "../components/game/GameChrome";
import type { GameMeta, GameProps } from "./kit";
import { randInt, useRun, useTimers } from "./kit";

export const meta: GameMeta = {
	title: "Digit Recall",
	emoji: "🔐",
	desc: "Memorize the code. Punch it back in.",
	order: 20,
	accent: "#00e5ff",
	instructions:
		"A code flashes briefly — type it back on the keypad. Three rounds; codes get longer with your level.",
};

const ROUNDS = 3;
const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"];

export default function DigitRecall({
	level,
	active,
	onEnd,
	onPlayingChange,
}: GameProps) {
	const { playing, result, begin, finish, cancel } = useRun(onEnd);
	const { after, clearAll } = useTimers();
	const len = Math.min(3 + Math.ceil(level / 2), 9);
	const flashMs = Math.max(2200 - level * 100, 900);

	const [phase, setPhase] = useState<"show" | "input">("show");
	const [code, setCode] = useState("");
	const [entered, setEntered] = useState("");
	const [round, setRound] = useState(1);
	const roundRef = useRef(1);

	useEffect(() => {
		if (!active && playing) {
			clearAll();
			cancel();
		}
	}, [active, playing, cancel, clearAll]);

	const newRound = () => {
		const c = Array.from({ length: len }, () => String(randInt(0, 9))).join("");
		setCode(c);
		setEntered("");
		setPhase("show");
		after(flashMs, () => setPhase("input"));
	};

	const start = () => {
		roundRef.current = 1;
		setRound(1);
		begin();
		newRound();
	};

	const press = (k: string) => {
		if (!playing || phase !== "input") return;
		const next = entered + k;
		if (code[next.length - 1] !== k) {
			finish(false, (roundRef.current - 1) * len * 8, "Wrong digit");
			return;
		}
		setEntered(next);
		if (next.length === code.length) {
			if (roundRef.current >= ROUNDS) {
				finish(true, ROUNDS * len * 8 + 15);
				return;
			}
			roundRef.current += 1;
			setRound(roundRef.current);
			after(500, newRound);
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
			chips={[
				`ROUND ${round}/${ROUNDS}`,
				phase === "show" ? "MEMORIZE" : "TYPE",
			]}
			onPlay={start}
			onQuit={() => {
				clearAll();
				cancel();
			}}
			onPlayingChange={onPlayingChange}
		>
			<div className="flex h-full w-full flex-col items-center justify-center gap-8 px-6">
				<div className="flex h-16 items-center text-4xl font-black tracking-[0.3em]">
					{phase === "show" ? (
						<span className="text-accent2">{code}</span>
					) : (
						<span>
							{entered}
							<span className="text-muted">
								{"•".repeat(Math.max(code.length - entered.length, 0))}
							</span>
						</span>
					)}
				</div>
				<div className="grid grid-cols-3 gap-2.5">
					{KEYS.map((k) => (
						<button
							key={k}
							type="button"
							onPointerDown={() => press(k)}
							disabled={phase !== "input"}
							className={clsx(
								"h-16 w-20 rounded-2xl border border-line bg-card text-2xl font-extrabold disabled:opacity-40",
								k === "0" && "col-start-2",
							)}
						>
							{k}
						</button>
					))}
				</div>
			</div>
		</GameChrome>
	);
}
