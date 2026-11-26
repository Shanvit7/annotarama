// Run with dev server: ego-browser nodejs < scripts/check-annotation-ui.mjs
// Synthetic camera stream: no device access, permissions, or private photos.
const assert = (await import("node:assert/strict")).default;
const existing = (await listTaskSpaces()).find((space) => space.name === "Annotarama live camera quality");
const task = await taskSpace(existing?.id ?? "Annotarama annotation composer QA");
const page = task.page("p1");
console.log({ spaceId: task.spaceId });
await page.goto("http://localhost:3000/capture");
await page.waitForSelector('button:has-text("Start camera")', { state: "visible" });
await page.cdp("Emulation.setDeviceMetricsOverride", { width: 1366, height: 900, deviceScaleFactor: 1, mobile: false });
await page.evaluate(() => {
	const canvas = document.createElement("canvas");
	canvas.width = 1280;
	canvas.height = 960;
	const context = canvas.getContext("2d");
	context.fillStyle = "#cad1d9";
	context.fillRect(0, 0, 1280, 960);
	context.fillStyle = "#8996a3";
	context.fillRect(180, 200, 920, 560);
	context.fillStyle = "#dce1e6";
	context.fillRect(200, 220, 880, 520);
	context.fillStyle = "#354655";
	context.beginPath();
	context.arc(640, 480, 190, 0, Math.PI * 2);
	context.fill();
	context.fillStyle = "#aab4be";
	context.beginPath();
	context.arc(640, 480, 120, 0, Math.PI * 2);
	context.fill();
	context.fillStyle = "#354655";
	for (const x of [260, 1020]) for (const y of [280, 680]) {
		context.beginPath();
		context.arc(x, y, 22, 0, Math.PI * 2);
		context.fill();
	}
	context.font = "24px sans-serif";
	context.fillText("DEMO · Inspection image", 40, 60);
	setInterval(() => context.fillRect(0, 0, 1, 1), 50);
	navigator.mediaDevices.getUserMedia = async () => canvas.captureStream(10);
});
await page.click('text="Start camera"');
await page.waitForSelector('[aria-label="Capture photo"]');
await page.click('[aria-label="Capture photo"]');
await page.waitForSelector('[aria-label="Annotations"]');
const photoDetails = await page.evaluate(() => document.querySelector("#captured-photo-summary-heading")?.parentElement?.textContent ?? "");
assert.match(photoDetails, /Photo details/);
assert.match(photoDetails, /Live quality/);
assert.match(photoDetails, /1280 × 960/);
assert.match(photoDetails, /File size/);
assert.match(photoDetails, /Focus/);
assert.match(photoDetails, /Lighting/);
assert.match(photoDetails, /Stability/);
const desktopSummaryPosition = await page.evaluate(() => {
	const summary = document.querySelector("#captured-photo-summary-heading").parentElement;
	const image = document.querySelector('img[alt^="Captured photo"]').getBoundingClientRect();
	const workspace = document.querySelector("[data-capture-workspace]").getBoundingClientRect();
	return { summaryRight: summary.getBoundingClientRect().right, imageLeft: image.left, imageCenter: image.left + image.width / 2, workspaceCenter: workspace.left + workspace.width / 2 };
});
assert.ok(desktopSummaryPosition.summaryRight <= desktopSummaryPosition.imageLeft, "photo details sit left of the image on desktop");
assert.ok(Math.abs(desktopSummaryPosition.imageCenter - desktopSummaryPosition.workspaceCenter) < 2, "photo stays centered in the overall workspace despite the left card");
const draw = async (index) => {
	const box = await page.evaluate(() => {
		const r = document.querySelector('img[alt^="Captured photo"]').getBoundingClientRect();
		return { x: r.x, y: r.y, w: r.width, h: r.height };
	});
	const x = box.x + box.w * (0.08 + (index % 5) * 0.18);
	const y = box.y + box.h * (0.15 + Math.floor(index / 5) * 0.2);
	await page.mouse.move(x, y);
	await page.mouse.down();
	await page.mouse.move(x + box.w * 0.1, y + box.h * 0.12);
	await page.mouse.up();
	await page.waitForSelector('form[aria-label="Edit annotation label"]');
};
await draw(0);
await page.fill('textarea[name="label"]', "   ");
await page.click('button[aria-label="Save label"]');
assert.match(await page.snapshot(), /Enter a label before saving/);
await page.fill('textarea[name="label"]', "Crack near mounting hole");
await page.click('button[aria-label="Save label"]');
await page.waitForSelector('button[title="Crack near mounting hole"]');
assert.equal(await page.evaluate(() => !!document.querySelector("textarea")), false);
await page.click('button[title="Crack near mounting hole"]');
await page.waitForSelector("textarea");
assert.equal(await page.evaluate(() => document.querySelector("textarea").value), "Crack near mounting hole");
await page.fill('textarea[name="label"]', "Discard this draft");
await page.press('textarea[name="label"]', "Escape");
await page.waitForFunction(() => !document.querySelector("textarea"));
assert.equal(await page.evaluate(() => !!document.querySelector("textarea")), false);
assert.ok(await page.evaluate(() => document.activeElement.matches("[data-annotation-id]")));
for (let index = 1; index < 15; index++) {
	await draw(index);
	await page.fill('textarea[name="label"]', index === 1 ? "Long label with multiple lines\nCheck the mounting surface before reassembly" : `Inspection area ${index + 1}`);
	await page.click('button[aria-label="Save label"]');
	await page.waitForFunction(() => !document.querySelector("textarea"));
}
assert.equal(await page.evaluate(() => document.querySelectorAll("[data-annotation-number]").length), 15);
assert.equal(await page.evaluate(() => document.querySelector('[data-annotation-number="1"]')?.textContent), "1");
await page.click('[aria-label^="Open annotations drawer"]');
await page.waitForSelector('button[aria-label^="Edit label for annotation 1:"]');
await page.click('[aria-label^="Edit label for annotation 1:"]');
await page.waitForSelector("textarea");
console.log({ desktop: await page.screenshot({ path: "/tmp/annotation-ui-desktop.png" }) });
await page.click('button[aria-label="Close label editor"]');
await page.waitForFunction(() => !document.querySelector("textarea"));
const layouts = [];
for (const [width, height] of [[390, 844], [320, 568], [844, 390], [1024, 768]]) {
	await page.cdp("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: true });
	await page.cdp("Emulation.setTouchEmulationEnabled", { enabled: true });
	await page.waitForFunction(() => document.querySelector('[aria-label="Annotations"]').getBoundingClientRect().width > 0);
	const bounds = await page.evaluate(() => {
		const panel = document.querySelector('[aria-label="Annotations"]');
		const list = panel.querySelector("ul");
		const image = document.querySelector('img[alt^="Captured photo"]');
		const r = image.getBoundingClientRect();
		const summary = document.querySelector("#captured-photo-summary-heading").parentElement;
		const summaryBounds = summary.getBoundingClientRect();
		const workspace = document.querySelector("[data-capture-workspace]").getBoundingClientRect();
		return { overflow: document.documentElement.scrollWidth > innerWidth, listHeight: list.clientHeight, contentHeight: list.scrollHeight, panelBottom: panel.getBoundingClientRect().bottom, viewportHeight: innerHeight, imageWidth: r.width, imageHeight: r.height, summaryTop: summaryBounds.top, summaryLeft: summaryBounds.left, summaryRight: summaryBounds.right, imageTop: r.top, imageLeft: r.left, imageRight: r.right, imageBottom: r.bottom, imageCenter: r.left + r.width / 2, workspaceCenter: workspace.left + workspace.width / 2 };
	});
	assert.equal(bounds.overflow, false, `no horizontal overflow at ${width}x${height}`);
	assert.ok(bounds.listHeight > 0 && bounds.contentHeight > bounds.listHeight, "long list scrolls within bounded panel");
	assert.ok(bounds.panelBottom <= bounds.viewportHeight + 1, "list stays inside viewport");
	assert.ok(bounds.imageWidth >= 200 && bounds.imageHeight >= 150 && Math.abs(bounds.imageWidth / bounds.imageHeight - 4 / 3) < 0.01, "photo stays usable and retains exact annotation aspect ratio");
	assert.ok(Math.abs(bounds.imageCenter - bounds.workspaceCenter) < 2, `photo stays centered at ${width}x${height}`);
	if (width >= 1024 || (width >= 640 && height <= 544)) assert.ok(bounds.summaryRight <= bounds.imageLeft, "photo details sit left of image on desktop and short-landscape layouts");
	else assert.ok(bounds.summaryTop >= bounds.imageBottom, "photo details follow image on narrow portrait layouts");
	await page.click('[aria-label^="Edit label for annotation 1:"]');
	await page.waitForSelector("textarea");
	const popup = await page.evaluate(() => {
		const r = document.querySelector('form[aria-label="Edit annotation label"]').getBoundingClientRect();
		const close = document.querySelector('button[aria-label="Close label editor"]');
		const closeBounds = close.getBoundingClientRect();
		const deleteButton = document.querySelector('form button[aria-label^="Delete annotation"]');
		return { x: r.x, y: r.y, right: r.right, bottom: r.bottom, width: r.width, viewportWidth: innerWidth, viewportHeight: innerHeight, closeTop: closeBounds.top, textareaTop: document.querySelector("textarea").getBoundingClientRect().top, deleteText: deleteButton.textContent.trim() };
	});
	assert.ok(popup.width <= 320 && popup.x >= 0 && popup.right <= popup.viewportWidth + 1 && popup.y >= 0 && popup.bottom <= popup.viewportHeight + 1, "compact popup stays within viewport");
	assert.ok(popup.closeTop <= popup.textareaTop + 8, "close icon sits at popup top without spacer row");
	assert.equal(popup.deleteText, "", "delete action is icon-only with accessible name");
	if (width === 390) console.log({ mobile: await page.screenshot({ path: "/tmp/annotation-ui-mobile.png" }) });
	await page.click('button[aria-label="Close label editor"]');
	await page.waitForFunction(() => !document.querySelector("textarea"));
	layouts.push({ width, height, ...bounds });
}
await page.click('[aria-label^="Edit label for annotation 1:"]');
await page.waitForSelector("textarea");
await page.click('form button[aria-label^="Delete annotation"]');
await page.waitForFunction(() => document.querySelectorAll("[data-annotation-id]").length === 14);
await page.waitForFunction(() => document.activeElement.matches("[data-annotation-id]"));
assert.ok(await page.evaluate(() => document.activeElement.matches("[data-annotation-id]")), "delete action returns focus to adjacent annotation");
console.log({ layouts });
console.log("PASS: draw, whitespace validation, save/edit, Escape cancel with focus return, 15 numbered annotations, popup delete, bounded scrolling, exact image alignment, compact popovers, four responsive viewports. Touch-sized controls tested; touch drag and physical keyboard not emulated.");
// Inspect screenshots, then finish this browser space in a separate ego-browser call.
