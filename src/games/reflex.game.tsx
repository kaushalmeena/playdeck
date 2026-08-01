import clsx from "clsx";
import { useCallback, useEffect, useRef, useState } from "react";
import { GameChrome } from "../components/game/GameChrome";
import type { GameMeta, GameProps } from "./kit";
import { useRun } from "./kit";

export const meta: GameMeta = {
	title: "Reflex Rush",
	emoji: "⚡",
	desc: "Wait for green. Tap fast. Don't jump the gun.",
	order: 1,
	accent: "#00b8d9",
	instructions:
		"Tap the circle the instant it turns green. Tap too early and it's over. 5 rounds.",
};

const ROUNDS = 5;
type PadState = "idle" | "wait" | "go";

export default function ReflexRush({
	level,
	active,
	onEnd,
	onPlayingChange,
}: GameProps) {
	const { playing, result, begin, finish, cancel } = useRun(onEnd);
	const [pad, setPad] = useState<PadState>("idle");
	const [padText, setPadText] = useState("READY");
	const [round, setRound] = useState(1);
	const [score, setScore] = useState(0);

	// run state that timers read/write without re-render races
	const run = useRef({ state: "idle" as PadState, score: 0, round: 1, t0: 0 });
	const timers = useRef<Array<ReturnType<typeof setTimeout>>>([]);
	const windowMs = Math.max(900 - (level - 1) * 70, 250);

	const clearTimers = useCallback(() => {
		for (const t of timers.current) clearTimeout(t);
		timers.current = [];
	}, []);
	const after = (ms: number, fn: () => void) =>
		timers.current.push(setTimeout(fn, ms));

	// cancel a live run when the card scrolls away; clean up on unmount
	useEffect(() => {
		if (!active && playing) {
			clearTimers();
			run.current.state = "idle";
			setPad("idle");
			setPadText("READY");
			cancel();
		}
	}, [active, playing, cancel, clearTimers]);
	useEffect(() => clearTimers, [clearTimers]);

	const setState = (s: PadState, text: string) => {
		run.current.state = s;
		setPad(s);
		setPadText(text);
	};

	const nextRound = () => {
		setRound(run.current.round);
		setState("wait", "WAIT…");
		after(800 + Math.random() * 1600, () => {
			setState("go", "TAP!");
			run.current.t0 = performance.now();
			after(windowMs, () => {
				setState("idle", "TOO SLOW");
				finish(false, run.current.score, "Too slow");
			});
		});
	};

	const start = () => {
		run.current = { state: "idle", score: 0, round: 1, t0: 0 };
		setScore(0);
		setRound(1);
		setState("idle", "GET READY");
		begin();
		after(500, nextRound);
	};

	const tap = () => {
		if (!playing) return;
		const r = run.current;
		if (r.state === "wait") {
			clearTimers();
			setState("idle", "TOO EARLY");
			finish(false, r.score, "Too early");
			return;
		}
		if (r.state === "go") {
			clearTimers();
			const rt = performance.now() - r.t0;
			r.score += Math.max(5, Math.round((windowMs - rt) / 10) + 10);
			setScore(r.score);
			setState("idle", `${Math.round(rt)}ms`);
			if (r.round >= ROUNDS) {
				finish(true, r.score);
			} else {
				r.round += 1;
				after(650, nextRound);
			}
		}
	};

	const padClasses =
		pad === "go"
			? "border-good bg-good/15 text-good shadow-[0_0_90px_rgba(61,255,160,0.45)]"
			: pad === "wait"
				? "border-danger bg-danger/15 text-danger shadow-[0_0_60px_rgba(255,77,109,0.3)]"
				: "border-line bg-card text-muted";

	return (
		<GameChrome
			emoji={meta.emoji}
			title={meta.title}
			accent={meta.accent}
			level={level}
			instructions={meta.instructions}
			playing={playing}
			result={result}
			chips={[`ROUND ${round}/${ROUNDS}`, `${score} PTS`]}
			onPlay={start}
			onQuit={() => {
				clearTimers();
				run.current.state = "idle";
				setPad("idle");
				setPadText("READY");
				cancel();
			}}
			onPlayingChange={onPlayingChange}
		>
			<div className="flex h-full w-full items-center justify-center">
				<button
					type="button"
					onPointerDown={tap}
					className={clsx(
						"flex h-[min(64vw,300px)] w-[min(64vw,300px)] cursor-pointer items-center justify-center rounded-full border-2 text-2xl font-black tracking-[0.2em] transition-[background,box-shadow] duration-100",
						padClasses,
					)}
				>
					{padText}
				</button>
			</div>
		</GameChrome>
	);
}
