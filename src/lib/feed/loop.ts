/**
 * Index maths for the endless feed.
 *
 * The feed is one long virtual list whose entries wrap onto the deck with a
 * modulo, so scrolling never reaches an end and there is no seam to hide. The
 * previous approach rendered the deck three times over and jumped the scroll
 * position between copies once it settled; this needs neither.
 */

/**
 * How many cards the virtual list claims to have.
 *
 * Browsers cap scroll height (~33m px in Chrome) and every card is one
 * viewport tall, so this has to stay well under it: 20k cards at a 1000px
 * viewport is 20m px, and 10k swipes either way is far past what anyone does
 * in a session.
 */
export const VIRTUAL_COUNT = 20_000;

/** a shorter deck cannot loop — there is nothing else to scroll to */
const MIN_LOOPABLE = 2;

/** how many cards to render for a deck of `len` */
export const virtualCount = (len: number): number =>
	len < MIN_LOOPABLE ? len : VIRTUAL_COUNT;

/**
 * Where the feed opens: the middle of the virtual list, nudged down so the
 * first card shown is the deck's first card rather than an arbitrary one.
 */
export function startIndex(len: number): number {
	if (len < MIN_LOOPABLE) return 0;
	const middle = Math.floor(VIRTUAL_COUNT / 2);
	return middle - (middle % len);
}

/** which entry of the deck a virtual index shows */
export const listIndex = (index: number, len: number): number =>
	len === 0 ? 0 : ((index % len) + len) % len;
