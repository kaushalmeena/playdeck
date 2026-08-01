import { useCallback, useEffect, useRef, useState } from "react";

/** Static metadata every game module exports as `meta`. */
export type GameMeta = {
	title: string;
	emoji: string;
	/** one-liner shown on the feed card */
	desc: string;
	/** feed position (ascending) */
	order: number;
	/** accent color for this game's chrome */
	accent?: string;
	/** how-to-play text shown on the start overlay */
	instructions: string;
};

/** Props the feed passes to every game component. */
export type GameProps = {
	/** current level for this game — scale your difficulty from it */
	level: number;
	/** false when the card is scrolled away; cancel any running game */
	active: boolean;
	/** call exactly once per run — score adds to the global total, a win bumps the level */
	onEnd: (won: boolean, score: number) => void;
	/** lets the feed lock scrolling while a run is live */
	onPlayingChange?: (playing: boolean) => void;
};

export type GameResult = {
	won: boolean;
	score: number;
	/** optional flavor text ("Crashed", "Too early…") shown instead of the default */
	note?: string;
} | null;

/**
 * Run lifecycle shared by all games:
 * menu → begin() → playing → finish(won, score) → result overlay → begin() …
 * cancel() aborts silently (used when the card scrolls away).
 */
export function useRun(onEnd: GameProps["onEnd"]) {
	const [playing, setPlaying] = useState(false);
	const [result, setResult] = useState<GameResult>(null);

	const begin = useCallback(() => setPlaying(true), []);
	const cancel = useCallback(() => setPlaying(false), []);
	const finish = useCallback(
		(won: boolean, score: number, note?: string) => {
			setPlaying(false);
			setResult({ won, score, note });
			onEnd(won, score);
		},
		[onEnd],
	);

	return { playing, result, begin, finish, cancel };
}

/**
 * Keyboard controls for a running game.
 *
 * Listens in the capture phase and stops handled keys from propagating, so a
 * game always wins the arrow/space keys over the feed's paging — no reliance
 * on the feed noticing that a run started. Keys are matched against both
 * `event.key` ("ArrowUp", "w") and `event.code` ("Space").
 */
export function useGameKeys(
	active: boolean,
	handlers: Record<string, () => void>,
) {
	const latest = useRef(handlers);
	latest.current = handlers;

	useEffect(() => {
		if (!active) return;
		const onKey = (e: KeyboardEvent) => {
			const fn = latest.current[e.key] ?? latest.current[e.code];
			if (!fn) return;
			e.preventDefault();
			e.stopPropagation();
			fn();
		};
		window.addEventListener("keydown", onKey, { capture: true });
		return () =>
			window.removeEventListener("keydown", onKey, { capture: true });
	}, [active]);
}

/** setTimeout collection that self-cleans on unmount. */
export function useTimers() {
	const timers = useRef<Array<ReturnType<typeof setTimeout>>>([]);
	const after = useCallback((ms: number, fn: () => void) => {
		const id = setTimeout(fn, ms);
		timers.current.push(id);
		return id;
	}, []);
	const clearAll = useCallback(() => {
		for (const t of timers.current) clearTimeout(t);
		timers.current = [];
	}, []);
	useEffect(() => clearAll, [clearAll]);
	return { after, clearAll };
}

/**
 * Countdown that (re)starts every time `playing` flips true.
 * Watch for `timeLeft === 0` in an effect to end the run.
 */
export function useCountdown(playing: boolean, total: number): number {
	const [timeLeft, setTimeLeft] = useState(total);
	useEffect(() => {
		if (!playing) return;
		setTimeLeft(total);
		const started = performance.now();
		const t = setInterval(() => {
			setTimeLeft(Math.max(total - (performance.now() - started) / 1000, 0));
		}, 100);
		return () => clearInterval(t);
	}, [playing, total]);
	return timeLeft;
}

export const randInt = (min: number, max: number): number =>
	min + Math.floor(Math.random() * (max - min + 1));

export const shuffle = <T>(arr: ReadonlyArray<T>): Array<T> =>
	arr
		.map((v) => [Math.random(), v] as const)
		.sort((a, b) => a[0] - b[0])
		.map(([, v]) => v);

export const pick = <T>(arr: ReadonlyArray<T>): T =>
	arr[Math.floor(Math.random() * arr.length)];
