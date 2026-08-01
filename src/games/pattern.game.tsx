import { useEffect, useRef, useState } from "react";
import { GameChrome } from "../components/GameChrome";
import type { GameMeta, GameProps } from "./kit";
import { shuffle, useRun, useTimers } from "./kit";

export const meta: GameMeta = {
	title: "Pattern Echo",
	emoji: "🧩",
	desc: "The grid flashes a shape. Paint it back from memory.",
	order: 25,
	accent: "#7c5cff",
	instructions:
		"A set of tiles lights up briefly. Reproduce the pattern — tap a wrong tile and the run ends.",
};

const ROUNDS = 3;

export default function PatternEcho({
	level,
	active,
	onEnd,
	onPlayingChange,
}: GameProps) {
	const { playing, result, begin, finish, cancel } = useRun(onEnd);
	const { after, clearAll } = useTimers();
	const size = level >= 5 ? 4 : 3;
	const k = Math.min(3 + Math.ceil(level / 2), size * size - 2);

	const [phase, setPhase] = useState<"show" | "input">("show");
	const [litSet, setLitSet] = useState<Set<number>>(new Set());
	const [found, setFound] = useState<Set<number>>(new Set());
	const [roundNo, setRoundNo] = useState(1);
	const done = useRef(0);

	useEffect(() => {
		if (!active && playing) {
			clearAll();
			cancel();
		}
	}, [active, playing, cancel, clearAll]);

	const newRound = () => {
		const cells = shuffle(Array.from({ length: size * size }, (_, i) => i));
		setLitSet(new Set(cells.slice(0, k)));
		setFound(new Set());
		setPhase("show");
		after(1200, () => setPhase("input"));
	};

	const start = () => {
		done.current = 0;
		setRoundNo(1);
		begin();
		newRound();
	};

	const tap = (i: number) => {
		if (!playing || phase !== "input" || found.has(i)) return;
		if (!litSet.has(i)) {
			finish(false, done.current * k * 6, "Wrong tile");
			return;
		}
		const nextFound = new Set(found);
		nextFound.add(i);
		setFound(nextFound);
		if (nextFound.size >= litSet.size) {
			done.current += 1;
			if (done.current >= ROUNDS) {
				finish(true, ROUNDS * k * 6 + 15);
				return;
			}
			setRoundNo(done.current + 1);
			after(500, newRound);
		}
	};

	const cells = Array.from({ length: size * size }, (_, i) => i);

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
				phase === "show" ? "MEMORIZE" : "REPEAT",
			]}
			onPlay={start}
			onQuit={() => {
				clearAll();
				cancel();
			}}
			onPlayingChange={onPlayingChange}
		>
			<div className="flex h-full w-full items-center justify-center px-6">
				<div
					className="grid gap-2.5"
					style={{
						gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))`,
						width: "min(80vw, 380px)",
					}}
				>
					{cells.map((i) => {
						const showLit = phase === "show" && litSet.has(i);
						const isFound = found.has(i);
						return (
							<button
								key={i}
								type="button"
								onPointerDown={() => tap(i)}
								className={`aspect-square rounded-xl border-2 ${
									showLit
										? "border-accent bg-accent/40 shadow-[0_0_28px_rgba(124,92,255,0.6)]"
										: isFound
											? "border-good bg-good/25"
											: "border-line bg-card"
								}`}
							/>
						);
					})}
				</div>
			</div>
		</GameChrome>
	);
}
