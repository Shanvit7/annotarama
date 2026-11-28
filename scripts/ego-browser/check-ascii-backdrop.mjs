// Run with dev server: ego-browser nodejs < scripts/ego-browser/check-ascii-backdrop.mjs
const assert = (await import("node:assert/strict")).default;
const task = await taskSpace(`Annotarama ASCII backdrop ${Date.now()}`);
const page = task.page("p1");
const baseUrl = globalThis.egoCheckBaseUrl ?? "http://localhost:3000";
console.log({ spaceId: task.spaceId, page: page.label });
const installSampler = () => page.evaluate(() => {
	window.__egoBackdropSample = () => {
		const canvas = document.querySelector('[aria-hidden="true"] > canvas');
		if (!canvas) return null;
		const pixels = canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height).data;
		let count = 0;
		let hash = 0;
		for (let index = 0; index < pixels.length; index += 4) {
			if (pixels[index + 3]) count += 1;
			for (let channel = 0; channel < 4; channel += 1) {
				hash = (Math.imul(hash, 31) + pixels[index + channel]) | 0;
			}
		}
		return { count, hash, width: canvas.width, height: canvas.height };
	};
});
const sample = () => page.evaluate(() => window.__egoBackdropSample());
const waitForPainted = () => page.waitForFunction(
	() => (window.__egoBackdropSample()?.count ?? 0) > 1000,
	undefined,
	{ timeout: 10000 },
);
const waitForSize = (width, height) => page.waitForFunction(({ width, height }) => {
	const canvas = document.querySelector('[aria-hidden="true"] > canvas');
	const bounds = canvas?.getBoundingClientRect();
	return bounds && Math.abs(bounds.width - width) < 1 && Math.abs(bounds.height - height) < 1
		&& (window.__egoBackdropSample()?.count ?? 0) > 100;
}, { width, height }, { timeout: 10000 });
const sampleFrames = (count) => page.evaluate(async (frameCount) => {
	const samples = [];
	for (let index = 0; index < frameCount; index += 1) {
		await new Promise(requestAnimationFrame);
		samples.push(window.__egoBackdropSample());
	}
	return samples;
}, count);
await page.cdp("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "no-preference" }] });
await page.goto(`${baseUrl}/capture`);
await page.waitForSelector('[aria-hidden="true"] > canvas');
await installSampler();
await waitForPainted();
const first = await sample();
assert.ok(first.count > 1000, "ASCII remains drawn after initial resize");
console.log(await page.screenshot({ path: "/tmp/annotarama-ascii-first.png" }));
const animatedFrames = await sampleFrames(30);
assert.ok(new Set(animatedFrames.map((frame) => frame.hash)).size > 1, "ASCII keeps animating after first frame");
console.log(await page.screenshot({ path: "/tmp/annotarama-ascii-second.png" }));
await page.cdp("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
await waitForSize(390, 844);
console.log(await page.screenshot({ path: "/tmp/annotarama-ascii-mobile.png" }));
await page.cdp("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
await page.reload();
await page.waitForSelector('[aria-hidden="true"] > canvas');
await installSampler();
await waitForPainted();
const reducedFrames = await sampleFrames(30);
const reduced = reducedFrames[0];
assert.ok(reduced.count > 100, "reduced motion keeps static ASCII visible");
assert.ok(reducedFrames.every((frame) => frame.hash === reduced.hash), "reduced motion stays still");
await page.cdp("Emulation.setDeviceMetricsOverride", { width: 974, height: 734, deviceScaleFactor: 1, mobile: false });
await waitForSize(974, 734);
assert.ok((await sample()).count > 1000, "static ASCII redraws after resize");
console.log("PASS: continuous animation, resize redraw, mobile, reduced-motion still frame.");
await page.cdp("Emulation.clearDeviceMetricsOverride");
await page.cdp("Emulation.setEmulatedMedia", { features: [] });
await page.reload();
await task.finish({ keep: [] });
// On failure, isolated browser space stays open for diagnosis.
