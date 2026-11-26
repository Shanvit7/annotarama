// Run with dev server: ego-browser nodejs < scripts/check-ascii-backdrop.mjs
const assert = (await import("node:assert/strict")).default;
const spaces = await listTaskSpaces();
const existing = spaces.find((space) => space.name === "canvas layer test") ??
	spaces.find((space) => space.name === "Annotarama ASCII backdrop");
const task = !existing ? await taskSpace("Annotarama ASCII backdrop") :
	existing.ownership === "user" ? await claimTaskSpace(existing.id) :
	existing.ownership === "agentDelegatedToUser" ? await takeOverTaskSpace(existing.id) :
	await taskSpace(existing.id);
const page = (await task.pages())[0] ?? await task.adopt((await task.tabs())[0].page);
console.log({ spaceId: task.spaceId, page: page.label });
const sample = () => {
	const canvas = document.querySelector("[aria-hidden='true'] > canvas");
	const pixels = canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height).data;
	let count = 0;
	let hash = 0;
	for (let index = 3; index < pixels.length; index += 4) {
		if (pixels[index]) count += 1;
		hash = (Math.imul(hash, 31) + pixels[index]) | 0;
	}
	return { count, hash };
};
await page.cdp("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "no-preference" }] });
await page.goto("http://localhost:3000/capture");
await page.waitForSelector("[aria-hidden='true'] > canvas");
// Wait beyond initial ResizeObserver and first frames, where old loop stopped.
await page.waitForTimeout(700);
const first = await page.evaluate(sample);
assert.ok(first.count > 1000, "ASCII remains drawn after initial resize");
console.log(await page.screenshot({ path: "/tmp/annotarama-ascii-first.png" }));
await page.waitForTimeout(1000);
const second = await page.evaluate(sample);
assert.notEqual(first.hash, second.hash, "ASCII keeps animating after first frame");
console.log(await page.screenshot({ path: "/tmp/annotarama-ascii-second.png" }));
await page.cdp("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
await page.waitForTimeout(700);
const mobile = await page.evaluate(sample);
assert.ok(mobile.count > 100, "ASCII redraws after mobile resize");
console.log(await page.screenshot({ path: "/tmp/annotarama-ascii-mobile.png" }));
await page.cdp("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
await page.reload();
await page.waitForSelector("[aria-hidden='true'] > canvas");
await page.waitForTimeout(700);
const reduced = await page.evaluate(sample);
assert.ok(reduced.count > 100, "reduced motion keeps static ASCII visible");
await page.waitForTimeout(700);
assert.deepEqual(await page.evaluate(sample), reduced, "reduced motion stays still");
await page.cdp("Emulation.setDeviceMetricsOverride", { width: 974, height: 734, deviceScaleFactor: 1, mobile: false });
await page.waitForTimeout(700);
assert.ok((await page.evaluate(sample)).count > 1000, "static ASCII redraws after resize");
console.log("PASS: continuous animation, resize redraw, mobile, reduced-motion still frame.");
await page.cdp("Emulation.clearDeviceMetricsOverride");
await page.cdp("Emulation.setEmulatedMedia", { features: [] });
await page.reload();
// Inspect screenshots, then finish this space in separate ego-browser call.
