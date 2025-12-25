import { compatibleSpotTypesInOrder } from "../domain/compatibility";
import { HttpError } from "../domain/errors";
import { type Id, type Spot, SpotType, type VehicleType } from "../domain/types";
import { LotRepo, SpotRepo } from "../repos/memory/memory.repos";

export class AllocationService {
	constructor(private readonly lotRepo: LotRepo, private readonly spotRepo: SpotRepo) {}

	allocateSmallestCompatibleSpot(lotId: Id, vehicleType: VehicleType): Spot {
		this.lotRepo.getLot(lotId);

		for (const spotType of compatibleSpotTypesInOrder(vehicleType)) {
			const spotId = this.spotRepo.popFreeSpotId(lotId, spotType);
			if (!spotId) continue;

			this.spotRepo.markOccupied(spotId);
			return this.spotRepo.getSpot(spotId);
		}

		throw new HttpError(409, "Parking lot is full for this vehicle type");
	}

	releaseSpot(lotId: Id, spotId: Id): void {
		this.lotRepo.getLot(lotId);
		this.spotRepo.markFree(spotId);
		this.spotRepo.pushFreeSpotId(lotId, spotId);
	}
}
