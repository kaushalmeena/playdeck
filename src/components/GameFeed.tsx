import { useCallback, useEffect, useRef, useState } from "react";
import type { GameEntry } from "../games/registry";
import { store, usePlayerState } from "../lib/storage";
import { useTheme } from "../lib/theme";
import { GameCard } from "./GameCard";

type Tab = "all" | "favorites";

export function GameFeed({ games }: { games: Array<GameEntry> }) {
	const player = usePlayerState();
	const { theme, toggle } = useTheme();
	const [tab, setTab] = useState<Tab>("all");
	const [active, setActive] = useState(0);
	const [toast, setToast] = useState<string | null>(null);
	// id of the game with a live run — scrolling is locked while set
	const [playingId, setPlayingId] = useState<string | null>(null);

	const scrollerRef = useRef<HTMLDivElement>(null);
	const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
		undefined,
	);

	const list =
		tab === "all"
			? games
			: games.filter((g) => player.favorites.includes(g.id));

	// keep active index valid when the list shrinks (e.g. unfavoriting)
	const activeIndex = Math.min(active, Math.max(0, list.length - 1));
	const locked = playingId !== null;

	const nav = useCallback((dir: number) => {
		const el = scrollerRef.current;
		if (!el) return;
		const idx = Math.round(el.scrollTop / el.clientHeight) + dir;
		el.scrollTo({ top: idx * el.clientHeight, behavior: "smooth" });
	}, []);

	// one card per wheel gesture — otherwise trackpad/mouse momentum
	// flies through several screens at once
	const lastNavAt = useRef(0);
	const requestNav = useCallback(
		(dir: number) => {
			const now = performance.now();
			if (now - lastNavAt.current < 500) return;
			lastNavAt.current = now;
			nav(dir);
		},
		[nav],
	);

	const showToast = useCallback((text: string) => {
		setToast(text);
		clearTimeout(toastTimer.current);
		toastTimer.current = setTimeout(() => setToast(null), 2200);
	}, []);

	// sync active card with a restored scroll position on mount
	useEffect(() => {
		const el = scrollerRef.current;
		if (el && el.clientHeight > 0) {
			setActive(Math.round(el.scrollTop / el.clientHeight));
		}
	}, []);

	// take over wheel scrolling: page exactly one card per gesture
	useEffect(() => {
		const el = scrollerRef.current;
		if (!el) return;
		let lastWheelAt = 0;
		let gestureUsed = false;
		const onWheel = (e: WheelEvent) => {
			e.preventDefault();
			if (locked) return;
			const now = performance.now();
			if (now - lastWheelAt > 150) gestureUsed = false; // new gesture
			lastWheelAt = now;
			if (!gestureUsed && Math.abs(e.deltaY) > 4) {
				gestureUsed = true;
				requestNav(e.deltaY > 0 ? 1 : -1);
			}
		};
		el.addEventListener("wheel", onWheel, { passive: false });
		return () => el.removeEventListener("wheel", onWheel);
	}, [requestNav, locked]);

	// keyboard navigation (games own the arrow keys while a run is live)
	useEffect(() => {
		if (locked) return;
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "ArrowDown" || e.key === "PageDown") nav(1);
			else if (e.key === "ArrowUp" || e.key === "PageUp") nav(-1);
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [nav, locked]);

	const onScroll = () => {
		const el = scrollerRef.current;
		if (!el) return;
		const idx = Math.round(el.scrollTop / el.clientHeight);
		if (idx !== active) setActive(idx);
	};

	const switchTab = (next: Tab) => {
		setTab(next);
		setActive(0);
		scrollerRef.current?.scrollTo({ top: 0 });
	};

	const handleEnd = useCallback(
		(id: string) => (won: boolean, score: number) => {
			const level = store.recordEnd(id, won, score);
			if (won) showToast(`⬆ Level ${level} unlocked · +${score} pts`);
			else if (score > 0) showToast(`+${score} pts`);
		},
		[showToast],
	);

	const handlePlayingChange = useCallback(
		(id: string) => (playing: boolean) => {
			setPlayingId((cur) => {
				if (playing) return id;
				return cur === id ? null : cur;
			});
		},
		[],
	);

	return (
		<div className="relative h-full w-full bg-bg">
			{/* header */}
			<header className="pointer-events-none absolute inset-x-0 top-0 z-40 flex items-center justify-between bg-gradient-to-b from-bg/95 via-bg/60 to-transparent px-4 pt-3 pb-8">
				<div className="text-base font-black tracking-widest">
					🎮{" "}
					<span className="bg-linear-to-r from-accent to-accent2 bg-clip-text text-transparent">
						GAMESHORTS
					</span>
				</div>
				<nav className="pointer-events-auto flex gap-1 rounded-full border border-line bg-card/80 p-1 backdrop-blur-md">
					{(["all", "favorites"] as const).map((t) => (
						<button
							key={t}
							type="button"
							onClick={() => switchTab(t)}
							className={`cursor-pointer rounded-full px-3 py-1 text-xs font-bold tracking-wide transition-colors ${
								tab === t
									? "bg-linear-to-r from-accent to-accent2 text-white"
									: "text-muted"
							}`}
						>
							{t === "all" ? "All" : `♥ Favs (${player.favorites.length})`}
						</button>
					))}
				</nav>
				<div className="pointer-events-auto flex items-center gap-2">
					<div className="rounded-full border border-line bg-card/80 px-3 py-1.5 text-xs font-bold tracking-wider text-good backdrop-blur-md">
						🏆 {player.total.toLocaleString()}
					</div>
					<button
						type="button"
						onClick={toggle}
						aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
						className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-line bg-card/80 text-sm backdrop-blur-md transition-transform active:scale-90"
					>
						{theme === "dark" ? "🌙" : "☀️"}
					</button>
				</div>
			</header>

			{/* the feed */}
			<div
				ref={scrollerRef}
				onScroll={onScroll}
				className={`no-scrollbar h-full w-full snap-y snap-mandatory overscroll-contain ${
					locked ? "overflow-hidden" : "overflow-y-auto"
				}`}
			>
				{list.length === 0 ? (
					<div className="flex h-full flex-col items-center justify-center gap-3 text-center">
						<div className="text-6xl">💔</div>
						<p className="text-muted">
							No favorites yet — tap ♥ on a game to keep it here.
						</p>
					</div>
				) : (
					list.map((game, i) => (
						<GameCard
							key={game.id}
							game={game}
							mounted={Math.abs(i - activeIndex) <= 1}
							active={i === activeIndex}
							level={player.levels[game.id] ?? 1}
							best={player.best[game.id] ?? 0}
							isFavorite={player.favorites.includes(game.id)}
							onToggleFavorite={() => store.toggleFavorite(game.id)}
							onEnd={handleEnd(game.id)}
							onPlayingChange={handlePlayingChange(game.id)}
						/>
					))
				)}
			</div>

			{/* up / down nav buttons */}
			{list.length > 1 && !locked && (
				<div className="absolute top-1/2 right-3 z-40 flex -translate-y-1/2 flex-col gap-2">
					<button
						type="button"
						onClick={() => nav(-1)}
						disabled={activeIndex === 0}
						aria-label="Previous game"
						className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-line bg-card/70 text-sm backdrop-blur-md transition-opacity disabled:opacity-30"
					>
						▲
					</button>
					<button
						type="button"
						onClick={() => nav(1)}
						disabled={activeIndex >= list.length - 1}
						aria-label="Next game"
						className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-line bg-card/70 text-sm backdrop-blur-md transition-opacity disabled:opacity-30"
					>
						▼
					</button>
				</div>
			)}

			{/* toast */}
			{toast && (
				<output className="toast-in absolute top-16 left-1/2 z-50 -translate-x-1/2 rounded-full border border-accent/50 bg-card/95 px-5 py-2.5 text-sm font-bold shadow-[0_8px_32px_rgba(124,92,255,0.35)] backdrop-blur-md">
					{toast}
				</output>
			)}
		</div>
	);
}
