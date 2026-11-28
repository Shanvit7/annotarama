// Run with dev server: ego-browser nodejs < scripts/ego-browser/check-annotation-ui.mjs
// Synthetic camera only. Override globalThis.egoCheckBaseUrl for another port.
const assert = (await import("node:assert/strict")).default;
const task = await taskSpace(`Annotarama annotation QA ${Date.now()}`);
const page = task.page("p1");
const baseUrl = globalThis.egoCheckBaseUrl ?? "http://localhost:3000";
console.log({ spaceId: task.spaceId });
await page.goto(`${baseUrl}/capture`);
await page.cdp("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
await page.cdp("Emulation.setTouchEmulationEnabled", { enabled: false });
// The SSR button can precede hydration; canvas dimensions are set on mount.
await page.waitForFunction(() => document.querySelector('[aria-label="Capture an image"] canvas[width]') || document.querySelector('[aria-label="Photo inspector"]'));
await page.evaluate(() => {
	const canvas = document.createElement("canvas");
	canvas.width = 1080;
	canvas.height = 1920;
	const context = canvas.getContext("2d");
	context.fillStyle = "#cad1d9";
	context.fillRect(0, 0, 1080, 1920);
	context.fillStyle = "#8996a3";
	context.fillRect(100, 180, 880, 1560);
	context.fillStyle = "#dce1e6";
	context.fillRect(120, 200, 840, 1520);
	context.fillStyle = "#354655";
	context.beginPath();
	context.arc(540, 960, 380, 0, Math.PI * 2);
	context.fill();
	context.fillStyle = "#aab4be";
	context.beginPath();
	context.arc(540, 960, 240, 0, Math.PI * 2);
	context.fill();
	context.font = "24px sans-serif";
	context.fillStyle = "#354655";
	context.fillText("DEMO · Inspection image", 40, 60);
	setInterval(() => context.fillRect(0, 0, 1, 1), 50);
	navigator.mediaDevices.getUserMedia = async () => canvas.captureStream(10);
});
const restored = await page.evaluate(() => [...document.querySelectorAll("button")].some((button) => button.textContent === "Retake photo"));
await page.click(restored ? 'button:has-text("Retake photo")' : 'button:has-text("Start camera")');
await page.waitForSelector('[aria-label="Capture photo"]');
await page.click('[aria-label="Capture photo"]');
await page.waitForSelector('[aria-label="Review photo"]');
await page.click('button:has-text("Continue to annotate")');
// Also guards against annotation sync running before its annotator is ready.
await page.waitForSelector('[aria-label="Photo inspector"]');
assert.match(await page.snapshot(), /No annotations yet/);
const visibleGestureGuidance = () => page.evaluate(() => {
	const paragraph = document.querySelector('[aria-label="Photo canvas"] p');
	const visible = [...paragraph.children].find((child) => getComputedStyle(child).display !== "none");
	return visible?.textContent.replace(/\s+/g, " ").trim();
});
assert.equal(await visibleGestureGuidance(), "Select a box to move or resize · Drag empty space to draw");
await page.click('summary:has-text("Photo details")');
const photoDetails = await page.evaluate(() => document.querySelector('[aria-label="Photo inspector"]').textContent);
for (const field of ["Photo details", "Photo quality", "1080 × 1920", "File size", "Live focus", "Live lighting", "Live stability"]) assert.ok(photoDetails.includes(field), `missing ${field} in ${photoDetails}`);

const imageBounds = async () => page.evaluate(() => {
	const r = document.querySelector('img[alt^="Captured scene"]').getBoundingClientRect();
	return { x: r.x, y: r.y, width: r.width, height: r.height };
});
const draw = async (index, touch = false) => {
	const box = await imageBounds();
	const x = box.x + box.width * (0.08 + (index % 5) * 0.18);
	const y = box.y + box.height * (0.15 + Math.floor(index / 5) * 0.2);
	if (touch) {
		await page.cdp("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y }] });
		await page.cdp("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: x + box.width * 0.1, y: y + box.height * 0.12 }] });
		await page.cdp("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
	} else {
		await page.mouse.move(x, y);
		await page.mouse.down();
		await page.mouse.move(x + box.width * 0.1, y + box.height * 0.12);
		await page.mouse.up();
	}
	await page.waitForSelector('form[aria-label="Edit annotation label"]');
};
const saveLabel = async (label) => {
	await page.fill('textarea[name="label"]', label);
	await page.click('button[aria-label="Save label"]');
	await page.waitForFunction(() => !document.querySelector("textarea"));
};
await draw(0);
await page.fill('textarea[name="label"]', "   ");
await page.click('button[aria-label="Save label"]');
assert.match(await page.snapshot(), /Enter a label before saving/);
await saveLabel("Crack near mounting hole");
await page.click('[aria-label^="Edit label for annotation 1:"]');
await page.waitForSelector("textarea");
assert.equal(await page.evaluate(() => document.querySelector("textarea").value), "Crack near mounting hole");
await page.press('textarea[name="label"]', "Escape");
await page.waitForFunction(() => !document.querySelector("textarea"));
assert.ok(await page.evaluate(() => document.activeElement.matches("[data-annotation-id]")), "Escape returns focus to annotation row");
await page.cdp("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
await page.cdp("Emulation.setTouchEmulationEnabled", { enabled: true });
assert.equal(await visibleGestureGuidance(), "Drag empty space to draw · Drag a box to move · Tap a box to resize");
if (await page.evaluate(() => document.querySelector('button[aria-controls="photo-inspector-content"]').getAttribute("aria-expanded") === "false")) {
	await page.click('button[aria-controls="photo-inspector-content"]');
}
const firstAnnotationId = await page.evaluate(() =>
	document
		.querySelector('[aria-label^="Edit label for annotation 1: Crack near mounting hole"]')
		?.getAttribute("data-annotation-id"),
);
const firstAnnotationBounds = () => page.evaluate((id) => {
	const rect = document.querySelector(`.a9s-annotationlayer [data-id="${id}"] rect.a9s-inner`).getBoundingClientRect();
	return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
}, firstAnnotationId);
const touchBefore = await firstAnnotationBounds();
const touchStart = {
	x: touchBefore.x + touchBefore.width / 2,
	y: touchBefore.y + touchBefore.height / 2,
};
await page.cdp("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [touchStart] });
await page.cdp("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: touchStart.x + 35, y: touchStart.y + 35 }] });
await page.cdp("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
await page.waitForFunction(() => document.querySelector('[aria-label="Annotations"]').textContent.includes("Changes saved on this tab."));
const touchAfter = await firstAnnotationBounds();
assert.ok(touchAfter.x > touchBefore.x + 10 && touchAfter.y > touchBefore.y + 10, `touch drag moves existing box: ${JSON.stringify({ touchBefore, touchAfter })}`);
assert.equal(await page.evaluate(() => document.querySelectorAll("[data-annotation-number]").length), 1, "moving by touch does not draw another box");
console.log("PASS: touch drag moves existing box without selecting first");
await page.cdp("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
await page.cdp("Emulation.setTouchEmulationEnabled", { enabled: false });
for (let index = 1; index < 15; index++) {
	await draw(index);
	await saveLabel(index === 1 ? `Long label: ${"Inspect mounting surface before reassembly. ".repeat(12)}` : `Inspection area ${index + 1}`);
}
assert.equal(await page.evaluate(() => document.querySelectorAll("[data-annotation-number]").length), 15);
const annotationNumbers = () => page.evaluate(() =>
	[...document.querySelectorAll('[aria-label="Annotations"] ul > li > button[data-annotation-id]')]
		.map((button) => button.querySelector("span").textContent.trim()),
);
await page.click('button:has-text("Oldest")');
assert.deepEqual(await annotationNumbers(), Array.from({ length: 15 }, (_, index) => String(index + 1)));
await page.click('button:has-text("Newest")');
assert.deepEqual(await annotationNumbers(), Array.from({ length: 15 }, (_, index) => String(15 - index)));
const layouts = []; 
let markerPosition;
let sawScrollableList = false;
for (const [width, height] of [[1440, 900], [1024, 768], [768, 1024], [390, 844], [320, 568], [844, 390], [667, 375], [667, 320], [720, 450]]) {
	await page.cdp("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: width < 1024 });
	await page.cdp("Emulation.setTouchEmulationEnabled", { enabled: width < 1024 });
	await page.click('[aria-label="Fit photo to view"]');
	await page.waitForFunction(() => document.querySelector('[aria-label="Fit photo to view"]').textContent.trim() === "100%");
	await page.evaluate(() => { document.querySelector('[aria-label="Photo canvas"]').parentElement.scrollTop = 0; });
	await page.waitForFunction(() => {
		const image = document.querySelector('img[alt^="Captured scene"]');
		const scroller = image.closest("[style*=aspect-ratio]").parentElement;
		const bounds = image.getBoundingClientRect();
		return bounds.width <= scroller.clientWidth + 1 && bounds.height <= scroller.clientHeight + 1;
	});
	if (width === 320 && height === 568) {
		const photoWidth = await page.evaluate(() => document.querySelector('img[alt^="Captured scene"]').getBoundingClientRect().width);
		if (photoWidth < 80) {
			await page.click('button[aria-controls="photo-inspector-content"]');
			await page.waitForFunction(() => document.querySelector('img[alt^="Captured scene"]').getBoundingClientRect().width >= 80);
		}
	}
	const bounds = await page.evaluate(() => {
		const canvas = document.querySelector('[aria-label="Photo canvas"]').getBoundingClientRect();
		const inspector = document.querySelector('[aria-label="Photo inspector"]').getBoundingClientRect();
		const image = document.querySelector('img[alt^="Captured scene"]').getBoundingClientRect();
		const list = document.querySelector('[aria-label="Annotations"] ul');
		const marker = document.querySelector('[data-annotation-number="1"]').getBoundingClientRect();
		return {
			overflow: document.documentElement.scrollWidth > innerWidth,
			canvasRight: canvas.right, canvasBottom: canvas.bottom,
			inspectorLeft: inspector.left, inspectorTop: inspector.top, inspectorBottom: inspector.bottom,
			imageLeft: image.left, imageRight: image.right, imageTop: image.top, imageBottom: image.bottom,
			imageWidth: image.width, imageHeight: image.height,
			listHeight: list.clientHeight,
			listContentHeight: list.scrollHeight,
			listCanScroll: list.scrollHeight > list.clientHeight && ["auto", "scroll"].includes(getComputedStyle(list).overflowY),
			markerX: (marker.left + marker.width / 2 - image.left) / image.width,
			markerY: (marker.top + marker.height / 2 - image.top) / image.height,
		};
	});
	const docked = width >= 1024 || (width >= 640 && height <= 544);
	assert.equal(bounds.overflow, false, `no horizontal overflow at ${width}×${height}`);
	assert.ok(bounds.listHeight === 0 || bounds.listHeight >= 96, `visible annotation list remains usable at ${width}×${height}`);
	sawScrollableList ||= bounds.listCanScroll;
	assert.ok(bounds.imageWidth >= 80 && bounds.imageHeight >= 130, `canvas remains usable at ${width}×${height}: ${bounds.imageWidth}×${bounds.imageHeight}`);
	assert.ok(Math.abs(bounds.imageWidth / bounds.imageHeight - 9 / 16) < 0.01, "image aspect ratio unchanged");
	if (width === 1440) {
		const zoomIn = await page.evaluate(() => {
		const image = document.querySelector('img[alt^="Captured scene"]');
		return { width: image.getBoundingClientRect().width, height: image.getBoundingClientRect().height };
	});
	await page.click('[aria-label="Zoom in"]');
	await page.waitForFunction(() => document.querySelector('[aria-label="Fit photo to view"]').textContent.trim() === "125%");
	const zoomed = await page.evaluate(() => {
		const image = document.querySelector('img[alt^="Captured scene"]');
		const scroller = image.closest("[style*=aspect-ratio]").parentElement;
		const bounds = image.getBoundingClientRect();
		return {
			width: bounds.width,
			height: bounds.height,
			scrollWidth: scroller.scrollWidth,
			scrollHeight: scroller.scrollHeight,
			centerX: bounds.left + bounds.width / 2 - scroller.getBoundingClientRect().left - scroller.clientWidth / 2,
			centerY: bounds.top + bounds.height / 2 - scroller.getBoundingClientRect().top - scroller.clientHeight / 2,
		};
	});
	assert.ok(zoomed.width > zoomIn.width && zoomed.height > zoomIn.height, `zoom in enlarges whole photo: ${JSON.stringify({ zoomIn, zoomed })}`);
	assert.ok(zoomed.scrollWidth >= zoomed.width && zoomed.scrollHeight >= zoomed.height, "zoomed photo remains fully scrollable");
	assert.ok(Math.abs(zoomed.centerX) < 6 && Math.abs(zoomed.centerY) < 6, `zoomed photo stays centered in canvas: ${JSON.stringify(zoomed)}`);
	if (width === 1440) {
		console.log(await page.screenshot({ path: "/tmp/annotation-ui-zoom.png" }));
		await draw(15);
		await saveLabel("Zoomed annotation");
		const marker = await page.evaluate(() => {
			const image = document.querySelector('img[alt^="Captured scene"]');
			const bounds = image.getBoundingClientRect();
			const badge = document.querySelector('[data-annotation-number="16"]').getBoundingClientRect();
			return { x: (badge.left + badge.width / 2 - bounds.left) / bounds.width, y: (badge.top + badge.height / 2 - bounds.top) / bounds.height };
		});
		assert.ok(Math.abs(marker.x - 0.08) < 0.03 && Math.abs(marker.y - 0.75) < 0.03, `zoom-in drawing matches pointer: ${JSON.stringify(marker)}`);
	}
	await page.click('[aria-label="Zoom out"]');
	await page.waitForFunction(() => document.querySelector('[aria-label="Fit photo to view"]').textContent.trim() === "100%");
	await page.click('[aria-label="Zoom out"]');
	await page.waitForFunction(() => document.querySelector('[aria-label="Fit photo to view"]').textContent.trim() === "75%");
	const zoomedOut = await page.evaluate(() => {
		const image = document.querySelector('img[alt^="Captured scene"]');
		return { width: image.getBoundingClientRect().width, height: image.getBoundingClientRect().height };
	});
	assert.ok(zoomedOut.width < zoomIn.width && zoomedOut.height < zoomIn.height, `zoom out reduces photo size: ${JSON.stringify({ zoomIn, zoomedOut })}`);
	if (width === 1440) {
		await draw(16);
		await saveLabel("Zoomed-out annotation");
		const marker = await page.evaluate(() => {
			const image = document.querySelector('img[alt^="Captured scene"]');
			const bounds = image.getBoundingClientRect();
			const badge = document.querySelector('[data-annotation-number="17"]').getBoundingClientRect();
			return { x: (badge.left + badge.width / 2 - bounds.left) / bounds.width, y: (badge.top + badge.height / 2 - bounds.top) / bounds.height };
		});
		assert.ok(Math.abs(marker.x - 0.26) < 0.03 && Math.abs(marker.y - 0.75) < 0.03, `zoom-out drawing matches pointer: ${JSON.stringify(marker)}`);
	}
	await page.click('[aria-label="Fit photo to view"]');
	await page.waitForFunction(() => document.querySelector('[aria-label="Fit photo to view"]').textContent.trim() === "100%");
		assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, "zoom does not cause page overflow");
	}
	if (docked) {
		assert.ok(bounds.inspectorLeft >= bounds.canvasRight - 1, "inspector occupies separate right column");
		assert.ok(bounds.imageRight <= bounds.inspectorLeft, "inspector never covers photo");
		assert.ok(bounds.inspectorBottom <= height + 1, "docked inspector fits viewport");
	} else assert.ok(bounds.inspectorTop >= bounds.canvasBottom - 1, "inspector follows photo on phones");
	markerPosition ??= { x: bounds.markerX, y: bounds.markerY };
	const markerDrift = {
		x: Math.abs(bounds.markerX - markerPosition.x) * bounds.imageWidth,
		y: Math.abs(bounds.markerY - markerPosition.y) * bounds.imageHeight,
	};
	assert.ok(markerDrift.x < 4 && markerDrift.y < 4, `numbered marker stays aligned within 4 screen pixels at ${width}×${height}: ${JSON.stringify(markerDrift)}`);
	if (!docked && await page.evaluate(() => document.querySelector('button[aria-controls="photo-inspector-content"]').getAttribute("aria-expanded") === "false")) {
		await page.click('button[aria-controls="photo-inspector-content"]');
	}
	await page.click('[aria-label^="Edit label for annotation 17:"]');
	await page.waitForSelector("textarea");
	const popup = await page.evaluate(() => {
		const r = document.querySelector('form[aria-label="Edit annotation label"]').getBoundingClientRect();
		return { x: r.x, y: r.y, right: r.right, bottom: r.bottom };
	});
	assert.ok(popup.x >= 0 && popup.y >= 0 && popup.right <= width + 1 && popup.bottom <= height + 1, "label popup fits viewport");
	if (width === 1440 || width === 390) console.log(await page.screenshot({ path: `/tmp/annotation-ui-${width === 1440 ? "desktop" : "mobile"}.png` }));
	await page.press('textarea[name="label"]', "Escape");
	await page.waitForFunction(() => !document.querySelector("textarea"));
	layouts.push({ width, height, ...bounds });
}
assert.ok(sawScrollableList, "long annotation lists scroll when viewport has limited space");
// Touch drawing, destructive-action confirmation, and same-tab restore.
await page.cdp("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
if (await page.evaluate(() => document.querySelector('button[aria-controls="photo-inspector-content"]').getAttribute("aria-expanded") === "false")) {
	await page.click('button[aria-controls="photo-inspector-content"]');
}
await page.evaluate(() => { document.querySelector('[aria-label="Photo canvas"]').parentElement.scrollTop = 0; });
await draw(17, true);
await saveLabel("Touch annotation");
console.log("PASS: touch drawing");
await page.click('[aria-label^="Edit label for annotation 18: Touch annotation"]');
await page.waitForSelector("textarea");
await page.click('form button[aria-label^="Delete annotation"]');
await page.waitForSelector('[role="alertdialog"]');
await page.click('[role="alertdialog"] button:has-text("Cancel")');
assert.equal(await page.evaluate(() => document.querySelectorAll("[data-annotation-id]").length), 18);
await page.click('form button[aria-label^="Delete annotation"]');
await page.waitForSelector('[role="alertdialog"]');
await page.click('[role="alertdialog"] button:has-text("Delete")');
await page.waitForFunction(() => document.querySelectorAll("[data-annotation-id]").length === 17);
console.log("PASS: confirmed deletion");
await page.waitForFunction(() => document.activeElement.matches("[data-annotation-id]"));
console.log("PASS: deletion focus return");
await page.waitForFunction(() => document.querySelector('[aria-label="Annotations"]').textContent.includes("Changes saved on this tab."));
console.log("PASS: saved status before reload");
await page.reload();
await page.waitForFunction(() => document.querySelectorAll("[data-annotation-id]").length === 17);
assert.ok(await page.evaluate(() => !!document.querySelector('button[title="Crack near mounting hole"]')), "label survives same-tab refresh");
console.log({ layouts });
console.log("PASS: capture, validation, save/edit, keyboard focus, 17 annotations/long labels, nine layouts, zoom-in/out drawing alignment, centered zoom controls and Fit reset, marker alignment, popup bounds, touch drawing, confirmed deletion, and same-tab restore. Physical-device QA still required.");
await task.finish({ keep: [] });
// On failure, isolated browser space stays open for diagnosis.
