// Run with the dev server: ego-browser nodejs < scripts/check-live-camera.mjs
// Deterministic canvas stream; never requests physical camera permission.
const assert = (await import("node:assert/strict")).default;
const existing = (await listTaskSpaces()).find((space) => space.name === "Verify mobile Get Ready layout");
const task = !existing ? await taskSpace("Verify mobile Get Ready layout") :
	existing.ownership === "user" ? await claimTaskSpace(existing.id) :
	await taskSpace(existing.id);
const page = (await task.pages())[0] ?? await task.adopt((await task.tabs())[0].page);
await page.goto("http://localhost:3000/capture");
await page.waitForSelector('button:has-text("Start camera")', { state: "visible" });
const checkLayout = async (stage) => {
	for (const [width, height] of [[393, 852], [412, 924], [768, 1024], [1024, 768], [1440, 900]]) {
		await page.cdp("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: width < 1280 });
		const bounds = await page.evaluate(() => {
			const header = document.querySelector("header").getBoundingClientRect();
			const main = document.querySelector("main").getBoundingClientRect();
			const workspace = document.querySelector("[data-capture-workspace]").getBoundingClientRect();
			const start = [...document.querySelectorAll("button")].find((button) => button.textContent.includes("Start camera"))?.getBoundingClientRect();
			const frame = document.querySelector("video").parentElement;
			const cornerRadius = getComputedStyle(frame).borderTopLeftRadius;
			const video = document.querySelector("video").getBoundingClientRect();
			return { videoWidth: video.width, videoHeight: video.height, cornerRadius, headerHeight: header.height, mainHeight: main.height, workspaceHeight: workspace.height, mainTop: main.top, mainBottom: main.bottom, mainWidth: main.width, startTop: start?.top, startBottom: start?.bottom, overflow: document.documentElement.scrollWidth > innerWidth };
		});
		assert.equal(bounds.headerHeight > 0, width >= 1280, `${stage}: title visibility at ${width}`);
		assert.ok(bounds.workspaceHeight > height / 2, `${stage}: workspace fills available height at ${width}`);
		assert.ok(bounds.mainBottom <= height + 1, `${stage}: main fits viewport at ${width}`);
		assert.equal(bounds.overflow, false);
		if (stage === "live" && width < 1280) {
			assert.equal(bounds.mainTop, 0);
			assert.equal(bounds.mainWidth, width);
			assert.equal(bounds.mainHeight, height);
			assert.ok(bounds.videoWidth >= width - 4, "Live preview fills viewport width");
			assert.ok(bounds.videoHeight >= height - 4, "Live preview fills viewport height");
			assert.equal(bounds.cornerRadius, "0px", "Live preview has no exposed corners");
			if (width === 393 || width === 768) console.log(await page.screenshot({ path: `/tmp/annotarama-live-fullscreen-${width}.png` }));
		}
		if (stage === "ready") {
			assert.ok(bounds.startTop > bounds.mainTop && bounds.startBottom < bounds.mainBottom, `Start camera visible at ${width}`);
			if (width < 1280) {
				assert.equal(bounds.mainTop, 0);
				assert.equal(bounds.mainHeight, height);
				assert.equal(bounds.mainWidth, width);
				assert.equal(bounds.cornerRadius, "0px", "Ready screen has no exposed corners");
			}
		}
		console.log({ stage, width, height, ...bounds });
	}
};
await checkLayout("ready");
await page.evaluate(() => {
	document.querySelector("#react-scan-root")?.remove();
	const canvas = document.createElement("canvas");
	canvas.width = 640;
	canvas.height = 480;
	const context = canvas.getContext("2d");
	const state = { dark: false, torch: true, torchOn: false, denied: false, activeCamera: "rear-camera", cameras: ["front-camera", "rear-camera"] };
	let frameNumber = 0;
	const paint = () => {
		frameNumber++;
		context.fillStyle = state.dark ? (frameNumber % 2 ? "#050505" : "#060606") : (frameNumber % 2 ? "#777" : "#787878");
		context.fillRect(0, 0, 640, 480);
		if (!state.dark) {
			context.fillStyle = "#bbb";
			for (let x = 0; x < 640; x += 20) context.fillRect(x, 0, 10, 480);
		}
	};
	paint();
	setInterval(paint, 33);
	navigator.mediaDevices.enumerateDevices = async () => state.cameras.map((deviceId) => ({ kind: "videoinput", deviceId }));
	navigator.mediaDevices.getUserMedia = async (constraints) => {
		if (state.denied) throw new DOMException("Denied fixture", "NotAllowedError");
		state.activeCamera = constraints.video.deviceId?.exact ?? "rear-camera";
		const stream = canvas.captureStream(30);
		const track = stream.getVideoTracks()[0];
		track.getCapabilities = () => ({ torch: state.torch });
		track.applyConstraints = async (constraints) => { state.torchOn = constraints.advanced[0].torch; };
		const getSettings = track.getSettings.bind(track);
		track.getSettings = () => ({ ...getSettings(), deviceId: state.activeCamera, torch: state.torchOn });
		return stream;
	};
	window.cameraQA = state;
});
const waitForText = async (text) => page.waitForFunction((value) => document.body.textContent.includes(value), text, { timeout: 15000 });
await page.click('text="Start camera"');
await page.waitForSelector('[aria-label="Capture photo"]', { state: "visible" });
await checkLayout("live");
assert.deepEqual(await page.evaluate(() => ({ width: document.querySelector("video").videoWidth, height: document.querySelector("video").videoHeight })), { width: 640, height: 480 });
await page.click('[aria-label="Switch camera"]');
await page.waitForFunction(() => window.cameraQA.activeCamera === "front-camera" && !!document.querySelector('[aria-label="Capture photo"]'));
await page.click('[aria-label="Switch camera"]');
await page.waitForFunction(() => window.cameraQA.activeCamera === "rear-camera" && !!document.querySelector('[aria-label="Capture photo"]'));
await page.evaluate(() => { window.cameraQA.dark = true; });
await page.waitForFunction(() => {
	const quality = document.querySelector('[aria-label="Live camera quality"]').textContent;
	return quality.includes("Adjust capture conditions") || quality.includes("Quality unavailable");
}, undefined, { timeout: 15000 });
await page.click('[aria-label="Turn torch on"]');
await page.waitForSelector('[aria-label="Turn torch off"][aria-pressed="true"]');
assert.equal(await page.evaluate(() => document.querySelector('[aria-label="Capture photo"]').disabled), false);
const layouts = [];
for (const [width, height] of [[390, 844], [320, 568], [844, 390], [640, 360], [320, 480]]) {
	await page.cdp("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: true });
	const bounds = await page.evaluate(() => {
		const video = document.querySelector("video").getBoundingClientRect();
		const panel = document.querySelector('[aria-label="Live camera quality"]');
		panel.scrollIntoView({ block: "end" });
		const quality = panel.getBoundingClientRect();
		const capture = document.querySelector('[aria-label="Capture photo"]');
		return { previewHeight: video.height, qualityBottom: quality.bottom, viewportHeight: innerHeight, captureEnabled: !capture.disabled, overflow: document.documentElement.scrollWidth > innerWidth };
	});
	assert.ok(bounds.previewHeight > 0, `preview visible at ${width}x${height}`);
	assert.ok(bounds.qualityBottom <= bounds.viewportHeight + 1, `quality visible at ${width}x${height}`);
	assert.equal(bounds.overflow, false);
	assert.equal(bounds.captureEnabled, true);
	layouts.push({ width, height, ...bounds });
}
await page.cdp("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
console.log({ layouts, screenshot: await page.screenshot({ path: "/tmp/annotarama-live-quality.png" }) });
await page.click('[aria-label="Capture photo"]');
await page.waitForSelector("#captured-photo-summary-heading");
await checkLayout("captured");
assert.equal(await page.evaluate(() => !!document.querySelector('[aria-label="Live camera quality"]')), false);
const capturedDetails = await page.evaluate(() => document.querySelector("#captured-photo-summary-heading")?.parentElement?.textContent ?? "");
assert.match(capturedDetails, /Resolution/);
assert.match(capturedDetails, /File size/);
assert.match(capturedDetails, /Live quality/);
assert.match(capturedDetails, /Focus/);
assert.match(capturedDetails, /Lighting/);
assert.match(capturedDetails, /Stability/);
await page.evaluate(async () => {
	window.cameraQA.torch = false;
	window.cameraQA.torchOn = false;
	const database = await new Promise((resolve, reject) => {
		const request = indexedDB.open("annotarama-photo-drafts");
		request.onsuccess = () => resolve(request.result);
		request.onerror = () => reject(request.error);
	});
	const id = sessionStorage.getItem("annotarama:photo-session");
	const transaction = database.transaction("drafts", "readwrite");
	const store = transaction.objectStore("drafts");
	const draft = await new Promise((resolve, reject) => {
		const request = store.get(id);
		request.onsuccess = () => resolve(request.result);
		request.onerror = () => reject(request.error);
	});
	draft.annotations = [{ id: "old-annotation" }];
	store.put(draft);
	await new Promise((resolve, reject) => {
		transaction.oncomplete = resolve;
		transaction.onerror = () => reject(transaction.error);
	});
});
await page.click('text="Retake photo"');
await page.waitForSelector('[aria-label="Live camera quality"]');
assert.equal(await page.evaluate(() => !!document.querySelector("#captured-photo-summary-heading")), false);
assert.equal(await page.evaluate(async () => {
	const database = await new Promise((resolve, reject) => {
		const request = indexedDB.open("annotarama-photo-drafts");
		request.onsuccess = () => resolve(request.result);
		request.onerror = () => reject(request.error);
	});
	const id = sessionStorage.getItem("annotarama:photo-session");
	return await new Promise((resolve, reject) => {
		const request = database.transaction("drafts").objectStore("drafts").get(id);
		request.onsuccess = () => resolve(request.result);
		request.onerror = () => reject(request.error);
	});
}), null, "Retake deletes previous photo and annotations");
await page.click('[aria-label="Capture photo"]');
await page.waitForSelector("#captured-photo-summary-heading");
assert.deepEqual(await page.evaluate(async () => {
	const database = await new Promise((resolve, reject) => {
		const request = indexedDB.open("annotarama-photo-drafts");
		request.onsuccess = () => resolve(request.result);
		request.onerror = () => reject(request.error);
	});
	const id = sessionStorage.getItem("annotarama:photo-session");
	return await new Promise((resolve, reject) => {
		const request = database.transaction("drafts").objectStore("drafts").get(id);
		request.onsuccess = () => resolve(request.result.annotations);
		request.onerror = () => reject(request.error);
	});
}), [], "New photo starts with no old annotations");
await page.click('text="Retake photo"');
await page.waitForSelector('[aria-label="Live camera quality"]');
assert.doesNotMatch(await page.snapshot(), /Turn torch on/);
await page.click('[aria-label="Stop camera"]');
await page.evaluate(() => { window.cameraQA.denied = true; });
await page.click('text="Start camera"');
await waitForText("Try again");
await waitForText("Allow camera access in your browser settings");
await page.evaluate(() => { Object.defineProperty(navigator, "mediaDevices", { configurable: true, value: undefined }); });
await page.click('text="Try again"');
await waitForText("Camera access is unavailable here");
console.log("PASS: front/rear camera switching, balanced warmup, dark/stale advisory capture, supported/unsupported torch, capture/retake, permission denial, unsupported camera, five responsive layouts.");
console.log({ spaceId: task.spaceId, page: page.label });
// Inspect the screenshot, then finish this space in a separate ego-browser call.
