import { Router } from "express";
import { API_PREFIX } from "../config/constants";
import { availabilityController, createLotController } from "../controllers/lot.controller";
import { checkInController, checkOutController, getTicketController } from "../controllers/ticket.controller";
import type { LotRepo, SpotRepo, TicketRepo } from "../repos/memory/memory.repos";
import type { TicketService } from "../services/ticket.service";

export function buildRouter(deps: {
	lotRepo: LotRepo;
	spotRepo: SpotRepo;
	ticketRepo: TicketRepo;
	ticketService: TicketService;
}) {
	const router = Router();

	router.post(`${API_PREFIX}/lots`, createLotController(deps.lotRepo));
	router.get(`${API_PREFIX}/lots/:lotId/availability`, availabilityController(deps.spotRepo, deps.lotRepo));

	router.post(`${API_PREFIX}/checkins`, checkInController(deps.ticketService));
	router.post(`${API_PREFIX}/checkouts`, checkOutController(deps.ticketService));
	router.get(`${API_PREFIX}/tickets/:ticketId`, getTicketController(deps.ticketRepo));

	return router;
}
