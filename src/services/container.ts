import { createMemoryRepos } from "../repos/memory/memory.repos";
import { AllocationService } from "./allocation.service";
import { PricingService } from "./pricing.service";
import { TicketService } from "./ticket.service";

export type Container = ReturnType<typeof createContainer>;

export function createContainer() {
	const { db, lotRepo, spotRepo, ticketRepo } = createMemoryRepos();
	const allocationService = new AllocationService(lotRepo, spotRepo);
	const pricingService = new PricingService();
	const ticketService = new TicketService(lotRepo, spotRepo, ticketRepo, allocationService, pricingService);

	return { db, lotRepo, spotRepo, ticketRepo, allocationService, pricingService, ticketService };
}
