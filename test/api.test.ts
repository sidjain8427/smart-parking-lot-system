import { describe, expect, it, vi } from "vitest";
import request from "supertest";
import { createApp } from "../src/app";
import { SpotType } from "../src/domain/types";

describe("API", () => {
	it("creates a lot, checks availability, check-in and check-out", async () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date("2025-01-01T10:00:00.000Z"));

		const app = createApp();

		const createLotRes = await request(app)
			.post("/api/v1/lots")
			.send({
				name: "Downtown Lot",
				currency: "INR",
				ratesPerHour: { COMPACT: 50, REGULAR: 80, LARGE: 120 },
				floors: [{ level: 1, spots: { COMPACT: 1, REGULAR: 1, LARGE: 1 } }],
			});

		expect(createLotRes.status).toBe(201);
		expect(createLotRes.headers["x-request-id"]).toBeTruthy();
		const lotId = createLotRes.body.lot.id as string;
		expect(lotId).toBeTruthy();

		const avail1 = await request(app).get(`/api/v1/lots/${lotId}/availability`);
		expect(avail1.status).toBe(200);
		expect(avail1.body.availability.free[SpotType.COMPACT]).toBe(1);
		expect(avail1.body.availability.free[SpotType.REGULAR]).toBe(1);
		expect(avail1.body.availability.free[SpotType.LARGE]).toBe(1);

		const checkIn = await request(app)
			.post("/api/v1/checkins")
			.send({ lotId, vehicleType: "CAR", vehicleNumber: "DL01AB1234" });
		expect(checkIn.status).toBe(201);
		expect(checkIn.body.spot.spotType).toBe("REGULAR");
		const ticketId = checkIn.body.ticket.id as string;

		const avail2 = await request(app).get(`/api/v1/lots/${lotId}/availability`);
		expect(avail2.body.availability.free[SpotType.REGULAR]).toBe(0);

		// Advance time by 61 minutes => started-hour should bill 2 hours
		vi.setSystemTime(new Date("2025-01-01T11:01:00.000Z"));
		const checkOut = await request(app).post("/api/v1/checkouts").send({ ticketId });
		expect(checkOut.status).toBe(200);
		expect(checkOut.body.fee.billableHours).toBe(2);
		expect(checkOut.body.fee.ratePerHour).toBe(80);
		expect(checkOut.body.fee.totalFee).toBe(160);

		const avail3 = await request(app).get(`/api/v1/lots/${lotId}/availability`);
		expect(avail3.body.availability.free[SpotType.REGULAR]).toBe(1);

		vi.useRealTimers();
	});

	it("serves OpenAPI JSON and Swagger UI", async () => {
		const app = createApp();
		const spec = await request(app).get("/openapi.json");
		expect(spec.status).toBe(200);
		expect(spec.body.openapi).toBeTruthy();

		const ui = await request(app).get("/api-docs");
		expect(ui.status).toBe(301); // swagger-ui-express redirects to /api-docs/
	});

	it("validates create-lot input", async () => {
		const app = createApp();
		const res = await request(app).post("/api/v1/lots").send({ name: "", floors: [] });
		expect(res.status).toBe(400);
	});

	it("returns 409 when lot is full for vehicle type", async () => {
		const app = createApp();
		const createLotRes = await request(app)
			.post("/api/v1/lots")
			.send({
				name: "Small Lot",
				currency: "INR",
				ratesPerHour: { COMPACT: 10, REGULAR: 20, LARGE: 30 },
				floors: [{ level: 1, spots: { COMPACT: 0, REGULAR: 0, LARGE: 0 } }],
			});
		const lotId = createLotRes.body.lot.id as string;

		const checkIn = await request(app)
			.post("/api/v1/checkins")
			.send({ lotId, vehicleType: "BUS", vehicleNumber: "BUS-1" });
		expect(checkIn.status).toBe(409);
	});
});
