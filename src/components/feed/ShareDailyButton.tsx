import { shareDailyCard } from "../../lib/share";

type Props = {
	date: string;
	games: Array<{ emoji: string; title: string }>;
	total: number;
	streak: number;
};

export function ShareDailyButton(props: Props) {
	return (
		<button
			type="button"
			onClick={(e) => {
				e.currentTarget.blur();
				shareDailyCard(props);
			}}
			className="absolute bottom-8 left-1/2 z-40 -translate-x-1/2 rounded-full bg-gradient-to-r from-accent to-accent2 px-7 py-3 text-sm font-extrabold text-white shadow-[0_8px_30px_rgba(124,92,255,0.5)]"
		>
			📤 Share today's result
		</button>
	);
}
