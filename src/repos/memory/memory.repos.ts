import { HttpError } from "../../domain/errors";
import {
	SpotStatus,
	SpotType,
	TicketStatus,
	type Id,
	type ParkingLot,
	type Spot,
	type Ticket,
} from "../../domain/types";
import { compareSpotsByLevelAndNumber } from "../../domain/compatibility";
import { MemoryDb, type CreateLotInput } from "./memory.db";

function binaryInsertSpotId(sortedIds: Id[], spotById: (id: Id) => Spot, id: Id): void {
	let lo = 0;
	let hi = sortedIds.length;
	const spot = spotById(id);

	while (lo < hi) {
		const mid = Math.floor((lo + hi) / 2);
		const midSpot = spotById(sortedIds[mid]);
		if (compareSpotsByLevelAndNumber(spot, midSpot) < 0) hi = mid;
		else lo = mid + 1;
	}

	sortedIds.splice(lo, 0, id);
}

export class LotRepo {
	constructor(private readonly db: MemoryDb) {}

	createLot(input: CreateLotInput): ParkingLot {
		return this.db.createLot(input);
	}

	getLot(lotId: Id): ParkingLot {
		const lot = this.db.lots.get(lotId);
		if (!lot) throw new HttpError(404, "Lot not found");
		return lot;
	}
}

export class SpotRepo {
	constructor(private readonly db: MemoryDb) {}

	getSpot(spotId: Id): Spot {
		const spot = this.db.spots.get(spotId);
		if (!spot) throw new HttpError(404, "Spot not found");
		return spot;
	}

	markOccupied(spotId: Id): void {
		const spot = this.getSpot(spotId);
		if (spot.status !== SpotStatus.FREE) throw new HttpError(409, "Spot not free");
		spot.status = SpotStatus.OCCUPIED;
		this.db.spots.set(spotId, spot);
	}

	markFree(spotId: Id): void {
		const spot = this.getSpot(spotId);
		spot.status = SpotStatus.FREE;
		this.db.spots.set(spotId, spot);
	}

	popFreeSpotId(lotId: Id, spotType: SpotType): Id | undefined {
		const free = this.db.freeSpots.get(lotId);
		if (!free) throw new HttpError(404, "Lot not found");
		return free[spotType].shift();
	}

	pushFreeSpotId(lotId: Id, spotId: Id): void {
		const spot = this.getSpot(spotId);
		const free = this.db.freeSpots.get(lotId);
		if (!free) throw new HttpError(404, "Lot not found");
		binaryInsertSpotId(free[spot.spotType], (id) => this.getSpot(id), spotId);
	}

	getAvailability(lotId: Id): {
		free: Record<SpotType, number>;
		occupied: Record<SpotType, number>;
		total: Record<SpotType, number>;
	} {
		const lot = this.db.lots.get(lotId);
		if (!lot) throw new HttpError(404, "Lot not found");

		const freeMap = this.db.freeSpots.get(lotId);
		if (!freeMap) throw new HttpError(404, "Lot not found");

		const total: Record<SpotType, number> = {
			[SpotType.COMPACT]: 0,
			[SpotType.REGULAR]: 0,
			[SpotType.LARGE]: 0,
		};

		for (const floor of lot.floors) {
			for (const spotType of Object.values(SpotType) as SpotType[]) {
				total[spotType] += floor.spots[spotType] ?? 0;
			}
		}

		const free: Record<SpotType, number> = {
			[SpotType.COMPACT]: freeMap[SpotType.COMPACT].length,
			[SpotType.REGULAR]: freeMap[SpotType.REGULAR].length,
			[SpotType.LARGE]: freeMap[SpotType.LARGE].length,
		};

		const occupied: Record<SpotType, number> = {
			[SpotType.COMPACT]: total[SpotType.COMPACT] - free[SpotType.COMPACT],
			[SpotType.REGULAR]: total[SpotType.REGULAR] - free[SpotType.REGULAR],
			[SpotType.LARGE]: total[SpotType.LARGE] - free[SpotType.LARGE],
		};

		return { free, occupied, total };
	}
}

export class TicketRepo {
	constructor(private readonly db: MemoryDb) {}

	createTicket(input: Omit<Ticket, "id" | "status">): Ticket {
		return this.db.createTicket(input);
	}

	getTicket(ticketId: Id): Ticket {
		const ticket = this.db.tickets.get(ticketId);
		if (!ticket) throw new HttpError(404, "Ticket not found");
		return ticket;
	}

	closeTicket(ticketId: Id, checkOutAt: Date): Ticket {
		const ticket = this.getTicket(ticketId);
		if (ticket.status !== TicketStatus.OPEN) throw new HttpError(409, "Ticket already closed");
		ticket.status = TicketStatus.CLOSED;
		ticket.checkOutAt = checkOutAt;
		this.db.tickets.set(ticketId, ticket);
		return ticket;
	}
}

export function createMemoryRepos() {
	const db = new MemoryDb();
	return {
		db,
		lotRepo: new LotRepo(db),
		spotRepo: new SpotRepo(db),
		ticketRepo: new TicketRepo(db),
	};
}
