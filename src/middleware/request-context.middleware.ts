import type { NextFunction, Request, Response } from "express";
import { randomUUID } from "crypto";
import { writeJsonLogLine } from "../utils/file-logger";

export const REQUEST_ID_HEADER = "x-request-id";

function nowIso(): string {
	return new Date().toISOString();
}

function getRequestId(req: Request): string {
	const headerValue = req.header(REQUEST_ID_HEADER);
	if (typeof headerValue === "string" && headerValue.trim().length > 0) return headerValue.trim();
	return randomUUID();
}

export function requestContextMiddleware(req: Request, res: Response, next: NextFunction) {
	const requestId = getRequestId(req);
	(res.locals as any).requestId = requestId;
	res.setHeader(REQUEST_ID_HEADER, requestId);

	const start = process.hrtime.bigint();
	res.on("finish", () => {
		const end = process.hrtime.bigint();
		const durationMs = Number(end - start) / 1e6;

		const payload = {
			timestamp: nowIso(),
			level: "info",
			event: "http_request",
			requestId,
			method: req.method,
			path: req.originalUrl,
			status: res.statusCode,
			durationMs: Math.round(durationMs * 1000) / 1000,
		};

		// JSON logs are easy to ingest in real systems.
		console.log(JSON.stringify(payload));
		writeJsonLogLine(payload);
	});

	next();
}

export function getRequestIdFromResponse(res: Response): string | undefined {
	return (res.locals as any).requestId;
}
