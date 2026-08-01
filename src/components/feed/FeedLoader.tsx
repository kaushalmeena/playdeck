/**
 * Full-screen splash shown until the feed is ready to play.
 *
 * It is also what the prerendered HTML contains, so the static page a visitor
 * downloads is this splash rather than a half-shuffled list of cards.
 */
export function FeedLoader() {
	return (
		<div
			className="flex h-full w-full flex-col items-center justify-center gap-5"
			style={{
				background:
					"radial-gradient(120% 80% at 50% -10%, var(--t-stage) 0%, var(--t-bg) 60%)",
			}}
		>
			<div className="animate-bounce-slow text-6xl">🎮</div>

			<div className="text-lg font-black tracking-[0.3em]">
				<span className="bg-linear-to-r from-accent to-accent2 bg-clip-text text-transparent">
					GAMESHORTS
				</span>
			</div>

			<div
				className="h-1 w-40 overflow-hidden rounded-full bg-line"
				role="progressbar"
				aria-label="Loading games"
			>
				<div className="animate-slide h-full w-1/3 rounded-full bg-linear-to-r from-accent to-accent2" />
			</div>

			<p className="text-xs tracking-widest text-muted">SHUFFLING THE DECK…</p>
		</div>
	);
}
