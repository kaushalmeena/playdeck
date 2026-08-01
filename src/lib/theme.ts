import { useSyncExternalStore } from "react";

const KEY = "pd_theme";

export type Theme = "dark" | "light";

let current: Theme | null = null;
const listeners = new Set<() => void>();

function read(): Theme {
	if (current) return current;
	if (typeof document === "undefined") return "dark";
	current = document.documentElement.classList.contains("light")
		? "light"
		: "dark";
	return current;
}

/**
 * Theme state. The initial class on <html> is set by an inline script in
 * the document head (see __root.tsx) so there's no flash of wrong theme.
 */
export function useTheme() {
	const theme = useSyncExternalStore(
		(cb) => {
			listeners.add(cb);
			return () => listeners.delete(cb);
		},
		read,
		() => "dark" as Theme,
	);

	const toggle = () => {
		current = read() === "dark" ? "light" : "dark";
		document.documentElement.classList.toggle("light", current === "light");
		try {
			localStorage.setItem(KEY, current);
		} catch {
			// private mode — theme just won't persist
		}
		for (const l of listeners) l();
	};

	return { theme, toggle };
}

/** Inline <script> that applies the saved / system theme before paint. */
export const themeInitScript = `try{var t=localStorage.getItem("${KEY}");var d=t?t==="dark":matchMedia("(prefers-color-scheme: dark)").matches;document.documentElement.classList.toggle("light",!d)}catch(e){}`;
