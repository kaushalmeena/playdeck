import {
	useCallback,
	useEffect,
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { Toaster, toast } from "sonner";
import type { GameEntry } from "../games/registry";
import { celebrateDaily, celebrateLevelUp } from "../lib/celebrate";
import { DAILY_BONUS, dailyGames, dateKey } from "../lib/daily";
import { sfx } from "../lib/sfx";
import { shareDailyCard } from "../lib/share";
import { store, usePlayerState } from "../lib/storage";
import { useTheme } from "../lib/theme";
import { GameCard } from "./GameCard";

type Tab = "all" | "foryou" | "favorites" | "daily";

const TABS: Array<{ id: Tab; label: string }> = [
	{ id: "all", label: "All" },
	{ id: "foryou", label: "You" },
	{ id: "favorites", label: "♥" },
	{ id: "daily", label: "📅" },
];

/** games unlock in waves of 4 as the global total grows */
const FREE_GAMES = 8;
const WAVE_SIZE = 4;
const WAVE_COST = 250;

export function GameFeed({ games }: { games: Array<GameEntry> }) {
	const player = usePlayerState();
	const { theme, toggle } = useTheme();
	const [tab, setTab] = useState<Tab>("all");
	const [extIdx, setExtIdx] = useState(0);
	const [playingId, setPlayingId] = useState<string | null>(null);
	const [combo, setCombo] = useState(0);

	const scrollerRef = useRef<HTMLDivElement>(null);
	const extIdxRef = useRef(0);
	const settleTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
		undefined,
	);
	const comboRef = useRef(0);

	const today = dateKey();
	const daily = dailyGames(games, today);
	const dailyIds = daily.map((g) => g.id);
	const dailyWon = player.daily[today] ?? [];
	const dailyComplete = dailyIds.every((id) => dailyWon.includes(id));

	// progression gates (by position in the ordered "all" list)
	const unlockedCount = Math.min(
		FREE_GAMES + Math.floor(player.total / WAVE_COST) * WAVE_SIZE,
		games.length,
	);
	const lockIndex = new Map(games.map((g, i) => [g.id, i]));
	const isLocked = (id: string) =>
		tab !== "daily" && (lockIndex.get(id) ?? 0) >= unlockedCount;
	const unlockAt = (id: string) => {
		const idx = lockIndex.get(id) ?? 0;
		return Math.ceil((idx - FREE_GAMES + 1) / WAVE_SIZE) * WAVE_COST;
	};

	const weight = (g: GameEntry) =>
		(player.plays[g.id] ?? 0) * 2 +
		(player.favorites.includes(g.id) ? 8 : 0) +
		(player.best[g.id] ?? 0) / 50;

	const list =
		tab === "all"
			? games
			: tab === "foryou"
				? games
						.filter((g) => !isLocked(g.id))
						.sort((a, b) => weight(b) - weight(a))
				: tab === "favorites"
					? games.filter((g) => player.favorites.includes(g.id))
					: daily;

	const L = list.length;
	const loop = L >= 2;
	const ext = loop ? 3 * L : L;
	const startIdx = loop ? L : 0;

	const setIdx = useCallback((i: number) => {
		extIdxRef.current = i;
		setExtIdx(i);
	}, []);

	// position at the middle copy whenever the visible list changes
	// biome-ignore lint/correctness/useExhaustiveDependencies: reposition only on list identity change
	useLayoutEffect(() => {
		const el = scrollerRef.current;
		if (!el) return;
		el.scrollTop = startIdx * el.clientHeight;
		setIdx(startIdx);
	}, [tab, L, startIdx]);

	// keep alignment on resize
	useEffect(() => {
		const onResize = () => {
			const el = scrollerRef.current;
			if (el) el.scrollTop = extIdxRef.current * el.clientHeight;
		};
		window.addEventListener("resize", onResize);
		return () => window.removeEventListener("resize", onResize);
	}, []);

	// seamless infinite loop: after scrolling settles in an outer copy,
	// jump (instantly, invisibly) back to the middle copy
	const normalize = useCallback(() => {
		const el = scrollerRef.current;
		if (!el || !loop) return;
		const h = el.clientHeight;
		const idx = Math.round(el.scrollTop / h);
		if (idx < L) {
			el.scrollTop = (idx + L) * h;
			setIdx(idx + L);
		} else if (idx >= 2 * L) {
			el.scrollTop = (idx - L) * h;
			setIdx(idx - L);
		}
	}, [loop, L, setIdx]);

	const onScroll = () => {
		const el = scrollerRef.current;
		if (!el) return;
		const idx = Math.round(el.scrollTop / el.clientHeight);
		if (idx !== extIdxRef.current) setIdx(idx);
		clearTimeout(settleTimer.current);
		settleTimer.current = setTimeout(normalize, 120);
	};

	const nav = useCallback((dir: number) => {
		const el = scrollerRef.current;
		if (!el) return;
		const idx = Math.round(el.scrollTop / el.clientHeight) + dir;
		el.scrollTo({ top: idx * el.clientHeight, behavior: "smooth" });
	}, []);

	// one card per wheel gesture — otherwise trackpad momentum flies
	// through several screens at once
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

	const locked = playingId !== null;

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

	// keyboard: arrows + space page the feed (games own keys while playing)
	useEffect(() => {
		if (locked) return;
		const onKey = (e: KeyboardEvent) => {
			if (e.target instanceof HTMLElement && e.target.tagName === "BUTTON")
				return;
			if (e.key === "ArrowDown" || e.key === "PageDown") nav(1);
			else if (e.key === "ArrowUp" || e.key === "PageUp") nav(-1);
			else if (e.code === "Space") {
				e.preventDefault();
				nav(1);
			}
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [nav, locked]);

	const goTo = (nextTab: Tab) => {
		setTab(nextTab);
		const el = scrollerRef.current;
		if (el && nextTab === tab) {
			// same tab (e.g. logo click) — just rewind to the first card
			el.scrollTop = startIdx * el.clientHeight;
			setIdx(startIdx);
		}
	};

	// run-end logic lives in a ref so the per-game callbacks handed to the
	// (memoized) game components keep a stable identity across re-renders —
	// otherwise a feed re-render would restart canvas game loops mid-run
	const endLogic = useRef<(id: string, won: boolean, raw: number) => void>(
		() => {},
	);
	endLogic.current = (id, won, raw) => {
		const mult = 1 + 0.25 * Math.min(comboRef.current, 8);
		const pts = Math.round(raw * mult);
		const level = store.recordEnd(id, won, pts);
		comboRef.current = won ? comboRef.current + 1 : 0;
		setCombo(comboRef.current);

		if (won) {
			sfx.levelUp();
			celebrateLevelUp();
			toast.success(
				`⬆ Level ${level} unlocked · +${pts} pts${mult > 1 ? ` (x${mult.toFixed(2)})` : ""}`,
			);
		} else {
			sfx.lose();
			if (pts > 0) toast(`+${pts} pts`);
		}

		if (won && dailyIds.includes(id)) {
			const completedNow = store.recordDailyWin(today, id, dailyIds);
			if (completedNow) {
				store.addBonus(DAILY_BONUS);
				sfx.daily();
				celebrateDaily();
				toast.success(`📅 Daily challenge complete! +${DAILY_BONUS} bonus pts`);
			}
		}
	};

	const handlers = useMemo(() => {
		const m = new Map<
			string,
			{
				end: (won: boolean, raw: number) => void;
				playing: (p: boolean) => void;
			}
		>();
		for (const g of games) {
			m.set(g.id, {
				end: (won, raw) => endLogic.current(g.id, won, raw),
				playing: (p) =>
					setPlayingId((cur) => (p ? g.id : cur === g.id ? null : cur)),
			});
		}
		return m;
	}, [games]);

	return (
		<div className="relative h-full w-full bg-bg">
			<Toaster position="top-center" theme={theme} offset={60} />

			{/* header */}
			<header className="pointer-events-none absolute inset-x-0 top-0 z-40 flex items-center justify-between gap-2 bg-gradient-to-b from-bg/95 via-bg/60 to-transparent px-4 pt-3 pb-8">
				<button
					type="button"
					onClick={(e) => {
						e.currentTarget.blur();
						goTo("all");
					}}
					aria-label="Back to the start"
					className="pointer-events-auto border-0 bg-transparent p-0 text-base font-black tracking-widest"
				>
					🎮{" "}
					<span className="bg-gradient-to-r from-accent to-accent2 bg-clip-text text-transparent">
						GAMESHORTS
					</span>
				</button>

				<nav className="pointer-events-auto flex gap-1 rounded-full border border-line bg-card/80 p-1 backdrop-blur-md">
					{TABS.map((t) => (
						<button
							key={t.id}
							type="button"
							onClick={(e) => {
								e.currentTarget.blur();
								goTo(t.id);
							}}
							className={`rounded-full px-3 py-1 text-xs font-bold tracking-wide ${
								tab === t.id
									? "bg-gradient-to-r from-accent to-accent2 text-white"
									: "text-muted"
							}`}
						>
							{t.id === "favorites" ? `♥ ${player.favorites.length}` : t.label}
							{t.id === "daily" && dailyComplete && " ✅"}
						</button>
					))}
				</nav>

				<div className="pointer-events-auto flex items-center gap-2">
					{player.streak.count > 0 && (
						<div className="rounded-full border border-line bg-card/80 px-3 py-1.5 text-xs font-bold tracking-wider text-[#ffb13d] backdrop-blur-md">
							🔥 {player.streak.count}
						</div>
					)}
					{combo >= 2 && (
						<div className="rounded-full border border-accent/50 bg-card/80 px-3 py-1.5 text-xs font-bold tracking-wider text-accent backdrop-blur-md">
							⚡ x{(1 + 0.25 * Math.min(combo, 8)).toFixed(2)}
						</div>
					)}
					<div className="rounded-full border border-line bg-card/80 px-3 py-1.5 text-xs font-bold tracking-wider text-good backdrop-blur-md">
						🏆 {player.total.toLocaleString()}
					</div>
					<button
						type="button"
						onClick={(e) => {
							e.currentTarget.blur();
							toggle();
						}}
						aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
						className="flex h-8 w-8 items-center justify-center rounded-full border border-line bg-card/80 text-sm backdrop-blur-md"
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
				{L === 0 ? (
					<div className="flex h-full flex-col items-center justify-center gap-3 text-center">
						<div className="text-6xl">💔</div>
						<p className="text-muted">
							No favorites yet — tap ♥ on a game to keep it here.
						</p>
					</div>
				) : (
					Array.from({ length: ext }, (_, i) => {
						const game = list[i % L];
						return (
							<GameCard
								key={`${game.id}:${Math.floor(i / L)}`}
								game={game}
								mounted={Math.abs(i - extIdx) <= 1 && !isLocked(game.id)}
								active={i === extIdx}
								level={player.levels[game.id] ?? 1}
								best={player.best[game.id] ?? 0}
								isFavorite={player.favorites.includes(game.id)}
								locked={isLocked(game.id)}
								unlockAt={unlockAt(game.id)}
								dailyDone={tab === "daily" && dailyWon.includes(game.id)}
								onToggleFavorite={() => store.toggleFavorite(game.id)}
								onEnd={handlers.get(game.id)?.end ?? (() => {})}
								onPlayingChange={handlers.get(game.id)?.playing ?? (() => {})}
							/>
						);
					})
				)}
			</div>

			{/* up / down nav buttons */}
			{L > 1 && !locked && (
				<div className="absolute top-1/2 right-3 z-40 flex -translate-y-1/2 flex-col gap-2">
					<button
						type="button"
						onClick={(e) => {
							e.currentTarget.blur();
							requestNav(-1);
						}}
						aria-label="Previous game"
						className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-card/70 text-sm backdrop-blur-md"
					>
						▲
					</button>
					<button
						type="button"
						onClick={(e) => {
							e.currentTarget.blur();
							requestNav(1);
						}}
						aria-label="Next game"
						className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-card/70 text-sm backdrop-blur-md"
					>
						▼
					</button>
				</div>
			)}

			{/* daily share */}
			{tab === "daily" && dailyComplete && !locked && (
				<button
					type="button"
					onClick={(e) => {
						e.currentTarget.blur();
						shareDailyCard({
							date: today,
							games: daily.map((g) => ({ emoji: g.emoji, title: g.title })),
							total: player.total,
							streak: player.streak.count,
						});
					}}
					className="absolute bottom-8 left-1/2 z-40 -translate-x-1/2 rounded-full bg-gradient-to-r from-accent to-accent2 px-7 py-3 text-sm font-extrabold text-white shadow-[0_8px_30px_rgba(124,92,255,0.5)]"
				>
					📤 Share today's result
				</button>
			)}
		</div>
	);
}
