export const MS_PER_HOUR = 60 * 60 * 1000;
export const MS_PER_MINUTE = 60 * 1000;

export function ceilDiv(numerator: number, denominator: number): number {
	return Math.floor((numerator + denominator - 1) / denominator);
}

export function toDurationMinutes(start: Date, end: Date): number {
	return Math.max(0, Math.floor((end.getTime() - start.getTime()) / MS_PER_MINUTE));
}
