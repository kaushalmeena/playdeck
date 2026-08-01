import {
	useCallback,
	useEffect,
	useLayoutEffect,
	useRef,
	useState,
} from "react";
import { extentCount, rebase, startIndex } from "../lib/feed/loop";
import { WheelPager } from "../lib/feed/wheel";

type Options = {
	/** number of cards in the visible list */
	length: number;
	/** changes to this value re-home the feed (e.g. switching tabs) */
	resetKey: string;
	/** while true the feed ignores all input (a game owns the screen) */
	frozen: boolean;
};

export type InfiniteFeed = {
	scrollerRef: React.RefObject<HTMLDivElement | null>;
	/** index within the extended (repeated) list */
	index: number;
	/** how many cards to render */
	extent: number;
	onScroll: () => void;
	/** move by one card, honouring the wheel cooldown */
	page: (dir: number) => void;
	/** jump back to the first card of the list */
	rewind: () => void;
};

/**
 * Owns the shorts-style scroller: snap paging, keyboard/wheel input and the
 * seamless wrap between repeated copies of the list.
 */
export function useInfiniteFeed({
	length,
	resetKey,
	frozen,
}: Options): InfiniteFeed {
	const scrollerRef = useRef<HTMLDivElement>(null);
	const [index, setIndexState] = useState(() => startIndex(length));
	const indexRef = useRef(index);
	const settleTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
		undefined,
	);
	const pager = useRef(new WheelPager());

	// read through a ref so input handlers see the live value immediately —
	// a game must never lose a keystroke to the feed on the render it starts
	const frozenRef = useRef(frozen);
	frozenRef.current = frozen;

	const extent = extentCount(length);
	const home = startIndex(length);

	const setIndex = useCallback((i: number) => {
		indexRef.current = i;
		setIndexState(i);
	}, []);

	const jumpTo = useCallback(
		(i: number) => {
			const el = scrollerRef.current;
			if (!el) return;
			el.scrollTop = i * el.clientHeight;
			setIndex(i);
		},
		[setIndex],
	);

	// re-home whenever the visible list changes identity or size
	// biome-ignore lint/correctness/useExhaustiveDependencies: resetKey is the intent
	useLayoutEffect(() => {
		pager.current.reset();
		jumpTo(home);
	}, [resetKey, home, jumpTo]);

	// keep the card aligned when the viewport resizes
	useEffect(() => {
		const onResize = () => {
			const el = scrollerRef.current;
			if (el) el.scrollTop = indexRef.current * el.clientHeight;
		};
		window.addEventListener("resize", onResize);
		return () => window.removeEventListener("resize", onResize);
	}, []);

	/** once scrolling settles in an outer copy, hop back to the middle one */
	const normalize = useCallback(() => {
		const el = scrollerRef.current;
		if (!el) return;
		const h = el.clientHeight;
		if (!h) return;
		const current = Math.round(el.scrollTop / h);
		const next = rebase(current, length);
		if (next === null) {
			// re-align any sub-pixel drift so paging stays exact
			if (el.scrollTop !== current * h) el.scrollTop = current * h;
			setIndex(current);
			return;
		}
		el.scrollTop = next * h;
		setIndex(next);
	}, [length, setIndex]);

	const onScroll = useCallback(() => {
		const el = scrollerRef.current;
		if (!el || !el.clientHeight) return;
		const current = Math.round(el.scrollTop / el.clientHeight);
		if (current !== indexRef.current) setIndex(current);
		clearTimeout(settleTimer.current);
		settleTimer.current = setTimeout(normalize, 120);
	}, [normalize, setIndex]);

	useEffect(() => () => clearTimeout(settleTimer.current), []);

	const page = useCallback((dir: number) => {
		const el = scrollerRef.current;
		if (!el || !el.clientHeight) return;
		const target = Math.round(el.scrollTop / el.clientHeight) + dir;
		el.scrollTo({ top: target * el.clientHeight, behavior: "smooth" });
	}, []);

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

	return { scrollerRef, index, extent, onScroll, page, rewind };
}
