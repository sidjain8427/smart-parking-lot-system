export const openApiSpec = {
	openapi: "3.0.3",
	info: {
		title: "Smart Parking Lot System API",
		version: "1.0.0",
		description: "Smart parking lot backend (create lot, check-in/out, availability, billing).",
	},
	servers: [{ url: "http://localhost:3000" }],
	paths: {
		"/": {
			get: {
				summary: "Health/root",
				responses: {
					"200": { description: "OK" },
				},
			},
		},
		"/api/v1/lots": {
			post: {
				summary: "Create a parking lot (counts-based)",
				requestBody: {
					required: true,
					content: {
						"application/json": {
							schema: { $ref: "#/components/schemas/CreateLotRequest" },
						},
					},
				},
				responses: {
					"201": {
						description: "Created",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/CreateLotResponse" },
							},
						},
					},
					"400": { description: "Validation error" },
				},
			},
		},
		"/api/v1/lots/{lotId}/availability": {
			get: {
				summary: "Get availability for a lot",
				parameters: [{ name: "lotId", in: "path", required: true, schema: { type: "string" } }],
				responses: {
					"200": {
						description: "OK",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/AvailabilityResponse" },
							},
						},
					},
					"404": { description: "Not found" },
				},
			},
		},
		"/api/v1/checkins": {
			post: {
				summary: "Check-in a vehicle (allocate spot and issue ticket)",
				requestBody: {
					required: true,
					content: {
						"application/json": {
							schema: { $ref: "#/components/schemas/CheckInRequest" },
						},
					},
				},
				responses: {
					"201": {
						description: "Created",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/CheckInResponse" },
							},
						},
					},
					"400": { description: "Validation error" },
					"409": { description: "Lot full" },
				},
			},
		},
		"/api/v1/checkouts": {
			post: {
				summary: "Check-out a vehicle (close ticket, release spot, compute fee)",
				requestBody: {
					required: true,
					content: {
						"application/json": {
							schema: { $ref: "#/components/schemas/CheckOutRequest" },
						},
					},
				},
				responses: {
					"200": {
						description: "OK",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/CheckOutResponse" },
							},
						},
					},
					"400": { description: "Validation error" },
					"404": { description: "Not found" },
					"409": { description: "Ticket already closed" },
				},
			},
		},
		"/api/v1/tickets/{ticketId}": {
			get: {
				summary: "Get a ticket",
				parameters: [{ name: "ticketId", in: "path", required: true, schema: { type: "string" } }],
				responses: {
					"200": {
						description: "OK",
						content: {
							"application/json": { schema: { $ref: "#/components/schemas/TicketResponse" } },
						},
					},
					"404": { description: "Not found" },
				},
			},
		},
		"/openapi.json": {
			get: {
				summary: "OpenAPI JSON",
				responses: { "200": { description: "OK" } },
			},
		},
	},
	components: {
		schemas: {
			SpotType: { type: "string", enum: ["COMPACT", "REGULAR", "LARGE"] },
			VehicleType: { type: "string", enum: ["MOTORCYCLE", "CAR", "BUS"] },
			CreateLotRequest: {
				type: "object",
				required: ["name", "currency", "ratesPerHour", "floors"],
				properties: {
					name: { type: "string", minLength: 1 },
					currency: { type: "string", minLength: 1 },
					ratesPerHour: {
						type: "object",
						properties: {
							COMPACT: { type: "number" },
							REGULAR: { type: "number" },
							LARGE: { type: "number" },
						},
						required: ["COMPACT", "REGULAR", "LARGE"],
					},
					floors: {
						type: "array",
						minItems: 1,
						items: {
							type: "object",
							required: ["level", "spots"],
							properties: {
								level: { type: "integer", minimum: 1 },
								spots: {
									type: "object",
									properties: {
										COMPACT: { type: "integer", minimum: 0 },
										REGULAR: { type: "integer", minimum: 0 },
										LARGE: { type: "integer", minimum: 0 },
									},
								},
							},
						},
					},
				},
			},
			CreateLotResponse: {
				type: "object",
				properties: { lot: { type: "object" } },
			},
			AvailabilityResponse: {
				type: "object",
				properties: {
					lotId: { type: "string" },
					availability: {
						type: "object",
						properties: {
							free: { type: "object" },
							occupied: { type: "object" },
							total: { type: "object" },
						},
					},
				},
			},
			CheckInRequest: {
				type: "object",
				required: ["lotId", "vehicleType", "vehicleNumber"],
				properties: {
					lotId: { type: "string" },
					vehicleType: { $ref: "#/components/schemas/VehicleType" },
					vehicleNumber: { type: "string" },
				},
			},
			CheckInResponse: {
				type: "object",
				properties: {
					ticket: { type: "object" },
					spot: { type: "object" },
				},
			},
			CheckOutRequest: {
				type: "object",
				required: ["ticketId"],
				properties: { ticketId: { type: "string" } },
			},
			CheckOutResponse: {
				type: "object",
				properties: {
					ticket: { type: "object" },
					fee: {
						type: "object",
						properties: {
							durationMinutes: { type: "integer" },
							billableHours: { type: "integer" },
							ratePerHour: { type: "number" },
							totalFee: { type: "number" },
							currency: { type: "string" },
						},
					},
				},
			},
			TicketResponse: {
				type: "object",
				properties: { ticket: { type: "object" } },
			},
		},
	},
} as const;
