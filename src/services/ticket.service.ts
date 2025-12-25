import { HttpError } from "../domain/errors";
import { SpotStatus, TicketStatus, type Id, type Ticket, type VehicleType } from "../domain/types";
import { LotRepo, SpotRepo, TicketRepo } from "../repos/memory/memory.repos";
import { AsyncMutex } from "../utils/mutex";
import { AllocationService } from "./allocation.service";
import { PricingService } from "./pricing.service";

export class TicketService {
	private readonly lotLocks = new Map<Id, AsyncMutex>();

	constructor(
		private readonly lotRepo: LotRepo,
		private readonly spotRepo: SpotRepo,
		private readonly ticketRepo: TicketRepo,
		private readonly allocationService: AllocationService,
		private readonly pricingService: PricingService
	) {}

	private mutexForLot(lotId: Id): AsyncMutex {
		let mutex = this.lotLocks.get(lotId);
		if (!mutex) {
			mutex = new AsyncMutex();
			this.lotLocks.set(lotId, mutex);
		}
		return mutex;
	}

	async checkIn(input: {
		lotId: Id;
		vehicleType: VehicleType;
		vehicleNumber: string;
		checkInAt?: Date;
	}): Promise<{ ticket: Ticket; spot: { id: Id; level: number; spotNumber: number; spotType: string } }> {
		const lot = this.lotRepo.getLot(input.lotId);
		if (!input.vehicleNumber || input.vehicleNumber.trim().length === 0) {
			throw new HttpError(400, "vehicleNumber is required");
		}

		const release = await this.mutexForLot(input.lotId).lock();
		try {
			const spot = this.allocationService.allocateSmallestCompatibleSpot(input.lotId, input.vehicleType);
			if (spot.status !== SpotStatus.OCCUPIED) throw new HttpError(500, "Spot allocation failed");

			const ticket = this.ticketRepo.createTicket({
				lotId: input.lotId,
				vehicleType: input.vehicleType,
				vehicleNumber: input.vehicleNumber.trim(),
				spotId: spot.id,
				spotTypeUsed: spot.spotType,
				checkInAt: input.checkInAt ?? new Date(),
			});

			return {
				ticket,
				spot: { id: spot.id, level: spot.level, spotNumber: spot.spotNumber, spotType: spot.spotType },
			};
		} finally {
			release();
		}
	}

	async checkOut(input: {
		ticketId: Id;
		checkOutAt?: Date;
	}): Promise<{
		ticket: Ticket;
		fee: {
			durationMinutes: number;
			billableHours: number;
			ratePerHour: number;
			totalFee: number;
			currency: string;
		};
	}> {
		const ticket = this.ticketRepo.getTicket(input.ticketId);
		if (ticket.status !== TicketStatus.OPEN) throw new HttpError(409, "Ticket already closed");

		const lot = this.lotRepo.getLot(ticket.lotId);
		const release = await this.mutexForLot(ticket.lotId).lock();
		try {
			const checkOutAt = input.checkOutAt ?? new Date();
			const closed = this.ticketRepo.closeTicket(ticket.id, checkOutAt);

			this.allocationService.releaseSpot(ticket.lotId, ticket.spotId);

			const fee = this.pricingService.calculateFee(lot, closed.spotTypeUsed, closed.checkInAt, checkOutAt);
			return { ticket: closed, fee };
		} finally {
			release();
		}
	}
}
