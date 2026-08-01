export function EmptyState({
	emoji,
	message,
}: {
	emoji: string;
	message: string;
}) {
	return (
		<div className="flex h-full flex-col items-center justify-center gap-3 px-8 text-center">
			<div className="text-6xl">{emoji}</div>
			<p className="text-muted">{message}</p>
		</div>
	);
}
