import { comboMultiplier } from "../../hooks/useRunRecorder";
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
	className = "",
}: {
	children: React.ReactNode;
	className?: string;
}) {
	return (
		<div
			className={`rounded-full border border-line bg-card/80 px-3 py-1.5 text-xs font-bold tracking-wider backdrop-blur-md ${className}`}
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
	return (
		<div className="pointer-events-auto flex items-center gap-2">
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
					onToggleTheme();
				}}
				aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
				className="flex h-8 w-8 items-center justify-center rounded-full border border-line bg-card/80 text-sm backdrop-blur-md"
			>
				{theme === "dark" ? "🌙" : "☀️"}
			</button>
		</div>
	);
}
