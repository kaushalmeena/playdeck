import clsx from "clsx";
import { useEffect, useRef, useState } from "react";
import { GameChrome } from "../components/game/GameChrome";
import type { GameMeta, GameProps } from "./kit";
import { randInt, useGameKeys, useRun } from "./kit";

export const meta: GameMeta = {
	title: "Tile Merge",
	emoji: "2️⃣",
	desc: "Swipe to merge matching tiles. Reach the target.",
	order: 26,
	accent: "#ff8a1e",
	instructions:
		"Swipe (or use the arrow keys) to slide every tile. Equal tiles merge into one — reach the target tile before the board jams up.",
};

export const SIZE = 4;
export type Board = Array<number>;
export type Dir = "left" | "right" | "up" | "down";

/** the goal tile for a level: 32, 64, 128 … capped so runs stay short */
export const targetFor = (level: number): number =>
	2 ** (4 + Math.min(level, 5));

/** collapse one line towards index 0, returning the new line and points won */
export function slideLine(line: ReadonlyArray<number>): {
	line: Array<number>;
	gained: number;
} {
	const filled = line.filter((v) => v !== 0);
	const out: Array<number> = [];
	let gained = 0;
	for (let i = 0; i < filled.length; i++) {
		if (filled[i] === filled[i + 1]) {
			const merged = filled[i] * 2;
			out.push(merged);
			gained += merged;
			i++; // the pair is consumed, so it cannot merge again this move
		} else {
			out.push(filled[i]);
		}
	}
	while (out.length < line.length) out.push(0);
	return { line: out, gained };
}

/** indices of each row/column, ordered so position 0 is where tiles pile up */
function lineIndices(dir: Dir): Array<Array<number>> {
	const lines: Array<Array<number>> = [];
	for (let i = 0; i < SIZE; i++) {
		const line: Array<number> = [];
		for (let j = 0; j < SIZE; j++) {
			if (dir === "left") line.push(i * SIZE + j);
			else if (dir === "right") line.push(i * SIZE + (SIZE - 1 - j));
			else if (dir === "up") line.push(j * SIZE + i);
			else line.push((SIZE - 1 - j) * SIZE + i);
		}
		lines.push(line);
	}
	return lines;
}

export function move(
	board: Board,
	dir: Dir,
): { board: Board; gained: number; moved: boolean } {
	const next = [...board];
	let gained = 0;
	for (const idx of lineIndices(dir)) {
		const { line, gained: g } = slideLine(idx.map((i) => board[i]));
		gained += g;
		idx.forEach((cell, k) => {
			next[cell] = line[k];
		});
	}
	return { board: next, gained, moved: next.some((v, i) => v !== board[i]) };
}

export const canMove = (board: Board): boolean =>
	(["left", "right", "up", "down"] as const).some((d) => move(board, d).moved);

export function spawn(board: Board): Board {
	const empty = board.flatMap((v, i) => (v === 0 ? [i] : []));
	if (empty.length === 0) return board;
	const next = [...board];
	next[empty[randInt(0, empty.length - 1)]] = Math.random() < 0.9 ? 2 : 4;
	return next;
}

export const newBoard = (): Board => spawn(spawn(Array(SIZE * SIZE).fill(0)));

const TILE_STYLES: Record<number, string> = {
	2: "bg-card text-muted border-line",
	4: "bg-card text-text border-line",
	8: "bg-[#ff8a1e]/20 text-[#ff8a1e] border-[#ff8a1e]/50",
	16: "bg-[#ff8a1e]/30 text-[#ff8a1e] border-[#ff8a1e]/70",
	32: "bg-[#ff5cd0]/25 text-[#ff5cd0] border-[#ff5cd0]/60",
	64: "bg-[#ff5cd0]/35 text-[#ff5cd0] border-[#ff5cd0]/80",
	128: "bg-accent/30 text-accent border-accent/70",
	256: "bg-accent/40 text-accent border-accent",
	512: "bg-accent2/30 text-accent2 border-accent2/70",
};
const tileStyle = (v: number) =>
	TILE_STYLES[v] ?? "bg-good/30 text-good border-good";

export default function TileMerge({
	level,
	active,
	onEnd,
	onPlayingChange,
}: GameProps) {
	const { playing, result, begin, finish, cancel } = useRun(onEnd);
	const target = targetFor(level);

	const [board, setBoard] = useState<Board>(() => Array(SIZE * SIZE).fill(0));
	const [score, setScore] = useState(0);
	const scoreRef = useRef(0);
	const touch = useRef<{ x: number; y: number } | null>(null);

	useEffect(() => {
		if (!active && playing) cancel();
	}, [active, playing, cancel]);

	const start = () => {
		setBoard(newBoard());
		scoreRef.current = 0;
		setScore(0);
		begin();
	};

	const push = (dir: Dir) => {
		if (!playing) return;
		setBoard((current) => {
			const { board: slid, gained, moved } = move(current, dir);
			if (!moved) return current;

			scoreRef.current += gained;
			setScore(scoreRef.current);

			if (slid.some((v) => v >= target)) {
				finish(true, scoreRef.current + target);
				return slid;
			}
			const next = spawn(slid);
			if (!canMove(next)) finish(false, scoreRef.current, "Board jammed");
			return next;
		});
	};

	useGameKeys(playing, {
		ArrowLeft: () => push("left"),
		a: () => push("left"),
		ArrowRight: () => push("right"),
		d: () => push("right"),
		ArrowUp: () => push("up"),
		w: () => push("up"),
		ArrowDown: () => push("down"),
		s: () => push("down"),
	});

	const best = Math.max(...board, 0);

	return (
		<GameChrome
			emoji={meta.emoji}
			title={meta.title}
			accent={meta.accent}
			level={level}
			instructions={meta.instructions}
			playing={playing}
			result={result}
			chips={[`${best}/${target}`, `${score} PTS`]}
			onPlay={start}
			onQuit={cancel}
			onPlayingChange={onPlayingChange}
		>
			<div
				className="flex h-full w-full touch-none items-center justify-center"
				onTouchStart={(e) => {
					touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
				}}
				onTouchEnd={(e) => {
					if (!touch.current) return;
					const dx = e.changedTouches[0].clientX - touch.current.x;
					const dy = e.changedTouches[0].clientY - touch.current.y;
					touch.current = null;
					if (Math.abs(dx) < 24 && Math.abs(dy) < 24) return;
					if (Math.abs(dx) > Math.abs(dy)) push(dx > 0 ? "right" : "left");
					else push(dy > 0 ? "down" : "up");
				}}
			>
				<div className="grid w-[min(84vw,380px)] grid-cols-4 gap-2.5">
					{board.map((value, i) => (
						<div
							// biome-ignore lint/suspicious/noArrayIndexKey: fixed 4×4 grid
							key={i}
							className={clsx(
								"flex aspect-square items-center justify-center rounded-xl border-2 font-black transition-colors duration-100",
								value === 0 ? "border-line/40 bg-card/30" : tileStyle(value),
								value >= 1000 ? "text-xl" : "text-2xl",
							)}
						>
							{value || ""}
						</div>
					))}
				</div>
			</div>
		</GameChrome>
	);
}
