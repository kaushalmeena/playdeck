import { useEffect, useRef, useState } from "react";
import { GameChrome } from "../components/game/GameChrome";
import type { GameMeta, GameProps } from "./kit";
import { randInt, sfx, shuffle, useRun, useTimers } from "./kit";

export const meta: GameMeta = {
	title: "Flash Count",
	emoji: "👁️",
	desc: "The dots vanish in a blink. How many were there?",
	order: 23,
	accent: "#ffd24d",
	instructions:
		"Dots flash on screen for a moment. Pick how many you saw. Four rounds, shorter flashes each level.",
};

const ROUNDS = 4;

type Round = {
	dots: Array<{ x: number; y: number }>;
	options: Array<number>;
	count: number;
};

function genRound(level: number): Round {
	const count = randInt(4 + Math.min(level, 8), 8 + Math.min(level * 2, 14));
	const dots = Array.from({ length: count }, () => ({
		x: randInt(10, 90),
		y: randInt(15, 85),
	}));
	const opts = new Set([count]);
	while (opts.size < 4) {
		const o = count + randInt(-3, 3);
		if (o > 0) opts.add(o);
	}
	return { dots, options: shuffle([...opts]), count };
}

export default function FlashCount({
	level,
	active,
	onEnd,
	onPlayingChange,
}: GameProps) {
	const { playing, result, begin, finish, cancel } = useRun(onEnd);
	const { after, clearAll } = useTimers();
	const flashMs = Math.max(1500 - level * 70, 500);

	const [phase, setPhase] = useState<"show" | "guess">("show");
	const [round, setRound] = useState<Round>(() => genRound(level));
	const [roundNo, setRoundNo] = useState(1);
	const done = useRef(0);

	useEffect(() => {
		if (!active && playing) {
			clearAll();
			cancel();
		}
	}, [active, playing, cancel, clearAll]);

	const newRound = () => {
		setRound(genRound(level));
		setPhase("show");
		after(flashMs, () => setPhase("guess"));
	};

	const start = () => {
		done.current = 0;
		setRoundNo(1);
		begin();
		newRound();
	};

	const answer = (n: number) => {
		if (!playing || phase !== "guess") return;
		if (n !== round.count) {
			finish(false, done.current * 15, `It was ${round.count}`);
			return;
		}
		sfx.good();
		done.current += 1;
		if (done.current >= ROUNDS) {
			finish(true, ROUNDS * 15 + 20);
			return;
		}
		setRoundNo(done.current + 1);
		newRound();
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
				`ROUND ${roundNo}/${ROUNDS}`,
				phase === "show" ? "WATCH" : "GUESS",
			]}
			onPlay={start}
			onQuit={() => {
				clearAll();
				cancel();
			}}
			onPlayingChange={onPlayingChange}
		>
			<div className="flex h-full w-full flex-col items-center justify-center gap-6 px-6">
				<div className="relative h-[46vh] w-full max-w-md rounded-2xl border border-line bg-card/40">
					{playing &&
						phase === "show" &&
						round.dots.map((d, i) => (
							<span
								// biome-ignore lint/suspicious/noArrayIndexKey: dots regenerate per round
								key={`${roundNo}-${i}`}
								className="absolute h-5 w-5 rounded-full bg-[#ffd24d] shadow-[0_0_14px_rgba(255,210,77,0.8)]"
								style={{ left: `${d.x}%`, top: `${d.y}%` }}
							/>
						))}
					{playing && phase === "guess" && (
						<div className="flex h-full items-center justify-center text-5xl font-black text-muted">
							?
						</div>
					)}
				</div>
				<div className="grid w-full max-w-md grid-cols-4 gap-2.5">
					{round.options.map((n) => (
						<button
							key={n}
							type="button"
							onPointerDown={() => answer(n)}
							disabled={phase !== "guess"}
							className="rounded-xl border border-line bg-card py-4 text-xl font-extrabold disabled:opacity-40"
						>
							{n}
						</button>
					))}
				</div>
			</div>
		</GameChrome>
	);
}
