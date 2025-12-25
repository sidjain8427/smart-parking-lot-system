import { describe, expect, it } from "vitest";
import { AllocationService } from "../src/services/allocation.service";
import { SpotType, VehicleType } from "../src/domain/types";
import { createMemoryRepos } from "../src/repos/memory/memory.repos";

function createLot(lotRepo: any) {
	return lotRepo.createLot({
		name: "Test Lot",
		currency: "INR",
		ratesPerHour: { [SpotType.COMPACT]: 10, [SpotType.REGULAR]: 20, [SpotType.LARGE]: 30 },
		floors: [{ level: 1, spots: { [SpotType.COMPACT]: 1, [SpotType.REGULAR]: 1, [SpotType.LARGE]: 1 } }],
	});
}

describe("AllocationService", () => {
	it("allocates the smallest compatible spot", () => {
		const { lotRepo, spotRepo } = createMemoryRepos();
		const lot = createLot(lotRepo);
		const svc = new AllocationService(lotRepo, spotRepo);

		const m = svc.allocateSmallestCompatibleSpot(lot.id, VehicleType.MOTORCYCLE);
		expect(m.spotType).toBe(SpotType.COMPACT);

		const c = svc.allocateSmallestCompatibleSpot(lot.id, VehicleType.CAR);
		expect(c.spotType).toBe(SpotType.REGULAR);

		const b = svc.allocateSmallestCompatibleSpot(lot.id, VehicleType.BUS);
		expect(b.spotType).toBe(SpotType.LARGE);
	});

	it("falls back to larger spot types when smaller are full", () => {
		const { lotRepo, spotRepo } = createMemoryRepos();
		const lot = lotRepo.createLot({
			name: "Test Lot",
			currency: "INR",
			ratesPerHour: { [SpotType.COMPACT]: 10, [SpotType.REGULAR]: 20, [SpotType.LARGE]: 30 },
			floors: [{ level: 1, spots: { [SpotType.COMPACT]: 0, [SpotType.REGULAR]: 0, [SpotType.LARGE]: 1 } }],
		});
		const svc = new AllocationService(lotRepo, spotRepo);

		const car = svc.allocateSmallestCompatibleSpot(lot.id, VehicleType.CAR);
		expect(car.spotType).toBe(SpotType.LARGE);
	});
});
