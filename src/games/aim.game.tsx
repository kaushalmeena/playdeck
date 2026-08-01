import { useEffect, useRef, useState } from "react";
import { GameChrome } from "../components/GameChrome";
import type { GameMeta, GameProps } from "./kit";
import { randInt, useRun, useTimers } from "./kit";

export const meta: GameMeta = {
	title: "Quick Shot",
	emoji: "🏹",
	desc: "Targets shrink fast. Hit every one.",
	order: 18,
	accent: "#ff4d6d",
	instructions:
		"Targets appear one at a time and shrink away. Hit the quota — if a single target vanishes, the run is over.",
};

type Target = { id: number; x: number; y: number };

export default function QuickShot({
	level,
	active,
	onEnd,
	onPlayingChange,
}: GameProps) {
	const { playing, result, begin, finish, cancel } = useRun(onEnd);
	const { after, clearAll } = useTimers();
	const goal = 8 + level;
	const life = Math.max(1600 - level * 80, 700);

	const [target, setTarget] = useState<Target | null>(null);
	const [hits, setHits] = useState(0);
	const hitsRef = useRef(0);
	const nextId = useRef(0);

	useEffect(() => {
		if (!active && playing) {
			clearAll();
			cancel();
		}
	}, [active, playing, cancel, clearAll]);

	const spawn = () => {
		nextId.current += 1;
		setTarget({ id: nextId.current, x: randInt(14, 86), y: randInt(20, 80) });
		after(life, () => {
			finish(false, hitsRef.current * 12, "Target escaped");
		});
	};

	const start = () => {
		hitsRef.current = 0;
		setHits(0);
		begin();
		spawn();
	};

	const hit = () => {
		if (!playing) return;
		clearAll();
		hitsRef.current += 1;
		setHits(hitsRef.current);
		if (hitsRef.current >= goal) {
			setTarget(null);
			finish(true, goal * 12 + 20);
			return;
		}
		spawn();
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
			chips={[`🎯 ${hits}/${goal}`]}
			onPlay={start}
			onQuit={() => {
				clearAll();
				cancel();
			}}
			onPlayingChange={onPlayingChange}
		>
			<div className="relative h-full w-full overflow-hidden">
				{playing && target && (
					<button
						key={target.id}
						type="button"
						aria-label="Target"
						onPointerDown={hit}
						className="absolute flex h-24 w-24 items-center justify-center rounded-full border-4 border-danger bg-danger/20 text-3xl shadow-[0_0_40px_rgba(255,77,109,0.5)]"
						style={{
							left: `${target.x}%`,
							top: `${target.y}%`,
							animation: `target-shrink ${life}ms linear forwards`,
						}}
					>
						🎯
					</button>
				)}
			</div>
		</GameChrome>
	);
}
