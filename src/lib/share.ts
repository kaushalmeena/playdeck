/** Render a wordle-style daily result card to canvas and share it. */

type ShareData = {
	date: string;
	games: Array<{ emoji: string; title: string }>;
	total: number;
	streak: number;
};

function draw(data: ShareData): HTMLCanvasElement {
	const W = 1000;
	const H = 620;
	const canvas = document.createElement("canvas");
	canvas.width = W;
	canvas.height = H;
	const ctx = canvas.getContext("2d");
	if (!ctx) return canvas;

	// background
	const bg = ctx.createRadialGradient(W / 2, -100, 50, W / 2, H / 2, H);
	bg.addColorStop(0, "#181830");
	bg.addColorStop(0.7, "#0b0b14");
	ctx.fillStyle = bg;
	ctx.fillRect(0, 0, W, H);

	// logo
	const grad = ctx.createLinearGradient(0, 0, W, 0);
	grad.addColorStop(0, "#7c5cff");
	grad.addColorStop(1, "#00e5ff");
	ctx.font =
		"900 52px ui-rounded, system-ui, -apple-system, 'Segoe UI', sans-serif";
	ctx.textAlign = "center";
	ctx.fillStyle = grad;
	ctx.fillText("🎮 PLAYDECK", W / 2, 92);

	ctx.font =
		"700 30px ui-rounded, system-ui, -apple-system, 'Segoe UI', sans-serif";
	ctx.fillStyle = "#8b8ba3";
	ctx.fillText(`Daily Challenge · ${data.date}`, W / 2, 148);

	// games
	ctx.font =
		"800 40px ui-rounded, system-ui, -apple-system, 'Segoe UI', sans-serif";
	data.games.forEach((g, i) => {
		const y = 240 + i * 78;
		ctx.fillStyle = "#eaeaf2";
		ctx.fillText(`${g.emoji}  ${g.title}  ✅`, W / 2, y);
	});

	// footer
	ctx.font =
		"900 44px ui-rounded, system-ui, -apple-system, 'Segoe UI', sans-serif";
	ctx.fillStyle = "#3dffa0";
	ctx.fillText(
		`🏆 ${data.total.toLocaleString()} pts   🔥 ${data.streak} day streak`,
		W / 2,
		540,
	);
	return canvas;
}

export async function shareDailyCard(data: ShareData): Promise<void> {
	const canvas = draw(data);
	const blob = await new Promise<Blob | null>((resolve) =>
		canvas.toBlob(resolve, "image/png"),
	);
	if (!blob) return;

	const file = new File([blob], `playdeck-daily-${data.date}.png`, {
		type: "image/png",
	});
	if (navigator.canShare?.({ files: [file] })) {
		try {
			await navigator.share({
				files: [file],
				title: "Playdeck Daily Challenge",
				text: `I cleared the Playdeck daily challenge for ${data.date}! 🏆 ${data.total.toLocaleString()} pts · 🔥 ${data.streak} day streak`,
			});
			return;
		} catch {
			// user cancelled or share failed — fall through to download
		}
	}
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = file.name;
	a.click();
	URL.revokeObjectURL(url);
}
