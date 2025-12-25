export class AsyncMutex {
	private current: Promise<void> = Promise.resolve();

	async lock(): Promise<() => void> {
		let release!: () => void;
		const next = new Promise<void>((resolve) => {
			release = resolve;
		});

		const previous = this.current;
		this.current = this.current.then(() => next);
		await previous;

		return release;
	}
}
