import clsx from "clsx";
import { comboMultiplier } from "../../hooks/useRunRecorder";
import { sfx, useSoundPref } from "../../lib/sfx";
import type { Theme } from "../../lib/theme";

type Props = {
	total: number;
	streak: number;
	combo: number;
	theme: Theme;
	onToggleTheme: () => void;
};

function Pill({
	children,
	className,
}: {
	children: React.ReactNode;
	className?: string;
}) {
	return (
		<div
			className={clsx(
				"shrink-0 rounded-full border border-line bg-card/80 px-2 py-1 text-[10px] font-bold tracking-wider backdrop-blur-md sm:px-3 sm:py-1.5 sm:text-xs",
				className,
			)}
		>
			{children}
		</div>
	);
}

export function FeedStats({
	total,
	streak,
	combo,
	theme,
	onToggleTheme,
}: Props) {
	const sound = useSoundPref();

	return (
		<div className="pointer-events-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
			{streak > 0 && <Pill className="text-[#ffb13d]">🔥 {streak}</Pill>}
			{combo >= 2 && (
				<Pill className="border-accent/50 text-accent">
					⚡ ×{comboMultiplier(combo).toFixed(2)}
				</Pill>
			)}
			<Pill className="text-good">🏆 {total.toLocaleString()}</Pill>
			<button
				type="button"
				onClick={(e) => {
					e.currentTarget.blur();
					sound.toggle();
				}}
				aria-label={sound.on ? "Mute sound" : "Unmute sound"}
				aria-pressed={sound.on}
				className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-line bg-card/80 text-xs backdrop-blur-md sm:h-8 sm:w-8 sm:text-sm"
			>
				{sound.on ? "🔊" : "🔇"}
			</button>
			<button
				type="button"
				onClick={(e) => {
					e.currentTarget.blur();
					sfx.toggle(theme === "light");
					onToggleTheme();
				}}
				aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
				className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-line bg-card/80 text-xs backdrop-blur-md sm:h-8 sm:w-8 sm:text-sm"
			>
				{theme === "dark" ? "🌙" : "☀️"}
			</button>
		</div>
	);
}
