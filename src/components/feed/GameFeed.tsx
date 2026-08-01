import clsx from "clsx";
import { useMemo } from "react";
import { Toaster } from "sonner";
import type { GameEntry } from "../../games/registry";
import { useInfiniteFeed } from "../../hooks/useInfiniteFeed";
import { useRunRecorder } from "../../hooks/useRunRecorder";
import { useShuffledGames } from "../../hooks/useShuffledGames";
import { dailyGames, dateKey } from "../../lib/daily";
import { listIndex } from "../../lib/feed/loop";
import { selectList, type Tab } from "../../lib/feed/ordering";
import { unlockedCount, unlockThreshold } from "../../lib/feed/progression";
import { store, usePlayerState } from "../../lib/storage";
import { useTheme } from "../../lib/theme";
import { EmptyState } from "./EmptyState";
import { FeedHeader } from "./FeedHeader";
import { GameCard } from "./GameCard";
import { NavArrows } from "./NavArrows";
import { ShareDailyButton } from "./ShareDailyButton";

export function GameFeed({
	games,
	tab,
}: {
	games: Array<GameEntry>;
	tab: Tab;
}) {
	const player = usePlayerState();
	const { theme, toggle } = useTheme();
	const shuffled = useShuffledGames(games);

	const today = dateKey();
	const daily = useMemo(() => dailyGames(games, today), [games, today]);
	const dailyIds = useMemo(() => daily.map((g) => g.id), [daily]);
	const dailyWon = player.daily[today] ?? [];
	const dailyComplete = dailyIds.every((id) => dailyWon.includes(id));

	const { combo, playingId, handlersFor } = useRunRecorder(
		games,
		dailyIds,
		today,
	);

	// Unlocking follows each game's canonical position, so shuffling the feed
	// never changes which games are available.
	const rank = useMemo(() => new Map(games.map((g, i) => [g.id, i])), [games]);
	const openCount = unlockedCount(player.total, games.length);
	const isLocked = (id: string) =>
		tab !== "daily" && (rank.get(id) ?? 0) >= openCount;

	const list = useMemo(
		() =>
			selectList({
				tab,
				games: shuffled,
				daily,
				player,
				unlocked: (id) => (rank.get(id) ?? 0) < openCount,
			}),
		[tab, shuffled, daily, player, rank, openCount],
	);

	const feed = useInfiniteFeed({
		length: list.length,
		resetKey: `${tab}:${list.length}:${shuffled[0]?.id ?? ""}`,
		frozen: playingId !== null,
	});

	const frozen = playingId !== null;

	return (
		<div className="relative h-full w-full bg-bg">
			<Toaster position="top-center" theme={theme} offset={60} />

			<FeedHeader
				total={player.total}
				streak={player.streak.count}
				combo={combo}
				favoriteCount={player.favorites.length}
				dailyComplete={dailyComplete}
				theme={theme}
				onToggleTheme={toggle}
				onLogoRewind={feed.rewind}
				isHome={tab === "all"}
			/>

			<div
				ref={feed.scrollerRef}
				onScroll={feed.onScroll}
				className={clsx(
					"no-scrollbar h-full w-full snap-y snap-mandatory overscroll-contain",
					frozen ? "overflow-hidden" : "overflow-y-auto",
				)}
			>
				{list.length === 0 ? (
					<EmptyState
						emoji="💔"
						message="No favorites yet — tap ♥ on a game to keep it here."
					/>
				) : (
					Array.from({ length: feed.extent }, (_, i) => {
						const game = list[listIndex(i, list.length)];
						const locked = isLocked(game.id);
						const handlers = handlersFor(game.id);
						return (
							<GameCard
								key={`${game.id}:${Math.floor(i / list.length)}`}
								game={game}
								mounted={Math.abs(i - feed.index) <= 1 && !locked}
								active={i === feed.index}
								locked={locked}
								unlockAt={unlockThreshold(rank.get(game.id) ?? 0)}
								level={player.levels[game.id] ?? 1}
								best={player.best[game.id] ?? 0}
								isFavorite={player.favorites.includes(game.id)}
								dailyDone={tab === "daily" && dailyWon.includes(game.id)}
								onToggleFavorite={() => store.toggleFavorite(game.id)}
								onEnd={handlers.end}
								onPlayingChange={handlers.playing}
							/>
						);
					})
				)}
			</div>

			{list.length > 1 && !frozen && <NavArrows onPage={feed.page} />}

			{tab === "daily" && dailyComplete && !frozen && (
				<ShareDailyButton
					date={today}
					games={daily.map((g) => ({ emoji: g.emoji, title: g.title }))}
					total={player.total}
					streak={player.streak.count}
				/>
			)}
		</div>
	);
}
