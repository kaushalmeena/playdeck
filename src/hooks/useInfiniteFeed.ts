import { useVirtualizer } from "@tanstack/react-virtual";
import {
	useCallback,
	useEffect,
	useLayoutEffect,
	useRef,
	useState,
} from "react";
import { startIndex, virtualCount } from "../lib/feed/loop";
import { WheelPager } from "../lib/feed/wheel";
import { sfx } from "../lib/sfx";

type Options = {
	/** number of cards in the deck */
	length: number;
	/** changes to this value re-home the feed (e.g. switching tabs) */
	resetKey: string;
	/** while true the feed ignores all input (a game owns the screen) */
	frozen: boolean;
};

export type FeedCard = {
	/** index within the virtual list */
	index: number;
	/** distance from the top of the scroller, in px */
	offset: number;
	size: number;
};

export type InfiniteFeed = {
	/** callback ref — the scroller only exists once the splash is gone */
	scrollerRef: (el: HTMLDivElement | null) => void;
	/** height of the spacer that gives the scroller its range */
	totalSize: number;
	/** the only cards in the DOM */
	cards: Array<FeedCard>;
	/** index of the card filling the screen */
	index: number;
	onScroll: () => void;
	/** move by one card */
	page: (dir: number) => void;
	/** jump back to the first card of the deck */
	rewind: () => void;
};

/**
 * Owns the shorts-style scroller: snap paging, keyboard and wheel input, and
 * virtualisation.
 *
 * The deck is presented as one very long list that wraps with a modulo, so
 * only a handful of cards exist in the DOM and there is no end to reach —
 * no repeated copies, and no scroll position to quietly correct afterwards.
 */
export function useInfiniteFeed({
	length,
	resetKey,
	frozen,
}: Options): InfiniteFeed {
	const scrollerRef = useRef<HTMLDivElement>(null);
	const [cardHeight, setCardHeight] = useState(0);
	const [index, setIndexState] = useState(() => startIndex(length));
	const indexRef = useRef(index);
	const pager = useRef(new WheelPager());

	// read through a ref so input handlers see the live value immediately —
	// a game must never lose a keystroke to the feed on the render it starts
	const frozenRef = useRef(frozen);
	frozenRef.current = frozen;

	const count = virtualCount(length);
	const home = startIndex(length);

	const setIndex = useCallback((i: number) => {
		indexRef.current = i;
		setIndexState(i);
	}, []);

	/**
	 * Every card is exactly one viewport tall, which is what lets snapping and
	 * paging agree — so the viewport has to be measured before anything can be
	 * positioned.
	 *
	 * This is a callback ref rather than an effect because the scroller does not
	 * exist while the splash is up: an effect would run once against nothing and
	 * never fire again.
	 */
	const observer = useRef<ResizeObserver | null>(null);
	const attachScroller = useCallback((el: HTMLDivElement | null) => {
		observer.current?.disconnect();
		scrollerRef.current = el;

		if (!el) {
			setCardHeight(0);
			return;
		}
		setCardHeight(el.clientHeight);
		observer.current = new ResizeObserver(() => setCardHeight(el.clientHeight));
		observer.current.observe(el);
	}, []);

	useEffect(() => () => observer.current?.disconnect(), []);

	const virtualizer = useVirtualizer({
		// stays empty until the viewport is measured — sizing items before then
		// caches a 1px height that the range calculation never recovers from
		count: cardHeight ? count : 0,
		getScrollElement: () => scrollerRef.current,
		estimateSize: () => cardHeight,
		overscan: 2,
	});

	// card size is the viewport, so a resize invalidates every measurement
	useLayoutEffect(() => {
		if (cardHeight) virtualizer.measure();
	}, [cardHeight, virtualizer]);

	/**
	 * Jump straight to a card.
	 *
	 * Mandatory scroll-snap can only snap to cards that exist, and only a
	 * handful do — so assigning a far-away scrollTop gets yanked back to a
	 * rendered one. Turning snap off for the assignment lets the virtualiser
	 * see the new offset and render there before snapping resumes.
	 */
	const jumpTo = useCallback(
		(i: number) => {
			const el = scrollerRef.current;
			if (!el || !cardHeight) return;
			el.style.scrollSnapType = "none";
			el.scrollTop = i * cardHeight;
			setIndex(i);
			requestAnimationFrame(() => {
				el.style.scrollSnapType = "";
			});
		},
		[cardHeight, setIndex],
	);

	/**
	 * Open in the middle of the virtual list, once per deck.
	 *
	 * This waits for the spacer to actually be tall enough: setting scrollTop
	 * beyond the current scroll range just gets clamped to 0, and the spacer only
	 * reaches full height a render after the viewport is measured.
	 */
	const totalSize = virtualizer.getTotalSize();
	const homedFor = useRef<string | null>(null);

	useLayoutEffect(() => {
		const el = scrollerRef.current;
		if (!el || !cardHeight) return;
		if (totalSize < (home + 1) * cardHeight) return;
		if (homedFor.current === resetKey) return;

		homedFor.current = resetKey;
		pager.current.reset();
		jumpTo(home);
	}, [resetKey, home, cardHeight, totalSize, jumpTo]);

	const onScroll = useCallback(() => {
		const el = scrollerRef.current;
		if (!el || !cardHeight) return;
		const current = Math.round(el.scrollTop / cardHeight);
		if (current !== indexRef.current) setIndex(current);
	}, [cardHeight, setIndex]);

	const page = useCallback(
		(dir: number) => {
			const el = scrollerRef.current;
			if (!el || !cardHeight) return;
			const target = Math.round(el.scrollTop / cardHeight) + dir;
			if (target < 0 || target >= count) return;
			sfx.swipe(dir);
			el.scrollTo({ top: target * cardHeight, behavior: "smooth" });
		},
		[cardHeight, count],
	);

	const rewind = useCallback(() => {
		pager.current.reset();
		jumpTo(home);
	}, [home, jumpTo]);

	// wheel / trackpad → discrete pages
	useEffect(() => {
		const el = scrollerRef.current;
		if (!el) return;
		const onWheel = (e: WheelEvent) => {
			e.preventDefault();
			if (frozenRef.current) return;
			const step = pager.current.feed(e.deltaY, performance.now());
			if (step) page(step);
		};
		el.addEventListener("wheel", onWheel, { passive: false });
		return () => el.removeEventListener("wheel", onWheel);
	}, [page]);

	// keyboard — a running game claims these keys first (see useGameKeys),
	// so anything reaching us here is meant for the feed
	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			if (frozenRef.current) return;
			const target = e.target;
			if (target instanceof HTMLElement && target.tagName === "BUTTON") return;

			const dir =
				e.key === "ArrowDown" || e.key === "PageDown" || e.code === "Space"
					? 1
					: e.key === "ArrowUp" || e.key === "PageUp"
						? -1
						: 0;
			if (!dir) return;
			e.preventDefault();
			page(dir);
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [page]);

	return {
		scrollerRef: attachScroller,
		totalSize,
		// nothing can be positioned until the viewport has been measured
		cards: cardHeight
			? virtualizer.getVirtualItems().map((item) => ({
					index: item.index,
					offset: item.start,
					size: item.size,
				}))
			: [],
		index,
		onScroll,
		page,
		rewind,
	};
}
