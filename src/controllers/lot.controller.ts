import type { Request, Response } from "express";
import { HttpError } from "../domain/errors";
import { SpotType } from "../domain/types";
import type { CreateLotInput } from "../repos/memory/memory.db";
import type { LotRepo, SpotRepo } from "../repos/memory/memory.repos";

function ensureRates(rates: any): Record<SpotType, number> {
	if (!rates) throw new HttpError(400, "ratesPerHour is required");
	for (const st of Object.values(SpotType)) {
		if (typeof rates[st] !== "number") throw new HttpError(400, `ratesPerHour.${st} must be a number`);
		if (rates[st] < 0) throw new HttpError(400, `ratesPerHour.${st} must be >= 0`);
	}
	return rates;
}

function ensureFloors(floors: any): Array<{ level: number; spots: Record<SpotType, number> }> {
	if (!Array.isArray(floors) || floors.length === 0) throw new HttpError(400, "floors must be a non-empty array");

	const seen = new Set<number>();
	return floors.map((f) => {
		if (typeof f?.level !== "number" || !Number.isInteger(f.level) || f.level <= 0) {
			throw new HttpError(400, "floor.level must be a positive integer");
		}
		if (seen.has(f.level)) throw new HttpError(400, "floor.level must be unique");
		seen.add(f.level);

		const spots = f?.spots;
		if (!spots) throw new HttpError(400, "floor.spots is required");
		const normalized: Record<SpotType, number> = {
			[SpotType.COMPACT]: Number(spots[SpotType.COMPACT] ?? 0),
			[SpotType.REGULAR]: Number(spots[SpotType.REGULAR] ?? 0),
			[SpotType.LARGE]: Number(spots[SpotType.LARGE] ?? 0),
		};

		for (const st of Object.values(SpotType)) {
			if (!Number.isFinite(normalized[st]) || normalized[st] < 0)
				throw new HttpError(400, `floor.spots.${st} must be >= 0`);
			if (!Number.isInteger(normalized[st])) throw new HttpError(400, `floor.spots.${st} must be an integer`);
		}

		return { level: f.level, spots: normalized };
	});
}

export function createLotController(lotRepo: LotRepo) {
	return (req: Request, res: Response) => {
		const body = req.body ?? {};
		const name = String(body.name ?? "").trim();
		if (!name) throw new HttpError(400, "name is required");

		const currency = String(body.currency ?? "INR").trim();
		if (!currency) throw new HttpError(400, "currency is required");

		const input: CreateLotInput = {
			name,
			currency,
			ratesPerHour: ensureRates(body.ratesPerHour),
			floors: ensureFloors(body.floors),
		};

		const lot = lotRepo.createLot(input);
		res.status(201).json({ lot });
	};
}

export function availabilityController(spotRepo: SpotRepo, lotRepo: LotRepo) {
	return (req: Request, res: Response) => {
		const lotId = req.params.lotId;
		lotRepo.getLot(lotId);
		const availability = spotRepo.getAvailability(lotId);
		res.json({ lotId, availability });
	};
}
