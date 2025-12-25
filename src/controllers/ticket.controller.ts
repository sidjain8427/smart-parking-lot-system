import type { Request, Response } from "express";
import { HttpError } from "../domain/errors";
import { VehicleType } from "../domain/types";
import type { TicketRepo } from "../repos/memory/memory.repos";
import type { TicketService } from "../services/ticket.service";

function parseVehicleType(value: any): VehicleType {
	if (typeof value !== "string") throw new HttpError(400, "vehicleType is required");
	if (!(value in VehicleType)) throw new HttpError(400, "Invalid vehicleType");
	return value as VehicleType;
}

export function checkInController(ticketService: TicketService) {
	return async (req: Request, res: Response) => {
		const body = req.body ?? {};
		const lotId = String(body.lotId ?? "").trim();
		if (!lotId) throw new HttpError(400, "lotId is required");

		const vehicleType = parseVehicleType(body.vehicleType);
		const vehicleNumber = String(body.vehicleNumber ?? "").trim();
		if (!vehicleNumber) throw new HttpError(400, "vehicleNumber is required");

		const result = await ticketService.checkIn({ lotId, vehicleType, vehicleNumber });
		res.status(201).json(result);
	};
}

export function checkOutController(ticketService: TicketService) {
	return async (req: Request, res: Response) => {
		const body = req.body ?? {};
		const ticketId = String(body.ticketId ?? "").trim();
		if (!ticketId) throw new HttpError(400, "ticketId is required");

		const result = await ticketService.checkOut({ ticketId });
		res.json(result);
	};
}

export function getTicketController(ticketRepo: TicketRepo) {
	return (req: Request, res: Response) => {
		const ticketId = req.params.ticketId;
		const ticket = ticketRepo.getTicket(ticketId);
		res.json({ ticket });
	};
}
