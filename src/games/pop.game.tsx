import { useEffect, useRef, useState } from "react";
import { GameChrome } from "../components/game/GameChrome";
import type { GameMeta, GameProps } from "./kit";
import { randInt, useCountdown, useRun } from "./kit";

export const meta: GameMeta = {
	title: "Bubble Pop",
	emoji: "🫧",
	desc: "Pop the bubbles. Leave the bombs alone.",
	order: 14,
	accent: "#4d9fff",
	instructions:
		"Pop the quota of bubbles before time runs out. From level 3, bombs float up too — never pop those.",
};

const DURATION = 20;

type Bubble = {
	id: number;
	x: number;
	size: number;
	dur: number;
	bomb: boolean;
};

export default function BubblePop({
	level,
	active,
	onEnd,
	onPlayingChange,
}: GameProps) {
	const { playing, result, begin, finish, cancel } = useRun(onEnd);
	const goal = 10 + level * 2;
	const timeLeft = useCountdown(playing, DURATION);

	const [bubbles, setBubbles] = useState<Array<Bubble>>([]);
	const [pops, setPops] = useState(0);
	const popsRef = useRef(0);
	const nextId = useRef(0);

	useEffect(() => {
		if (playing && timeLeft <= 0)
			finish(false, popsRef.current * 8, "Time's up");
	}, [playing, timeLeft, finish]);
	useEffect(() => {
		if (!active && playing) cancel();
	}, [active, playing, cancel]);

	// spawner
	useEffect(() => {
		if (!playing) return;
		const t = setInterval(
			() => {
				setBubbles((bs) => {
					if (bs.length > 12) return bs;
					nextId.current += 1;
					return [
						...bs,
						{
							id: nextId.current,
							x: randInt(8, 88),
							size: randInt(52, 86),
							dur: Math.max(4.5 - level * 0.18, 2.2) + Math.random(),
							bomb: level >= 3 && Math.random() < 0.22,
						},
					];
				});
			},
			Math.max(700 - level * 30, 350),
		);
		return () => clearInterval(t);
	}, [playing, level]);

	const start = () => {
		setBubbles([]);
		popsRef.current = 0;
		setPops(0);
		begin();
	};

	const popBubble = (b: Bubble) => {
		if (!playing) return;
		if (b.bomb) {
			finish(false, popsRef.current * 8, "Boom");
			return;
		}
		setBubbles((bs) => bs.filter((x) => x.id !== b.id));
		popsRef.current += 1;
		setPops(popsRef.current);
		if (popsRef.current >= goal) {
			finish(true, goal * 8 + Math.ceil(timeLeft) * 2);
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
			chips={[`🫧 ${pops}/${goal}`, `${Math.ceil(timeLeft)}s`]}
			progress={timeLeft / DURATION}
			onPlay={start}
			onQuit={cancel}
			onPlayingChange={onPlayingChange}
		>
			<div className="relative h-full w-full overflow-hidden">
				{playing &&
					bubbles.map((b) => (
						<button
							key={b.id}
							type="button"
							onPointerDown={() => popBubble(b)}
							onAnimationEnd={() =>
								setBubbles((bs) => bs.filter((x) => x.id !== b.id))
							}
							className={`absolute flex items-center justify-center rounded-full border-2 ${
								b.bomb
									? "border-danger/70 bg-danger/15"
									: "border-accent2/60 bg-accent2/10"
							}`}
							style={{
								left: `${b.x}%`,
								bottom: -100,
								width: b.size,
								height: b.size,
								fontSize: b.size * 0.5,
								animation: `bubble-rise ${b.dur}s linear forwards`,
							}}
						>
							{b.bomb ? "💣" : "🫧"}
						</button>
					))}
			</div>
		</GameChrome>
	);
}
