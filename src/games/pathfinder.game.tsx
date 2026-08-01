import { useEffect, useRef, useState } from "react";
import { GameChrome } from "../components/game/GameChrome";
import type { GameMeta, GameProps } from "./kit";
import { randInt, useRun, useTimers } from "./kit";

export const meta: GameMeta = {
	title: "Path Recall",
	emoji: "🗺️",
	desc: "Watch the glowing trail. Walk it from memory.",
	order: 28,
	accent: "#b06bff",
	instructions:
		"A path lights up step by step. Repeat it in order — one wrong step and you're lost.",
};

const ROUNDS = 2;

function genPath(size: number, len: number): Array<number> {
	for (let attempt = 0; attempt < 50; attempt++) {
		const start = randInt(0, size * size - 1);
		const path = [start];
		while (path.length < len) {
			const cur = path[path.length - 1];
			const r = Math.floor(cur / size);
			const c = cur % size;
			const options = [
				r > 0 ? cur - size : -1,
				r < size - 1 ? cur + size : -1,
				c > 0 ? cur - 1 : -1,
				c < size - 1 ? cur + 1 : -1,
			].filter((n) => n >= 0 && !path.includes(n));
			if (options.length === 0) break;
			path.push(options[randInt(0, options.length - 1)]);
		}
		if (path.length === len) return path;
	}
	// dense fallback: straight-ish scan
	return Array.from({ length: len }, (_, i) => i);
}

export default function PathRecall({
	level,
	active,
	onEnd,
	onPlayingChange,
}: GameProps) {
	const { playing, result, begin, finish, cancel } = useRun(onEnd);
	const { after, clearAll } = useTimers();
	const size = level >= 5 ? 5 : 4;
	const len = Math.min(4 + Math.ceil(level / 2), size * size - 3);

	const [phase, setPhase] = useState<"show" | "input">("show");
	const [flashIdx, setFlashIdx] = useState(-1);
	const [stepsDone, setStepsDone] = useState(0);
	const [roundNo, setRoundNo] = useState(1);
	const path = useRef<Array<number>>([]);
	const pos = useRef(0);
	const done = useRef(0);

	useEffect(() => {
		if (!active && playing) {
			clearAll();
			cancel();
		}
	}, [active, playing, cancel, clearAll]);

	const newRound = () => {
		path.current = genPath(size, len);
		pos.current = 0;
		setStepsDone(0);
		setPhase("show");
		setFlashIdx(-1);
		path.current.forEach((_, i) => {
			after(350 + i * 380, () => setFlashIdx(i));
		});
		after(350 + path.current.length * 380 + 200, () => {
			setFlashIdx(-1);
			setPhase("input");
		});
	};

	const start = () => {
		done.current = 0;
		setRoundNo(1);
		begin();
		newRound();
	};

	const tap = (cell: number) => {
		if (!playing || phase !== "input") return;
		if (cell !== path.current[pos.current]) {
			finish(false, done.current * len * 7, "Wrong step");
			return;
		}
		pos.current += 1;
		setStepsDone(pos.current);
		if (pos.current >= path.current.length) {
			done.current += 1;
			if (done.current >= ROUNDS) {
				finish(true, ROUNDS * len * 7 + 10);
				return;
			}
			setRoundNo(done.current + 1);
			after(500, newRound);
		}
	};

	const cells = Array.from({ length: size * size }, (_, i) => i);
	const walked = new Set(path.current.slice(0, stepsDone));

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
				phase === "show" ? "WATCH" : `${stepsDone}/${len}`,
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
					className="grid gap-2"
					style={{
						gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))`,
						width: "min(82vw, 380px)",
					}}
				>
					{cells.map((i) => {
						const lit = phase === "show" && path.current[flashIdx] === i;
						return (
							<button
								key={i}
								type="button"
								onPointerDown={() => tap(i)}
								className={`aspect-square rounded-xl border-2 ${
									lit
										? "border-[#b06bff] bg-[#b06bff]/45 shadow-[0_0_28px_rgba(176,107,255,0.6)]"
										: walked.has(i) && phase === "input"
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
