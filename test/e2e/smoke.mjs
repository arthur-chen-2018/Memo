/**
 * E2E Smoke Tests for Memo App
 *
 * Verifies navigation, view loading, and all interactive features.
 * Uses UI5 control API (sap.ui.getCore().byId().firePress() etc.) to
 * reliably trigger UI5 events — native DOM click() doesn't always fire
 * UI5 event handlers.
 *
 * Usage: node test/e2e/smoke.mjs [--port 8080] [--headed]
 *   Expects the UI5 dev server to already be running.
 */

import { chromium } from "playwright";

const PORT = process.argv.includes("--port")
	? process.argv[process.argv.indexOf("--port") + 1]
	: "8080";
const HEADED = process.argv.includes("--headed");
const BASE = `http://localhost:${PORT}/index.html`;
const TIMEOUT = 30_000;

let browser, page;
const results = [];
const consoleErrors = [];

function collectConsoleErrors(msg) {
	if (msg.type() === "error") {
		const text = msg.text();
		if (
			text.includes("favicon.ico") ||
			text.includes("livereload") ||
			text.includes("templateShareable") ||
			text.includes("[FUTURE FATAL]")
		) return;
		consoleErrors.push(text);
	}
}

function drainErrors() {
	const errors = [...consoleErrors];
	consoleErrors.length = 0;
	return errors;
}

async function run(name, fn) {
	drainErrors();
	try {
		await fn();
		const testErrors = drainErrors();
		if (testErrors.length > 0) {
			results.push({ name, pass: false, errors: testErrors });
		} else {
			results.push({ name, pass: true });
		}
	} catch (err) {
		const testErrors = drainErrors();
		results.push({
			name,
			pass: false,
			errors: [...testErrors, err.message]
		});
	}
}

// ---------------------------------------------------------------------------
// UI5 Helpers — all interact via sap.ui.getCore() for reliable event firing
// ---------------------------------------------------------------------------

/** Wait for a MessageToast */
async function waitForToast(text, timeout = 10_000) {
	await page.waitForFunction(
		(t) => Array.from(document.querySelectorAll(".sapMMessageToast"))
			.some((el) => el.textContent.includes(t)),
		text,
		{ timeout }
	);
}

/** Find a UI5 control by partial DOM id and invoke firePress() */
async function ui5Press(partialId) {
	await page.evaluate((pid) => {
		const els = document.querySelectorAll(`[id*='${pid}']`);
		for (const el of els) {
			const c = sap.ui.getCore().byId(el.id);
			if (c && c.firePress) { c.firePress(); return; }
		}
		throw new Error(`No UI5 control with firePress matching '${pid}'`);
	}, partialId);
}

/** Set a UI5 Select's selectedKey */
async function ui5SelectKey(partialId, key) {
	await page.evaluate(({ pid, key }) => {
		const els = document.querySelectorAll(`[id*='${pid}']`);
		for (const el of els) {
			const c = sap.ui.getCore().byId(el.id);
			if (c && c.setSelectedKey) {
				c.setSelectedKey(key);
				c.fireChange({ selectedItem: c.getSelectedItem() });
				return;
			}
		}
		throw new Error(`No UI5 Select matching '${pid}'`);
	}, { pid: partialId, key });
}

/** Set a UI5 Input/TextArea value */
async function ui5SetValue(partialId, value) {
	await page.evaluate(({ pid, value }) => {
		const els = document.querySelectorAll(`[id*='${pid}']`);
		for (const el of els) {
			const c = sap.ui.getCore().byId(el.id);
			if (c && c.setValue) {
				c.setValue(value);
				if (c.fireLiveChange) c.fireLiveChange({ value });
				return;
			}
		}
		throw new Error(`No UI5 Input/TextArea matching '${pid}'`);
	}, { pid: partialId, value });
}

/** Fire beginButton press on a UI5 Dialog */
async function ui5DialogSubmit(partialId) {
	await page.evaluate((pid) => {
		const els = document.querySelectorAll(`[id*='${pid}']`);
		for (const el of els) {
			const c = sap.ui.getCore().byId(el.id);
			if (c && c.getBeginButton) {
				c.getBeginButton().firePress();
				return;
			}
		}
		throw new Error(`No UI5 Dialog matching '${pid}'`);
	}, partialId);
}

/** Fire a button press by matching button text within a container */
async function ui5PressButtonByText(containerSelector, text) {
	await page.evaluate(({ sel, text }) => {
		const container = sel ? document.querySelector(sel) : document;
		const buttons = container.querySelectorAll("button");
		for (const btn of buttons) {
			if (btn.textContent.includes(text)) {
				const c = sap.ui.getCore().byId(btn.id);
				if (c && c.firePress) { c.firePress(); return; }
				// fallback: native click
				btn.click();
				return;
			}
		}
		throw new Error(`Button with text '${text}' not found`);
	}, { sel: containerSelector, text });
}

/** Dismiss any open dialogs */
async function dismissDialogs() {
	for (let i = 0; i < 3; i++) {
		const blockLayer = await page.$(".sapUiBLy");
		if (!blockLayer) break;
		await page.keyboard.press("Escape");
		await page.waitForTimeout(500);
	}
}

// ===========================================================================
// 1. NAVIGATION TESTS
// ===========================================================================

async function testAppLoads() {
	await page.goto(BASE, { waitUntil: "domcontentloaded" });
	await page.waitForSelector(".sapMListTblRow:not(.sapMListTblHeader)", { timeout: TIMEOUT });
	const rows = await page.$$(".sapMListTblRow:not(.sapMListTblHeader)");
	if (rows.length < 10) throw new Error(`Expected at least 10 data rows, got ${rows.length}`);
}

async function testRowClickNavigation() {
	// Use UI5 List's fireItemPress on the first item
	await page.evaluate(() => {
		const rows = document.querySelectorAll(".sapMListTblRow:not(.sapMListTblHeader)");
		if (!rows.length) throw new Error("No table rows");
		const ctrl = sap.ui.getCore().byId(rows[0].id);
		if (ctrl && ctrl.firePress) ctrl.firePress();
		else rows[0].click(); // fallback
	});
	await page.waitForFunction(() => window.location.hash.includes("memo/"), { timeout: TIMEOUT });
	await page.waitForSelector(".sapUxAPObjectPageLayout", { timeout: TIMEOUT });
}

async function testBackNavigation() {
	await page.goBack();
	await page.waitForFunction(() => ["", "#/", "#"].includes(window.location.hash), { timeout: TIMEOUT });
	await page.waitForSelector(".sapMListTblRow:not(.sapMListTblHeader)", { timeout: TIMEOUT });
}

async function testDirectNavErrors() {
	await page.goto(`${BASE}#/errors`, { waitUntil: "domcontentloaded" });
	await page.waitForSelector(".errorMonitorContent", { timeout: TIMEOUT });
}

async function testDirectNavMemoConversation() {
	await page.goto(`${BASE}#/memo/3`, { waitUntil: "domcontentloaded" });
	await page.waitForSelector(".sapUxAPObjectPageLayout", { timeout: TIMEOUT });
}

// ===========================================================================
// 2. NEW MEMO DIALOG (from MemoList)
// ===========================================================================

async function testNewMemoDialogOpens() {
	await page.goto(BASE, { waitUntil: "domcontentloaded" });
	await page.waitForSelector(".sapMListTblRow:not(.sapMListTblHeader)", { timeout: TIMEOUT });

	// Find and fire press on "New Memo" button via UI5 API
	await ui5PressButtonByText(null, "New Memo");
	await page.waitForTimeout(1000);

	await page.waitForSelector("[id*='newMemoDialog']", { timeout: TIMEOUT });
}

async function testNewMemoValidation() {
	// Submit without filling required fields
	await ui5DialogSubmit("newMemoDialog");
	await page.waitForTimeout(1000);

	// Dialog should still be open with error indicators
	const state = await page.evaluate(() => {
		// Check if dialog is open via UI5 API
		const els = document.querySelectorAll("[id*='newMemoDialog']");
		for (const el of els) {
			const c = sap.ui.getCore().byId(el.id);
			if (c && c.isOpen) {
				return {
					open: c.isOpen(),
					hasErrors: !!(el.querySelector(".sapMInputBaseError") || el.querySelector(".sapMSltError"))
				};
			}
		}
		return { open: false, hasErrors: false };
	});
	if (!state.open) throw new Error("Dialog closed without validation");
	if (!state.hasErrors) throw new Error("Expected validation error indicators");
}

async function testNewMemoSubmit() {
	await ui5SelectKey("newMemoType", "Access Issue");
	await ui5SetValue("newMemoSubject", "E2E Test Subject");
	await ui5SetValue("newMemoMessage", "E2E test message body");

	await ui5DialogSubmit("newMemoDialog");
	await waitForToast("Memo created successfully");
}

// ===========================================================================
// 3. SIDEBAR NAVIGATION
// ===========================================================================

async function testSidebarNavigation() {
	await page.goto(`${BASE}#/memo/1`, { waitUntil: "domcontentloaded" });
	await page.waitForSelector(".sapUxAPObjectPageLayout", { timeout: TIMEOUT });
	await page.waitForSelector(".memoSidebar .sapMSLI", { timeout: TIMEOUT });

	// Wait for sidebar items to have binding contexts (data fully bound)
	await page.waitForFunction(() => {
		const listEl = document.querySelector("[id*='sidebarList']");
		if (!listEl) return false;
		const list = sap.ui.getCore().byId(listEl.id);
		if (!list) return false;
		const items = list.getItems();
		return items.length >= 2 && items[1].getBindingContext("viewModel");
	}, { timeout: TIMEOUT });

	const hashBefore = await page.evaluate(() => window.location.hash);

	// Fire the List's itemPress event with a sidebar item whose memo ID differs
	// from the current one. Previous tests may have added memos to this work order,
	// so we can't assume items[1] is a different memo.
	await page.evaluate((currentHash) => {
		const listEl = document.querySelector("[id*='sidebarList']");
		const list = sap.ui.getCore().byId(listEl.id);
		const items = list.getItems();
		// Find the current memo ID from the hash (e.g. "#/memo/1" → "1")
		const currentId = parseInt(currentHash.replace("#/memo/", ""), 10);
		const target = items.find((it) => {
			const ctx = it.getBindingContext("viewModel");
			return ctx && ctx.getProperty("id") !== currentId;
		});
		if (!target) throw new Error("No sidebar item with a different memo ID");
		list.fireItemPress({ listItem: target });
	}, hashBefore);

	// Verify hash changed (navigation occurred)
	await page.waitForFunction(
		(old) => window.location.hash !== old,
		hashBefore,
		{ timeout: TIMEOUT }
	);
	await page.waitForSelector(".sapUxAPObjectPageLayout", { timeout: TIMEOUT });
}

// ===========================================================================
// 4. COMPOSE & SEND MESSAGE
// ===========================================================================

async function testComposeAndSend() {
	await page.goto(`${BASE}#/memo/2`, { waitUntil: "domcontentloaded" });
	await page.waitForSelector(".sapUxAPObjectPageLayout", { timeout: TIMEOUT });
	await page.waitForTimeout(1000);

	// Set reply text via model
	await page.evaluate(() => {
		const el = document.querySelector("[id*='composeTextArea']");
		if (!el) throw new Error("composeTextArea not found in DOM");
		const ctrl = sap.ui.getCore().byId(el.id);
		if (!ctrl) throw new Error("composeTextArea UI5 control not found");
		ctrl.setValue("E2E test reply");
		const model = ctrl.getModel("viewModel");
		if (model) model.setProperty("/replyText", "E2E test reply");
	});
	await page.waitForTimeout(500);

	// Fire send button press
	await ui5Press("sendButton");
	await waitForToast("Message sent successfully");
}

// ===========================================================================
// 5. STATUS CHANGE DIALOG
// ===========================================================================

async function testStatusChangeDialog() {
	// Navigate to memo 5 which might have more transitions
	// Actually, let's use memo 2 (status: "New") → transitions: ["Released", "In Progress"]
	await page.goto(`${BASE}#/memo/2`, { waitUntil: "domcontentloaded" });
	await page.waitForSelector(".sapUxAPObjectPageLayout", { timeout: TIMEOUT });
	await page.waitForTimeout(500);

	await ui5PressButtonByText(".sapUxAPObjectPageLayout", "Change Status");
	await page.waitForTimeout(1000);
	await page.waitForSelector("[id*='statusChangeDialog']", { timeout: TIMEOUT });

	await ui5SelectKey("statusSelect", "In Progress");
	await ui5DialogSubmit("statusChangeDialog");
	await waitForToast("Status changed to");
}

// ===========================================================================
// 6. NEW MEMO FROM CONVERSATION
// ===========================================================================

async function testNewMemoFromConversation() {
	await page.goto(`${BASE}#/memo/3`, { waitUntil: "domcontentloaded" });
	await page.waitForSelector(".sapUxAPObjectPageLayout", { timeout: TIMEOUT });
	await dismissDialogs();
	await page.waitForTimeout(500);

	await ui5PressButtonByText(".sapUxAPObjectPageLayout", "New Memo");
	await page.waitForTimeout(1000);
	await page.waitForSelector("[id*='newMemoDialog']", { timeout: TIMEOUT });

	// Cancel
	await page.keyboard.press("Escape");
	await page.waitForTimeout(500);
}

// ===========================================================================
// 7. ATTACHMENTS TAB & VIEWER
// ===========================================================================

async function testAttachmentsTab() {
	await page.goto(`${BASE}#/memo/1`, { waitUntil: "domcontentloaded" });
	await page.waitForSelector(".sapUxAPObjectPageLayout", { timeout: TIMEOUT });
	await dismissDialogs();
	await page.waitForTimeout(500);

	// Click the Attachments anchor bar button via UI5 API
	await page.evaluate(() => {
		// Find the ObjectPageLayout and navigate to attachments section
		const opEl = document.querySelector("[id*='objectPageLayout']");
		if (!opEl) throw new Error("objectPageLayout not found");
		const op = sap.ui.getCore().byId(opEl.id);
		const sections = op.getSections();
		// Find the attachments section (index 1 based on XML order: Messages=0, Attachments=1, Details=2)
		const attSection = sections.find(s => s.getTitle && s.getTitle().includes("Attachments"));
		if (!attSection) throw new Error("Attachments section not found");
		op.setSelectedSection(attSection);
	});

	await page.waitForTimeout(1000);

	// Verify attachment rows are visible somewhere in the page
	const hasAttachments = await page.evaluate(() => {
		const links = document.querySelectorAll(".sapMLnk");
		return links.length > 0;
	});
	if (!hasAttachments) throw new Error("No attachment links found after switching to Attachments tab");
}

async function testAttachmentViewer() {
	// Click the first attachment Link (scoped to attachments section, not breadcrumbs)
	await page.evaluate(() => {
		const opEl = document.querySelector("[id*='objectPageLayout']");
		const op = sap.ui.getCore().byId(opEl.id);
		const sections = op.getSections();
		const attSection = sections.find(s => s.getTitle && s.getTitle().includes("Attachments"));
		if (!attSection) throw new Error("Attachments section not found");
		const sectionDom = attSection.getDomRef();
		if (!sectionDom) throw new Error("Attachments section not rendered");
		const links = sectionDom.querySelectorAll(".sapMLnk");
		for (const link of links) {
			if (link.offsetParent !== null) {
				const ctrl = sap.ui.getCore().byId(link.id);
				if (ctrl && ctrl.firePress) { ctrl.firePress(); return; }
			}
		}
		throw new Error("No visible attachment link found in Attachments section");
	});

	await page.waitForSelector("[id*='attachmentViewerDialog']", { timeout: TIMEOUT });
	await page.waitForSelector(".viewerFilename", { timeout: 5000 });

	// Close via Escape (registered keyboard handler)
	await page.keyboard.press("Escape");
	await page.waitForTimeout(500);
}

// ===========================================================================
// 8. MEMO LIST FILTER
// ===========================================================================

async function testMemoListFilter() {
	await page.goto(BASE, { waitUntil: "domcontentloaded" });
	await page.waitForSelector(".sapMListTblRow:not(.sapMListTblHeader)", { timeout: TIMEOUT });

	const beforeCount = (await page.$$(".sapMListTblRow:not(.sapMListTblHeader)")).length;

	// Set filter value — only memo 9 has JOB-92345
	await ui5SetValue("filterJobNumber", "JOB-92345");

	// Press Go
	await ui5PressButtonByText("[id*='filterToolbar']", "Go");
	await page.waitForTimeout(1500);

	const afterCount = (await page.$$(".sapMListTblRow:not(.sapMListTblHeader)")).length;
	if (afterCount >= beforeCount) {
		throw new Error(`Expected fewer rows after filter, got ${afterCount} (was ${beforeCount})`);
	}

	// Press Clear
	await ui5PressButtonByText("[id*='filterToolbar']", "Clear");
	await page.waitForTimeout(1500);

	const resetCount = (await page.$$(".sapMListTblRow:not(.sapMListTblHeader)")).length;
	if (resetCount < beforeCount) {
		throw new Error(`Expected rows restored after Clear, got ${resetCount} (was ${beforeCount})`);
	}
}

// ===========================================================================
// 9. ERROR MONITOR
// ===========================================================================

async function testErrorMonitorInteractions() {
	await page.goto(`${BASE}#/errors`, { waitUntil: "domcontentloaded" });
	await page.waitForSelector(".errorMonitorContent", { timeout: TIMEOUT });
	await page.waitForSelector("[id*='errorList'] .sapMLIB", { timeout: TIMEOUT });
	await page.waitForTimeout(500);

	// Click expand button on first error — find button with title "Expand"
	await page.evaluate(() => {
		const items = document.querySelectorAll("[id*='errorList'] .sapMLIB");
		if (!items.length) throw new Error("No error list items");
		const buttons = items[0].querySelectorAll("button");
		for (const btn of buttons) {
			if (btn.getAttribute("title") === "Expand") {
				const c = sap.ui.getCore().byId(btn.id);
				if (c && c.firePress) { c.firePress(); return; }
				btn.click();
				return;
			}
		}
		throw new Error("Expand button not found in first error item");
	});

	await page.waitForTimeout(500);
}

async function testErrorMonitorFilter() {
	await ui5SelectKey("errFilterStatus", "Unresolved");
	await ui5PressButtonByText(".errorMonitorContent", "Go");
	await page.waitForTimeout(1000);

	await ui5PressButtonByText(".errorMonitorContent", "Clear");
	await page.waitForTimeout(1000);
}

// ===========================================================================
// 10. SHELL BAR
// ===========================================================================

async function testShellBarNavigation() {
	await page.goto(`${BASE}#/memo/1`, { waitUntil: "domcontentloaded" });
	await page.waitForSelector(".sapUxAPObjectPageLayout", { timeout: TIMEOUT });

	// Click error button via UI5 API
	await ui5Press("shellBarErrors");
	await page.waitForSelector(".errorMonitorContent", { timeout: TIMEOUT });

	// Navigate home via ShellBar homeIconPressed
	await page.evaluate(() => {
		const sbEl = document.querySelector("[id*='shellBar']");
		if (!sbEl) throw new Error("ShellBar not found");
		const sb = sap.ui.getCore().byId(sbEl.id);
		if (sb && sb.fireHomeIconPressed) {
			sb.fireHomeIconPressed();
		}
	});
	await page.waitForSelector(".sapMListTblRow:not(.sapMListTblHeader)", { timeout: TIMEOUT });
}

// ===========================================================================
// Runner
// ===========================================================================

async function main() {
	browser = await chromium.launch({ headless: !HEADED });
	const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
	page = await context.newPage();
	page.on("console", collectConsoleErrors);

	// --- Navigation ---
	await run("App loads — MemoList renders data rows", testAppLoads);
	await run("Row click → MemoConversation", testRowClickNavigation);
	await run("Back navigation → MemoList", testBackNavigation);
	await run("Direct navigation → ErrorMonitor", testDirectNavErrors);
	await run("Direct hash → MemoConversation (#/memo/3)", testDirectNavMemoConversation);

	// --- New Memo (from MemoList) ---
	await run("New Memo dialog opens from MemoList", testNewMemoDialogOpens);
	await run("New Memo validation (empty submit blocked)", testNewMemoValidation);
	await run("New Memo submit with valid data", testNewMemoSubmit);

	// --- Conversation interactions ---
	await run("Sidebar navigation between memos", testSidebarNavigation);
	await run("Compose and send message", testComposeAndSend);
	await run("Status change dialog", testStatusChangeDialog);
	await run("New Memo dialog from conversation (open + cancel)", testNewMemoFromConversation);

	// --- Attachments ---
	await run("Attachments tab loads with data", testAttachmentsTab);
	await run("Attachment viewer opens and closes", testAttachmentViewer);

	// --- MemoList filter ---
	await run("MemoList filter (Go + Clear)", testMemoListFilter);

	// --- Error Monitor ---
	await run("Error Monitor interactions (expand)", testErrorMonitorInteractions);
	await run("Error Monitor filter (Go + Clear)", testErrorMonitorFilter);

	// --- Shell Bar ---
	await run("ShellBar navigation (errors + home)", testShellBarNavigation);

	await browser.close();

	// Report
	console.log("");
	let passed = 0;
	for (const r of results) {
		if (r.pass) {
			console.log(`[PASS] ${r.name}`);
			passed++;
		} else {
			console.log(`[FAIL] ${r.name}`);
			for (const e of r.errors) {
				console.log(`  ${e}`);
			}
		}
	}
	console.log(`\n${passed}/${results.length} tests passed`);
	return passed === results.length ? 0 : 1;
}

const exitCode = await main();
process.exit(exitCode);
