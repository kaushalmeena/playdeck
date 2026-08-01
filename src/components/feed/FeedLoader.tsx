import { useEffect, useState } from "react";
import { Logo } from "../Logo";

const MESSAGES = [
	"SHUFFLING THE DECK…",
	"WARMING UP THE PIXELS…",
	"WINDING THE SPRINGS…",
	"POLISHING THE HIGH SCORES…",
	"TEACHING THE BOTS TO LOSE…",
	"LINING UP THE LEVELS…",
	"CHARGING THE COMBO METER…",
	"DUSTING OFF THE ARCADE…",
];

/**
 * The picked message lives at module scope, so the two places the splash gets
 * mounted (before the feed, then again on top of it during the cross-fade)
 * agree — and it stays null until the client picks, which keeps the
 * prerendered HTML free of a message the client would immediately replace.
 */
let picked: string | null = null;

const nextMessage = (): string => {
	const others = MESSAGES.filter((m) => m !== picked);
	picked = others[Math.floor(Math.random() * others.length)];
	return picked;
};

/**
 * Full-screen splash shown until the feed is ready to play.
 *
 * It is also what the prerendered HTML contains, so the static page a visitor
 * downloads is this splash rather than a half-shuffled list of cards.
 */
export function FeedLoader() {
	const [message, setMessage] = useState(picked);

	useEffect(() => {
		setMessage(picked ?? nextMessage());
		// a slow connection gets a fresh line rather than a stuck one
		const rotate = setInterval(() => setMessage(nextMessage()), 1600);
		return () => clearInterval(rotate);
	}, []);

	return (
		<div
			className="flex h-full w-full flex-col items-center justify-center gap-5"
			style={{
				background:
					"radial-gradient(120% 80% at 50% -10%, var(--t-stage) 0%, var(--t-bg) 60%)",
			}}
		>
			<Logo size={72} className="animate-bounce-slow" />

			<div className="text-lg font-black tracking-[0.3em]">
				<span className="bg-linear-to-r from-accent to-accent2 bg-clip-text text-transparent">
					PLAYDECK
				</span>
			</div>

			<div
				className="h-1 w-40 overflow-hidden rounded-full bg-line"
				role="progressbar"
				aria-label="Loading games"
			>
				<div className="animate-slide h-full w-1/3 rounded-full bg-linear-to-r from-accent to-accent2" />
			</div>

			{/* the height is reserved so swapping lines never shifts the layout */}
			<p className="flex h-4 items-center text-xs tracking-widest text-muted">
				{message && (
					<span key={message} className="animate-fade-in">
						{message}
					</span>
				)}
			</p>
		</div>
	);
}
