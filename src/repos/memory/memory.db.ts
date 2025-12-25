import {
	SpotStatus,
	SpotType,
	TicketStatus,
	type Id,
	type ParkingLot,
	type Spot,
	type Ticket,
} from "../../domain/types";
import { newId } from "../../utils/id";

export interface CreateLotInput {
	name: string;
	currency: string;
	ratesPerHour: Record<SpotType, number>;
	floors: Array<{ level: number; spots: Record<SpotType, number> }>;
}

function makeSpotId(lotId: Id, level: number, spotType: SpotType, spotNumber: number): Id {
	return `${lotId}:${level}:${spotType}:${spotNumber}`;
}

export class MemoryDb {
	public readonly lots = new Map<Id, ParkingLot>();
	public readonly spots = new Map<Id, Spot>();
	public readonly tickets = new Map<Id, Ticket>();

	// Free spot IDs per lot per type, sorted by (level, spotNumber)
	public readonly freeSpots = new Map<Id, Record<SpotType, Id[]>>();

	createLot(input: CreateLotInput): ParkingLot {
		const lotId = newId();

		const lot: ParkingLot = {
			id: lotId,
			name: input.name,
			currency: input.currency,
			ratesPerHour: input.ratesPerHour,
			floors: input.floors.map((f) => ({ level: f.level, spots: f.spots })),
			createdAt: new Date(),
		};

		this.lots.set(lotId, lot);

		const free: Record<SpotType, Id[]> = {
			[SpotType.COMPACT]: [],
			[SpotType.REGULAR]: [],
			[SpotType.LARGE]: [],
		};

		for (const floor of input.floors) {
			for (const spotType of Object.values(SpotType) as SpotType[]) {
				const count = floor.spots[spotType] ?? 0;
				for (let i = 1; i <= count; i++) {
					const spotId = makeSpotId(lotId, floor.level, spotType, i);
					const spot: Spot = {
						id: spotId,
						lotId,
						level: floor.level,
						spotNumber: i,
						spotType,
						status: SpotStatus.FREE,
					};

					this.spots.set(spotId, spot);
					free[spotType].push(spotId);
				}
			}
		}

		this.freeSpots.set(lotId, free);
		return lot;
	}

	createTicket(ticket: Omit<Ticket, "id" | "status">): Ticket {
		const id = newId();
		const created: Ticket = {
			...ticket,
			id,
			status: TicketStatus.OPEN,
		};
		this.tickets.set(id, created);
		return created;
	}
}
