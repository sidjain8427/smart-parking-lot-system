# Data model (DB-ready)

This project runs in-memory for the assignment, but the model maps cleanly to a relational DB.

## Core tables

### parking_lots

-   `id` (pk)
-   `name`
-   `currency`
-   `created_at`

### lot_rates

Fixed per-hour rates by spot size.

-   `lot_id` (fk parking_lots.id)
-   `spot_type` (`COMPACT|REGULAR|LARGE`)
-   `rate_per_hour`
-   primary key: (`lot_id`, `spot_type`)

### floors

-   `id` (pk)
-   `lot_id` (fk)
-   `level` (int)
-   unique: (`lot_id`, `level`)

### spots

-   `id` (pk)
-   `lot_id` (fk)
-   `floor_id` (fk)
-   `level` (denormalized, optional)
-   `spot_number` (int)
-   `spot_type` (`COMPACT|REGULAR|LARGE`)
-   `status` (`FREE|OCCUPIED`)
-   unique: (`floor_id`, `spot_type`, `spot_number`) or (`floor_id`, `spot_number`) depending on numbering scheme

### tickets

-   `id` (pk)
-   `lot_id` (fk)
-   `spot_id` (fk)
-   `vehicle_type` (`MOTORCYCLE|CAR|BUS`)
-   `vehicle_number`
-   `spot_type_used` (`COMPACT|REGULAR|LARGE`) (captured at check-in)
-   `check_in_at`
-   `check_out_at` (nullable)
-   `status` (`OPEN|CLOSED`)

## Allocation algorithm

1. Determine compatible spot types in increasing size order (smallest first).
2. Pick the first spot type with availability.
3. Choose the earliest spot by `(level asc, spot_number asc)`.

This ensures: smallest-compatible-first, and deterministic selection.

## Billing

-   Started-hour billing: if `checkOutAt > checkInAt`, billable hours = $\lceil \Delta t / 1\,hour \rceil$.
-   Fee is charged by the **allocated spot type used**: `fee = billableHours * ratePerHour[spot_type_used]`.

## Concurrency

### In-memory (single Node process)

-   Use a per-`lotId` mutex around:
    -   allocate spot + mark occupied + create ticket
    -   close ticket + mark free + release spot

### Database-backed (multi-instance)

-   Wrap check-in in a transaction.
-   Lock candidate spots row(s) (`SELECT ... FOR UPDATE`) or update with conditional predicate:
    -   `UPDATE spots SET status='OCCUPIED' WHERE id=? AND status='FREE'`
-   Insert the ticket in the same transaction.
-   Ensure `tickets` has at most one open ticket per spot via constraints (or enforce by transaction logic).
