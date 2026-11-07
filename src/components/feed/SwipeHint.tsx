/** a nudge for first-time players: the feed scrolls, there is more below */
export function SwipeHint() {
	return (
		<div className="animate-fade-in pointer-events-none absolute inset-x-0 bottom-32 z-30 flex justify-center">
			<div className="animate-bounce-slow rounded-full border border-line bg-card/85 px-4 py-2 text-xs font-bold tracking-wider text-muted backdrop-blur-md">
				<span className="pointer-coarse:hidden">Scroll for more games ↓</span>
				<span className="hidden pointer-coarse:inline">
					Swipe up for more games ↑
				</span>
			</div>
		</div>
	);
}
