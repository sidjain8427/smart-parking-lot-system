export enum VehicleType {
	MOTORCYCLE = "MOTORCYCLE",
	CAR = "CAR",
	BUS = "BUS",
}

export enum SpotType {
	COMPACT = "COMPACT",
	REGULAR = "REGULAR",
	LARGE = "LARGE",
}

export enum SpotStatus {
	FREE = "FREE",
	OCCUPIED = "OCCUPIED",
}

export enum TicketStatus {
	OPEN = "OPEN",
	CLOSED = "CLOSED",
}

export type Id = string;

export interface Spot {
	id: Id;
	lotId: Id;
	level: number;
	spotNumber: number;
	spotType: SpotType;
	status: SpotStatus;
}

export interface LotFloorSpec {
	level: number;
	spots: Record<SpotType, number>;
}

export interface ParkingLot {
	id: Id;
	name: string;
	currency: string;
	ratesPerHour: Record<SpotType, number>;
	floors: LotFloorSpec[];
	createdAt: Date;
}

export interface Ticket {
	id: Id;
	lotId: Id;
	vehicleType: VehicleType;
	vehicleNumber: string;
	spotId: Id;
	spotTypeUsed: SpotType;
	checkInAt: Date;
	checkOutAt?: Date;
	status: TicketStatus;
}

export interface FeeBreakdown {
	durationMinutes: number;
	billableHours: number;
	ratePerHour: number;
	totalFee: number;
	currency: string;
}
