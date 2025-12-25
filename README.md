# Smart Parking Lot System (Backend)

Smart parking lot backend built with TypeScript + Express.

It supports:

-   Creating a multi-floor lot (counts-based spot generation)
-   Allocating parking spots automatically (smallest compatible spot)
-   Recording check-in and check-out times
-   Calculating fees on exit (started-hour billing)
-   Real-time availability per spot type

## Quick start

**Requirements**: Node.js (any recent LTS recommended) + npm

```bash
npm install
npm run dev
```

Server runs at `http://localhost:3000`.

## API docs (OpenAPI/Swagger)

-   OpenAPI JSON: `GET /openapi.json`
-   Swagger UI: `GET /api-docs` (browser)

## Business rules

### Vehicle sizes

`MOTORCYCLE < CAR < BUS`

### Spot sizes

`COMPACT < REGULAR < LARGE`

### Allocation

-   The system assigns the **smallest compatible available** spot.
-   If smaller spots are full, smaller vehicles can use larger spots.

Compatibility summary:

-   `MOTORCYCLE` → `COMPACT | REGULAR | LARGE`
-   `CAR` → `REGULAR | LARGE`
-   `BUS` → `LARGE`

### Billing

-   **Started-hour** billing: any positive duration counts as at least 1 billable hour.
-   Charged based on the **spot type actually used** (`COMPACT|REGULAR|LARGE`).

## Architecture (high level)

-   **Routes/Controllers**: HTTP layer, validates inputs and calls services
-   **Services**: business logic (allocation, ticketing, pricing)
-   **Repos (in-memory)**: stores lots/spots/tickets in memory
-   **Concurrency**: per-`lotId` async mutex ensures safe parallel check-in/out in a single Node process

## Project structure

```text
src/
  app.ts                 # Express bootstrap
  config/                # Config/constants
  controllers/           # HTTP controllers
  domain/                # Core types + rules
  middleware/            # Express middleware (error handling)
  repos/memory/          # In-memory storage and repos
  routes/                # API routes
  services/              # Allocation, pricing, ticketing
  utils/                 # time/id/mutex helpers
docs/
  schema.md              # DB-ready schema + concurrency notes
```

## Scripts

-   `npm run dev` - run server with watch mode
-   `npm run build` - compile TypeScript to `dist/`
-   `npm start` - run compiled server from `dist/`
-   `npm test` - run test suite (Vitest)
-   `npm run test:watch` - run tests in watch mode

## Testing

This project uses:

-   **Vitest** for unit/integration tests
-   **Supertest** for HTTP API tests (without starting a real network server)

Run all tests:

```bash
npm test
```

Watch mode:

```bash
npm run test:watch
```

## API Reference

Base path: `/api/v1`

### 1) Create lot (counts-based)

Creates a parking lot and generates spots based on per-floor counts.

`POST /lots`

Request body:

```json
{
	"name": "Downtown Lot",
	"currency": "INR",
	"ratesPerHour": { "COMPACT": 50, "REGULAR": 80, "LARGE": 120 },
	"floors": [
		{ "level": 1, "spots": { "COMPACT": 10, "REGULAR": 10, "LARGE": 2 } },
		{ "level": 2, "spots": { "COMPACT": 10, "REGULAR": 10, "LARGE": 2 } }
	]
}
```

Example:

```bash
curl -s -X POST http://localhost:3000/api/v1/lots \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "Downtown Lot",
    "currency": "INR",
    "ratesPerHour": { "COMPACT": 50, "REGULAR": 80, "LARGE": 120 },
    "floors": [
      { "level": 1, "spots": { "COMPACT": 10, "REGULAR": 10, "LARGE": 2 } },
      { "level": 2, "spots": { "COMPACT": 10, "REGULAR": 10, "LARGE": 2 } }
    ]
  }'
```

Response:

-   `201` with `{ lot }`

### 2) Availability

Returns free/occupied/total counts per spot type.

`GET /lots/:lotId/availability`

```bash
curl -s http://localhost:3000/api/v1/lots/<lotId>/availability
```

Response:

-   `200` with `{ lotId, availability }`

### 3) Check-in

Allocates a spot and issues a ticket.

`POST /checkins`

Request body:

```json
{ "lotId": "<lotId>", "vehicleType": "CAR", "vehicleNumber": "DL01AB1234" }
```

Example:

```bash
curl -s -X POST http://localhost:3000/api/v1/checkins \
  -H 'Content-Type: application/json' \
  -d '{
    "lotId": "<lotId>",
    "vehicleType": "CAR",
    "vehicleNumber": "DL01AB1234"
  }'
```

Response:

-   `201` with `{ ticket, spot }`

### 4) Check-out

Closes a ticket, releases the spot, and returns the fee breakdown.

`POST /checkouts`

Request body:

```json
{ "ticketId": "<ticketId>" }
```

Example:

```bash
curl -s -X POST http://localhost:3000/api/v1/checkouts \
  -H 'Content-Type: application/json' \
  -d '{ "ticketId": "<ticketId>" }'
```

Response:

-   `200` with `{ ticket, fee }`

### 5) Get ticket

`GET /tickets/:ticketId`

```bash
curl -s http://localhost:3000/api/v1/tickets/<ticketId>
```

## Error handling

-   Validation errors return `400` with `{ error, details? }`
-   Not found returns `404`
-   Conflicts (e.g., lot full / ticket closed) return `409`

## Logging / Observability

-   Every request gets a `X-Request-Id`.
    -   If the client sends `X-Request-Id`, the server echoes it back.
    -   Otherwise, the server generates one.
-   Each request is logged as a single JSON line to stdout with `requestId`, method, path, status, and duration.
-   Each request is logged as a single JSON line to stdout (and also appended to `logs/app.log`).

## Design notes

-   Spot selection is deterministic: within a spot type, the earliest spot by `(level asc, spotNumber asc)` is chosen.
-   In-memory storage is used for the assignment; the DB-ready schema and transaction notes are in `docs/schema.md`.

## Limitations

-   In-memory storage resets on server restart.
-   Mutex-based concurrency is safe for a single Node process; multi-instance deployments require a database transaction strategy.

## Docs

-   `docs/schema.md` (schema + allocation + concurrency notes)
