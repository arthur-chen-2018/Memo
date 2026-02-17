/**
 * E2E Test Orchestrator
 *
 * Starts the UI5 dev server, waits for it to be ready,
 * runs the smoke tests, then kills the server.
 *
 * Exit code 0 = all tests passed, 1 = failures.
 *
 * Usage: node test/e2e/run.mjs [--headed]
 */

import { spawn, execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, "..", "..");
const PORT = "8080";
const READY_URL = `http://localhost:${PORT}/index.html`;
const MAX_WAIT = 60_000; // 60 s for server startup

function sleep(ms) {
	return new Promise((r) => setTimeout(r, ms));
}

async function waitForServer() {
	const start = Date.now();
	while (Date.now() - start < MAX_WAIT) {
		try {
			const res = await fetch(READY_URL);
			if (res.ok) return true;
		} catch {
			// not ready yet
		}
		await sleep(1000);
	}
	return false;
}

async function main() {
	console.log("Starting UI5 dev server…");
	const server = spawn("npx", ["ui5", "serve", "--port", PORT], {
		cwd: PROJECT_ROOT,
		stdio: "pipe",
		shell: true
	});

	// Forward server stderr so startup errors are visible
	server.stderr.on("data", (chunk) => {
		const text = chunk.toString();
		if (text.includes("ERROR") || text.includes("error")) {
			process.stderr.write(`[server] ${text}`);
		}
	});

	const ready = await waitForServer();
	if (!ready) {
		console.error("Server did not start within 60 s — aborting.");
		server.kill();
		process.exit(1);
	}
	console.log("Server ready.\n");

	// Run smoke tests
	const args = ["--port", PORT];
	if (process.argv.includes("--headed")) args.push("--headed");

	const smokeFile = join(__dirname, "smoke.mjs");
	const testProc = spawn("node", [smokeFile, ...args], {
		cwd: PROJECT_ROOT,
		stdio: "inherit",
		shell: true
	});

	const exitCode = await new Promise((resolve) => {
		testProc.on("close", (code) => resolve(code ?? 1));
	});

	// Cleanup
	server.kill();
	// On Windows, killing the shell may leave the child alive
	try {
		if (process.platform === "win32" && server.pid) {
			execSync(`taskkill /PID ${server.pid} /T /F 2>nul`, { stdio: "ignore" });
		}
	} catch {
		// ignore
	}

	process.exit(exitCode);
}

main();
