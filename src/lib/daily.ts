import type { GameEntry } from "../games/registry";

/** YYYY-MM-DD in local time — the key for today's challenge. */
export function dateKey(d = new Date()): string {
	const y = d.getFullYear();
	const m = String(d.getMonth() + 1).padStart(2, "0");
	const day = String(d.getDate()).padStart(2, "0");
	return `${y}-${m}-${day}`;
}

function hash(str: string): number {
	let h = 2166136261;
	for (let i = 0; i < str.length; i++) {
		h ^= str.charCodeAt(i);
		h = Math.imul(h, 16777619);
	}
	return h >>> 0;
}

function mulberry32(seed: number) {
	let a = seed;
	return () => {
		a |= 0;
		a = (a + 0x6d2b79f5) | 0;
		let t = Math.imul(a ^ (a >>> 15), 1 | a);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

export const DAILY_SIZE = 3;
export const DAILY_BONUS = 100;

/**
 * The same 3 games for everyone on a given date — seeded by the date.
 * Daily picks ignore progression locks: the daily unlocks them for a day.
 */
export function dailyGames(
	games: Array<GameEntry>,
	date = dateKey(),
): Array<GameEntry> {
	const rng = mulberry32(hash(date));
	const pool = [...games];
	// fix the target up front — `pool` shrinks as we draw from it
	const want = Math.min(DAILY_SIZE, pool.length);
	const picked: Array<GameEntry> = [];
	while (picked.length < want) {
		const i = Math.floor(rng() * pool.length);
		picked.push(pool.splice(i, 1)[0]);
	}
	return picked;
}
