import { useEffect, useRef, useState } from "react";
import { GameChrome } from "../components/GameChrome";
import type { GameMeta, GameProps } from "./kit";
import { pick, randInt, shuffle, useCountdown, useRun } from "./kit";

export const meta: GameMeta = {
	title: "Color Hunt",
	emoji: "🌈",
	desc: "Tap every tile of the target color. Nothing else.",
	order: 22,
	accent: "#3dffa0",
	instructions:
		"Each wave names a color — tap all of its tiles in the grid. Tap a wrong color and the hunt is over.",
};

const PALETTE = [
	{ name: "GREEN", hex: "#3dffa0" },
	{ name: "BLUE", hex: "#4d9fff" },
	{ name: "PINK", hex: "#ff5cd0" },
	{ name: "YELLOW", hex: "#ffd24d" },
	{ name: "RED", hex: "#ff4d6d" },
	{ name: "PURPLE", hex: "#b06bff" },
];

const CELLS = 16;

type Wave = {
	target: { name: string; hex: string };
	tiles: Array<{ hex: string; wanted: boolean; found: boolean }>;
	left: number;
};

function genWave(level: number): Wave {
	const colors = shuffle(PALETTE).slice(
		0,
		3 + Math.min(Math.floor(level / 2), 3),
	);
	const target = pick(colors);
	const wantedCount = randInt(3, 5);
	const tiles = shuffle(
		Array.from({ length: CELLS }, (_, i) => {
			const wanted = i < wantedCount;
			return {
				hex: wanted
					? target.hex
					: pick(colors.filter((c) => c.name !== target.name)).hex,
				wanted,
				found: false,
			};
		}),
	);
	return { target, tiles, left: wantedCount };
}

export default function ColorHunt({
	level,
	active,
	onEnd,
	onPlayingChange,
}: GameProps) {
	const { playing, result, begin, finish, cancel } = useRun(onEnd);
	const waves = 3 + Math.min(level, 5);
	const total = waves * Math.max(5 - level * 0.2, 2.5);
	const timeLeft = useCountdown(playing, total);

	const [wave, setWave] = useState<Wave>(() => genWave(level));
	const done = useRef(0);
	const [doneCount, setDoneCount] = useState(0);

	useEffect(() => {
		if (playing && timeLeft <= 0) finish(false, done.current * 15, "Time's up");
	}, [playing, timeLeft, finish]);
	useEffect(() => {
		if (!active && playing) cancel();
	}, [active, playing, cancel]);

	const start = () => {
		done.current = 0;
		setDoneCount(0);
		setWave(genWave(level));
		begin();
	};

	const tap = (i: number) => {
		if (!playing) return;
		const t = wave.tiles[i];
		if (t.found) return;
		if (!t.wanted) {
			finish(false, done.current * 15, "Wrong color");
			return;
		}
		const tiles = wave.tiles.map((x, j) =>
			j === i ? { ...x, found: true } : x,
		);
		const left = wave.left - 1;
		if (left <= 0) {
			done.current += 1;
			setDoneCount(done.current);
			if (done.current >= waves) {
				finish(true, waves * 15 + Math.ceil(timeLeft) * 2);
				return;
			}
			setWave(genWave(level));
			return;
		}
		setWave({ ...wave, tiles, left });
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
			chips={[`WAVE ${doneCount + 1}/${waves}`, `${Math.ceil(timeLeft)}s`]}
			progress={timeLeft / total}
			onPlay={start}
			onQuit={cancel}
			onPlayingChange={onPlayingChange}
		>
			<div className="flex h-full w-full flex-col items-center justify-center gap-7 px-4">
				<div
					className="text-sm font-black tracking-[0.4em]"
					style={{ color: wave.target.hex }}
				>
					TAP ALL {wave.target.name}
				</div>
				<div className="grid w-[min(84vw,400px)] grid-cols-4 gap-2.5">
					{wave.tiles.map((t, i) => (
						<button
							// biome-ignore lint/suspicious/noArrayIndexKey: tiles regenerate per wave
							key={`${doneCount}-${i}`}
							type="button"
							onPointerDown={() => tap(i)}
							className={`aspect-square rounded-xl border border-line transition-opacity ${
								t.found ? "opacity-15" : ""
							}`}
							style={{ background: t.hex }}
						/>
					))}
				</div>
			</div>
		</GameChrome>
	);
}
