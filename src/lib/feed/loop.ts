/**
 * Index math for the infinite feed.
 *
 * The list is rendered `COPIES` times back to back. The user always sits in
 * the middle copy; once scrolling settles in an outer copy we jump by one
 * list-length, which is visually identical and puts a full list of runway
 * back on both sides.
 */
export const COPIES = 3;

/** looping needs at least two cards, otherwise snap has nothing to move to */
export const isLooping = (len: number): boolean => len >= 2;

/** how many cards to actually render */
export const extentCount = (len: number): number =>
	isLooping(len) ? len * COPIES : len;

/** index the feed should open at */
export const startIndex = (len: number): number => (isLooping(len) ? len : 0);

/**
 * Where to jump so the given extended index sits in the middle copy,
 * or null when it already does (or looping is off).
 */
export function rebase(index: number, len: number): number | null {
	if (!isLooping(len)) return null;
	if (index < len) return index + len;
	if (index >= 2 * len) return index - len;
	return null;
}

/** which entry of the underlying list an extended index shows */
export const listIndex = (index: number, len: number): number =>
	len === 0 ? 0 : ((index % len) + len) % len;
