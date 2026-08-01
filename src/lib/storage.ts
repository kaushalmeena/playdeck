import { useSyncExternalStore } from "react";

const KEY = "playdeck:v1";

export type PlayerState = {
	favorites: Array<string>;
	/** current level per game id (starts at 1, +1 every win) */
	levels: Record<string, number>;
	/** best single-run score per game id */
	best: Record<string, number>;
	/** every run's score adds up here — the global score */
	total: number;
	/** finished runs per game id — powers the "For You" ordering */
	plays: Record<string, number>;
	/** daily challenge: dateKey -> game ids won that day */
	daily: Record<string, Array<string>>;
	/** daily-challenge streak */
	streak: { count: number; last: string };
};

const DEFAULT: PlayerState = {
	favorites: [],
	levels: {},
	best: {},
	total: 0,
	plays: {},
	daily: {},
	streak: { count: 0, last: "" },
};

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
	 * Record a finished run. `pts` (already combo-multiplied by the feed)
	 * adds to the global total, best is per-game, a win bumps the level.
	 * Returns the level after recording (for the level-up toast).
	 */
	recordEnd(id: string, won: boolean, pts: number): number {
		const s = load();
		const p = Math.max(0, Math.floor(pts) || 0);
		const level = (s.levels[id] ?? 1) + (won ? 1 : 0);
		commit({
			...s,
			total: s.total + p,
			best: { ...s.best, [id]: Math.max(s.best[id] ?? 0, p) },
			levels: { ...s.levels, [id]: level },
			plays: { ...s.plays, [id]: (s.plays[id] ?? 0) + 1 },
		});
		return level;
	},

	/** add bonus points to the global total (daily-completion reward) */
	addBonus(pts: number) {
		const s = load();
		commit({ ...s, total: s.total + pts });
	},

	/**
	 * Record a win inside the daily challenge. When it completes the full
	 * set for the day, bumps the streak and returns true (exactly once).
	 */
	recordDailyWin(date: string, id: string, required: Array<string>): boolean {
		const s = load();
		const won = s.daily[date] ?? [];
		if (won.includes(id)) return false;
		const nextWon = [...won, id];
		const completed = required.every((r) => nextWon.includes(r));
		const wasCompleted = required.every((r) => won.includes(r));

		let streak = s.streak;
		if (completed && !wasCompleted) {
			const yesterday = new Date(`${date}T12:00:00`);
			yesterday.setDate(yesterday.getDate() - 1);
			const yKey = yesterday.toISOString().slice(0, 10);
			streak = {
				count: s.streak.last === yKey ? s.streak.count + 1 : 1,
				last: date,
			};
		}
		commit({ ...s, daily: { ...s.daily, [date]: nextWon }, streak });
		return completed && !wasCompleted;
	},
};

export function usePlayerState(): PlayerState {
	return useSyncExternalStore(
		store.subscribe,
		store.getSnapshot,
		store.getServerSnapshot,
	);
}
