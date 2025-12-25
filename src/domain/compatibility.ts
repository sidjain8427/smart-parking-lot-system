import { SpotType, VehicleType } from "./types";

const vehicleRank: Record<VehicleType, number> = {
	[VehicleType.MOTORCYCLE]: 0,
	[VehicleType.CAR]: 1,
	[VehicleType.BUS]: 2,
};

const spotRank: Record<SpotType, number> = {
	[SpotType.COMPACT]: 0,
	[SpotType.REGULAR]: 1,
	[SpotType.LARGE]: 2,
};

export function isCompatible(vehicleType: VehicleType, spotType: SpotType): boolean {
	return vehicleRank[vehicleType] <= spotRank[spotType];
}

export function compatibleSpotTypesInOrder(vehicleType: VehicleType): SpotType[] {
	return (Object.values(SpotType) as SpotType[])
		.filter((spotType) => isCompatible(vehicleType, spotType))
		.sort((a, b) => spotRank[a] - spotRank[b]);
}

export function compareSpotsByLevelAndNumber(
	a: { level: number; spotNumber: number },
	b: { level: number; spotNumber: number }
): number {
	if (a.level !== b.level) return a.level - b.level;
	return a.spotNumber - b.spotNumber;
}
