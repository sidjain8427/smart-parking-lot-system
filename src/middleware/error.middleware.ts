import type { NextFunction, Request, Response } from "express";
import { HttpError } from "../domain/errors";
import { getRequestIdFromResponse } from "./request-context.middleware";
import { writeJsonLogLine } from "../utils/file-logger";

export function errorMiddleware(err: unknown, _req: Request, res: Response, _next: NextFunction) {
	const requestId = getRequestIdFromResponse(res);
	if (err instanceof HttpError) {
		res.status(err.status).json({ error: err.message, details: err.details, requestId });
		return;
	}

	// Best-effort error log (request log happens on res.finish)
	const errorPayload = {
		timestamp: new Date().toISOString(),
		level: "error",
		event: "unhandled_error",
		requestId,
		message: err instanceof Error ? err.message : "Unknown error",
	};
	console.error(JSON.stringify(errorPayload));
	writeJsonLogLine(errorPayload);

	res.status(500).json({ error: "Internal Server Error", requestId });
}
