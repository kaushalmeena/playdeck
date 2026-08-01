import type { ReactNode } from "react";

export function Chip({ children }: { children: ReactNode }) {
	return (
		<span className="rounded-full border border-line bg-card/85 px-3.5 py-1.5 text-xs font-extrabold tracking-wider">
			{children}
		</span>
	);
}
