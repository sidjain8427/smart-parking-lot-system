import { Router } from "express";
import swaggerUi from "swagger-ui-express";
import { openApiSpec } from "./spec";

export function buildOpenApiRouter() {
	const router = Router();

	router.get("/openapi.json", (_req, res) => {
		res.json(openApiSpec);
	});

	router.use("/api-docs", swaggerUi.serve, swaggerUi.setup(openApiSpec));

	return router;
}
