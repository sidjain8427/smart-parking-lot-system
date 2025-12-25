import express, { type Express } from "express";
import { errorMiddleware } from "./middleware/error.middleware";
import { requestContextMiddleware } from "./middleware/request-context.middleware";
import { buildOpenApiRouter } from "./openapi/router";
import { buildRouter } from "./routes/routes";
import { createContainer, type Container } from "./services/container";

export function createApp(container: Container = createContainer()): Express {
	const app: Express = express();

	app.use(requestContextMiddleware);
	app.use(express.urlencoded({ extended: true }));
	app.use(express.json());

	app.get("/", (_req, res) => {
		res.json({ message: "Smart Parking Lot System API" });
	});

	app.use(buildOpenApiRouter());

	app.use(buildRouter(container));
	app.use(errorMiddleware);

	return app;
}

if (require.main === module) {
	const port: number = 3000;
	const app = createApp();
	app.listen(port, () => {
		console.log(`Server is running on http://localhost:${port}`);
	});
}
