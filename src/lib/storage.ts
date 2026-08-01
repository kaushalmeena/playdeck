import { useSyncExternalStore } from "react";

const KEY = "game-shorts:v1";

export type PlayerState = {
	favorites: Array<string>;
	/** current level per game id (starts at 1, +1 every win) */
	levels: Record<string, number>;
	/** best single-run score per game id */
	best: Record<string, number>;
	/** every run's score adds up here — the global score */
	total: number;
};

const DEFAULT: PlayerState = { favorites: [], levels: {}, best: {}, total: 0 };

let state: PlayerState = DEFAULT;
let loaded = false;
const listeners = new Set<() => void>();

function load(): PlayerState {
	if (!loaded && typeof localStorage !== "undefined") {
		loaded = true;
		try {
			const raw = localStorage.getItem(KEY);
			if (raw) state = { ...DEFAULT, ...JSON.parse(raw) };
		} catch {
			state = DEFAULT;
		}
	}
	return state;
}

function commit(next: PlayerState) {
	state = next;
	try {
		localStorage.setItem(KEY, JSON.stringify(next));
	} catch {
		// storage full / private mode — keep in-memory state
	}
	for (const l of listeners) l();
}

export const store = {
	subscribe(l: () => void) {
		listeners.add(l);
		return () => listeners.delete(l);
	},
	getSnapshot: (): PlayerState => load(),
	getServerSnapshot: (): PlayerState => DEFAULT,

	levelOf: (id: string) => load().levels[id] ?? 1,

	toggleFavorite(id: string) {
		const s = load();
		commit({
			...s,
			favorites: s.favorites.includes(id)
				? s.favorites.filter((f) => f !== id)
				: [...s.favorites, id],
		});
	},

	/**
	 * Record a finished run. Score always adds to the global total,
	 * best is per-game, and a win bumps the game's level.
	 * Returns the level after recording (for the level-up toast).
	 */
	recordEnd(id: string, won: boolean, score: number): number {
		const s = load();
		const pts = Math.max(0, Math.floor(score) || 0);
		const level = (s.levels[id] ?? 1) + (won ? 1 : 0);
		commit({
			...s,
			total: s.total + pts,
			best: { ...s.best, [id]: Math.max(s.best[id] ?? 0, pts) },
			levels: { ...s.levels, [id]: level },
		});
		return level;
	},
};

export function usePlayerState(): PlayerState {
	return useSyncExternalStore(
		store.subscribe,
		store.getSnapshot,
		store.getServerSnapshot,
	);
}
