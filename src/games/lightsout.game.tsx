import clsx from "clsx";
import { useEffect, useState } from "react";
import { GameChrome } from "../components/game/GameChrome";
import type { GameMeta, GameProps } from "./kit";
import { randInt, useCountdown, useRun } from "./kit";

export const meta: GameMeta = {
	title: "Lights Out",
	emoji: "💡",
	desc: "Every tap flips a cross. Turn everything off.",
	order: 17,
	accent: "#ffd24d",
	instructions:
		"Tapping a cell toggles it and its neighbors. Switch all the lights off within the move budget.",
};

const N = 3;
const DURATION = 30;

function toggleCross(board: Array<boolean>, i: number): Array<boolean> {
	const next = [...board];
	const r = Math.floor(i / N);
	const c = i % N;
	const flip = (rr: number, cc: number) => {
		if (rr >= 0 && rr < N && cc >= 0 && cc < N) {
			next[rr * N + cc] = !next[rr * N + cc];
		}
	};
	flip(r, c);
	flip(r - 1, c);
	flip(r + 1, c);
	flip(r, c - 1);
	flip(r, c + 1);
	return next;
}

export default function LightsOut({
	level,
	active,
	onEnd,
	onPlayingChange,
}: GameProps) {
	const { playing, result, begin, finish, cancel } = useRun(onEnd);
	const scrambles = 2 + Math.min(level, 10);
	const budget = scrambles + Math.max(5 - Math.floor(level / 2), 1);
	const timeLeft = useCountdown(playing, DURATION);

	const [board, setBoard] = useState<Array<boolean>>(Array(N * N).fill(false));
	const [moves, setMoves] = useState(0);

	useEffect(() => {
		if (playing && timeLeft <= 0) {
			finish(false, board.filter((b) => !b).length * 3, "Time's up");
		}
	}, [playing, timeLeft, finish, board]);
	useEffect(() => {
		if (!active && playing) cancel();
	}, [active, playing, cancel]);

	const start = () => {
		// scramble from solved so it's always solvable
		let b = Array(N * N).fill(false);
		const used = new Set<number>();
		while (used.size < scrambles) used.add(randInt(0, N * N - 1));
		for (const i of used) b = toggleCross(b, i);
		if (b.every((x) => !x)) b = toggleCross(b, randInt(0, N * N - 1));
		setBoard(b);
		setMoves(0);
		begin();
	};

	const tap = (i: number) => {
		if (!playing) return;
		const next = toggleCross(board, i);
		const used = moves + 1;
		setBoard(next);
		setMoves(used);
		if (next.every((x) => !x)) {
			finish(true, 40 + (budget - used) * 10 + Math.ceil(timeLeft));
			return;
		}
		if (used >= budget) {
			finish(false, next.filter((x) => !x).length * 3, "Out of moves");
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
			chips={[`MOVES ${moves}/${budget}`, `${Math.ceil(timeLeft)}s`]}
			progress={timeLeft / DURATION}
			onPlay={start}
			onQuit={cancel}
			onPlayingChange={onPlayingChange}
		>
			<div className="flex h-full w-full items-center justify-center px-6">
				<div className="grid grid-cols-3 gap-3">
					{board.map((lit, i) => (
						<button
							// biome-ignore lint/suspicious/noArrayIndexKey: fixed 3×3 grid
							key={i}
							type="button"
							onPointerDown={() => tap(i)}
							className={clsx(
								"h-[min(24vw,110px)] w-[min(24vw,110px)] rounded-2xl border-2",
								lit
									? "border-[#ffd24d] bg-[#ffd24d]/25 shadow-[0_0_36px_rgba(255,210,77,0.45)]"
									: "border-line bg-card",
							)}
						>
							<span className={lit ? "" : "opacity-20"}>💡</span>
						</button>
					))}
				</div>
			</div>
		</GameChrome>
	);
}
