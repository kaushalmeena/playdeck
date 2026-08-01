import { useCallback, useEffect, useRef, useState } from "react";
import { GameChrome } from "../components/GameChrome";
import type { GameMeta, GameProps } from "./kit";
import { useRun } from "./kit";

export const meta: GameMeta = {
	title: "Echo Pads",
	emoji: "🎵",
	desc: "Watch the pattern. Play it back. It only gets longer.",
	order: 5,
	accent: "#7c5cff",
	instructions:
		"Watch the pads light up, then repeat the pattern. Each round adds one more step.",
};

const PADS = ["#7c5cff", "#00e5ff", "#ff5cd0", "#3dffa0"];
const FREQ = [261.6, 329.6, 392.0, 523.3];

export default function EchoPads({
	level,
	active,
	onEnd,
	onPlayingChange,
}: GameProps) {
	const { playing, result, begin, finish, cancel } = useRun(onEnd);
	const target = 2 + level;
	const step = Math.max(650 - level * 35, 280);

	const [lit, setLit] = useState(-1);
	const [status, setStatus] = useState("");
	const [seqLen, setSeqLen] = useState(0);

	const run = useRef({ seq: [] as Array<number>, pos: 0, inputOk: false });
	const timers = useRef<Array<ReturnType<typeof setTimeout>>>([]);
	const audio = useRef<AudioContext | null>(null);

	const after = (ms: number, fn: () => void) =>
		timers.current.push(setTimeout(fn, ms));
	const clearTimers = useCallback(() => {
		for (const t of timers.current) clearTimeout(t);
		timers.current = [];
	}, []);
	useEffect(() => clearTimers, [clearTimers]);

	const tone = (i: number, dur: number) => {
		try {
			audio.current = audio.current ?? new AudioContext();
			const ac = audio.current;
			const o = ac.createOscillator();
			const g = ac.createGain();
			o.type = "triangle";
			o.frequency.value = FREQ[i];
			g.gain.setValueAtTime(0.18, ac.currentTime);
			g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + dur / 1000);
			o.connect(g);
			g.connect(ac.destination);
			o.start();
			o.stop(ac.currentTime + dur / 1000);
		} catch {
			// audio blocked — play silently
		}
	};

	const light = (i: number, dur: number) => {
		setLit(i);
		tone(i, dur);
		after(dur, () => setLit(-1));
	};

	const playback = () => {
		const r = run.current;
		r.inputOk = false;
		setStatus("WATCH");
		r.seq.forEach((p, i) => {
			after(400 + i * step, () => light(p, step * 0.55));
		});
		after(400 + r.seq.length * step, () => {
			r.pos = 0;
			r.inputOk = true;
			setStatus("YOUR TURN");
		});
	};

	const nextRound = () => {
		const r = run.current;
		r.seq.push((Math.random() * 4) | 0);
		setSeqLen(r.seq.length);
		playback();
	};

	const start = () => {
		run.current = { seq: [], pos: 0, inputOk: false };
		setSeqLen(0);
		setStatus("");
		begin();
		after(600, nextRound);
	};

	// cancel when scrolled away
	useEffect(() => {
		if (!active && playing) {
			clearTimers();
			setLit(-1);
			cancel();
		}
	}, [active, playing, cancel, clearTimers]);

	const tap = (i: number) => {
		const r = run.current;
		if (!playing || !r.inputOk) return;
		light(i, 180);
		if (i !== r.seq[r.pos]) {
			clearTimers();
			finish(false, (r.seq.length - 1) * 15, "Wrong pad");
			return;
		}
		r.pos += 1;
		if (r.pos >= r.seq.length) {
			r.inputOk = false;
			if (r.seq.length >= target) {
				finish(true, r.seq.length * 15 + 10);
				return;
			}
			setStatus("NICE!");
			after(700, nextRound);
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
				`SEQ ${Math.min(seqLen, target)}/${target}`,
				`${Math.max(seqLen - 1, 0) * 15} PTS`,
			]}
			onPlay={start}
			onPlayingChange={onPlayingChange}
		>
			<div className="flex h-full w-full flex-col items-center justify-center gap-5">
				<div className="h-5 text-[13px] font-extrabold tracking-[0.3em] text-muted">
					{playing ? status : ""}
				</div>
				<div className="grid grid-cols-2 gap-3.5">
					{PADS.map((color, i) => (
						<button
							// biome-ignore lint/suspicious/noArrayIndexKey: pads are a fixed set
							key={i}
							type="button"
							onPointerDown={() => tap(i)}
							className={`h-[min(34vw,150px)] w-[min(34vw,150px)] cursor-pointer rounded-3xl border-2 border-line transition-all duration-100 active:scale-95 ${
								lit === i ? "scale-105 opacity-100" : "opacity-75"
							}`}
							style={{
								background: color,
								boxShadow: lit === i ? `0 0 44px ${color}` : "none",
							}}
						/>
					))}
				</div>
			</div>
		</GameChrome>
	);
}
