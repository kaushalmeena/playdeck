/**
 * Progression gates: a starting set is free, and each spend of `WAVE_COST`
 * global points unlocks another wave of games.
 */
export const FREE_GAMES = 8;
export const WAVE_SIZE = 4;
export const WAVE_COST = 250;

/** how many games (by feed position) are playable at this score */
export function unlockedCount(total: number, gameCount: number): number {
	const waves = Math.floor(Math.max(total, 0) / WAVE_COST);
	return Math.min(FREE_GAMES + waves * WAVE_SIZE, gameCount);
}

/** total score needed to unlock the game at this feed position */
export function unlockThreshold(index: number): number {
	if (index < FREE_GAMES) return 0;
	return Math.ceil((index - FREE_GAMES + 1) / WAVE_SIZE) * WAVE_COST;
}

export const isUnlocked = (
	index: number,
	total: number,
	gameCount: number,
): boolean => index < unlockedCount(total, gameCount);
