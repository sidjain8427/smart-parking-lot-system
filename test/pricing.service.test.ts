import { describe, expect, it } from "vitest";
import { PricingService } from "../src/services/pricing.service";
import { SpotType, type ParkingLot } from "../src/domain/types";

function lotWithRates(): ParkingLot {
	return {
		id: "lot-1",
		name: "Test",
		currency: "INR",
		ratesPerHour: {
			[SpotType.COMPACT]: 10,
			[SpotType.REGULAR]: 20,
			[SpotType.LARGE]: 30,
		},
		floors: [],
		createdAt: new Date("2025-01-01T00:00:00.000Z"),
	};
}

describe("PricingService", () => {
	it("charges 0 when duration is 0", () => {
		const svc = new PricingService();
		const lot = lotWithRates();
		const t = new Date("2025-01-01T10:00:00.000Z");
		const fee = svc.calculateFee(lot, SpotType.REGULAR, t, t);
		expect(fee.billableHours).toBe(0);
		expect(fee.totalFee).toBe(0);
	});

	it("charges started-hour (ceil) based on spot type used", () => {
		const svc = new PricingService();
		const lot = lotWithRates();
		const start = new Date("2025-01-01T10:00:00.000Z");
		const end = new Date("2025-01-01T11:01:00.000Z"); // 61 mins => 2 hours
		const fee = svc.calculateFee(lot, SpotType.LARGE, start, end);
		expect(fee.billableHours).toBe(2);
		expect(fee.ratePerHour).toBe(30);
		expect(fee.totalFee).toBe(60);
	});
});
