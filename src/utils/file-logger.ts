import { appendFile, mkdir } from "fs/promises";
import path from "path";

const logsDir = path.join(process.cwd(), "logs");
const logFilePath = path.join(logsDir, "app.log");

let ensured = false;
let chain: Promise<void> = Promise.resolve();

async function ensureDir() {
	if (ensured) return;
	await mkdir(logsDir, { recursive: true });
	ensured = true;
}

export function writeJsonLogLine(payload: unknown): void {
	// Serialize writes to keep lines intact and ordered.
	chain = chain
		.then(async () => {
			await ensureDir();
			await appendFile(logFilePath, `${JSON.stringify(payload)}\n`, { encoding: "utf8" });
		})
		.catch(() => {
			// Don't crash the app if logging fails.
		});
}
