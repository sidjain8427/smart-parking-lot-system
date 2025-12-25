import { HttpError } from "../domain/errors";
import { type FeeBreakdown, SpotType, type ParkingLot } from "../domain/types";
import { ceilDiv, MS_PER_HOUR, toDurationMinutes } from "../utils/time";

export class PricingService {
	calculateFee(lot: ParkingLot, spotTypeUsed: SpotType, checkInAt: Date, checkOutAt: Date): FeeBreakdown {
		if (checkOutAt.getTime() < checkInAt.getTime()) {
			throw new HttpError(400, "Invalid checkout time");
		}

		const durationMs = checkOutAt.getTime() - checkInAt.getTime();
		const durationMinutes = toDurationMinutes(checkInAt, checkOutAt);
		const billableHours = durationMs === 0 ? 0 : Math.max(1, ceilDiv(durationMs, MS_PER_HOUR));

		const ratePerHour = lot.ratesPerHour[spotTypeUsed];
		if (typeof ratePerHour !== "number" || Number.isNaN(ratePerHour) || ratePerHour < 0) {
			throw new HttpError(500, "Rate not configured for spot type");
		}

		return {
			durationMinutes,
			billableHours,
			ratePerHour,
			totalFee: billableHours * ratePerHour,
			currency: lot.currency,
		};
	}
}
