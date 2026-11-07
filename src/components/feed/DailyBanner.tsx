import { DAILY_BONUS } from "../../lib/daily";

type Props = {
	done: number;
	total: number;
};

/** what the daily tab is and how far through it you are */
export function DailyBanner({ done, total }: Props) {
	const complete = done >= total;
	return (
		<div className="pointer-events-none absolute inset-x-0 top-16 z-30 flex justify-center">
			<div className="flex items-center gap-2 rounded-full border border-line bg-card/85 px-4 py-1.5 text-xs font-extrabold tracking-wider backdrop-blur-md">
				<span>📅 TODAY</span>
				<span className="flex gap-1" aria-label={`${done} of ${total} cleared`}>
					{Array.from({ length: total }, (_, i) => (
						<span
							key={i}
							className={
								i < done
									? "size-2 rounded-full bg-good"
									: "size-2 rounded-full bg-line"
							}
						/>
					))}
				</span>
				<span className={complete ? "text-good" : "text-muted"}>
					{complete ? "CLEARED 🎉" : `WIN ALL ${total} · +${DAILY_BONUS}`}
				</span>
			</div>
		</div>
	);
}
