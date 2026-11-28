// Run with the dev server: ego-browser nodejs < scripts/ego-browser/check-live-camera.mjs
// Deterministic canvas stream; never requests physical camera permission.
const assert = (await import("node:assert/strict")).default;
const task = await taskSpace(`Annotarama live camera ${Date.now()}`);
const page = task.page("p1");
const baseUrl = globalThis.egoCheckBaseUrl ?? "http://localhost:3000";
await page.goto(`${baseUrl}/capture`);
await page.waitForSelector('button:has-text("Start camera")', { state: "visible" });
const checkLayout = async (stage) => {
	for (const [width, height] of [[393, 852], [412, 924], [768, 1024], [1024, 768], [1440, 900]]) {
		await page.cdp("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: width < 1280 });
		const bounds = await page.evaluate(() => {
			const headerHeight = document.querySelector("header")?.getBoundingClientRect().height ?? 0;
			const main = document.querySelector("main").getBoundingClientRect();
			const workspace = document.querySelector("[data-capture-workspace]").getBoundingClientRect();
			const start = [...document.querySelectorAll("button")].find((button) => button.textContent.includes("Start camera"))?.getBoundingClientRect();
			const frame = document.querySelector("video").parentElement;
			const cornerRadius = getComputedStyle(frame).borderTopLeftRadius;
			const video = document.querySelector("video").getBoundingClientRect();
			return { videoWidth: video.width, videoHeight: video.height, cornerRadius, headerHeight, mainHeight: main.height, workspaceHeight: workspace.height, mainTop: main.top, mainBottom: main.bottom, mainWidth: main.width, startTop: start?.top, startBottom: start?.bottom, overflow: document.documentElement.scrollWidth > innerWidth };
		});
		assert.equal(bounds.headerHeight, 0, `${stage}: capture header is absent at ${width}`);
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
const readDraftAnnotations = () => page.evaluate(async () => {
	const database = await new Promise((resolve, reject) => {
		const request = indexedDB.open("annotarama-photo-drafts");
		request.onsuccess = () => resolve(request.result);
		request.onerror = () => reject(request.error);
	});
	const id = sessionStorage.getItem("annotarama:photo-session");
	return await new Promise((resolve, reject) => {
		const request = database.transaction("drafts").objectStore("drafts").get(id);
		request.onsuccess = () => resolve(request.result?.annotations ?? null);
		request.onerror = () => reject(request.error);
	});
});
const seedDraftAnnotations = (annotations) => page.evaluate(async (newAnnotations) => {
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
	draft.annotations = newAnnotations;
	store.put(draft);
	await new Promise((resolve, reject) => {
		transaction.oncomplete = resolve;
		transaction.onerror = () => reject(transaction.error);
	});
}, annotations);
await page.click('text="Start camera"');
await page.waitForSelector('[aria-label="Capture photo"]', { state: "visible" });
await checkLayout("live");
assert.deepEqual(await page.evaluate(() => {
	const guide = document.querySelector("[data-camera-focus-guide]");
	const guideBounds = guide.getBoundingClientRect();
	const previewBounds = document.querySelector("video").getBoundingClientRect();
	return {
		role: guide.getAttribute("role"),
		label: guide.getAttribute("aria-label"),
		centered: Math.abs((guideBounds.left + guideBounds.width / 2) - (previewBounds.left + previewBounds.width / 2)) < 1
			&& Math.abs((guideBounds.top + guideBounds.height / 2) - (previewBounds.top + previewBounds.height / 2)) < 1,
	};
}), {
	role: "img",
	label: "Center framing guide. Does not control camera focus.",
	centered: true,
});
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
console.log({ layouts, screenshot: await page.screenshot({ path: "/tmp/annotarama-live-framing-guide.png" }) });
// Capture should match the current dark preview frame rather than an older still.
await page.click('[aria-label="Capture photo"]');
await page.waitForSelector("#captured-photo-summary-heading");
const firstCaptureDetails = await page.evaluate(() => document.querySelector("#captured-photo-summary-heading")?.parentElement?.textContent ?? "");
assert.match(firstCaptureDetails, /640 × 480/, "capture uses current preview dimensions");
const capturedFrame = await page.evaluate(async () => {
	const image = document.querySelector('img[alt="Captured scene"]');
	await image.decode();
	const canvas = document.createElement("canvas");
	canvas.width = image.naturalWidth;
	canvas.height = image.naturalHeight;
	const context = canvas.getContext("2d");
	context.drawImage(image, 0, 0);
	return { width: canvas.width, height: canvas.height, red: context.getImageData(320, 240, 1, 1).data[0] };
});
assert.deepEqual({ width: capturedFrame.width, height: capturedFrame.height }, { width: 640, height: 480 });
assert.ok(capturedFrame.red < 20, `capture matches current dark preview, not stale bright frame: ${capturedFrame.red}`);
assert.equal(await page.evaluate(() => !!document.querySelector('[aria-label="Review photo"]')), true);
const sameCameraFrame = await page.evaluate(() => {
	const image = document.querySelector('img[alt="Captured scene"]');
	const frame = image.parentElement.getBoundingClientRect();
	const imageBounds = image.getBoundingClientRect();
	const metrics = document.querySelector("#captured-photo-summary-heading").parentElement.getBoundingClientRect();
	const continueButton = [...document.querySelectorAll("button")].find((button) => button.textContent.includes("Continue to annotate"));
	const buttonBounds = continueButton.getBoundingClientRect();
	return {
		objectFit: getComputedStyle(image).objectFit,
		imageFillsFrame: Math.abs(frame.width - imageBounds.width) < 1 && Math.abs(frame.height - imageBounds.height) < 1,
		metricsAtTop: metrics.top < innerHeight / 3,
		controlsAtBottom: buttonBounds.bottom > innerHeight - 80,
	};
});
assert.deepEqual(sameCameraFrame, { objectFit: "cover", imageFillsFrame: true, metricsAtTop: true, controlsAtBottom: true });
await seedDraftAnnotations([{ id: "old-annotation" }]);
await page.click('text="Retake photo"');
await page.waitForSelector('[aria-label="Capture photo"]');
assert.equal(await readDraftAnnotations(), null, "Retake deletes the previous photo and annotations");
await page.evaluate(() => { window.cameraQA.dark = false; });
await page.click('[aria-label="Capture photo"]');
await page.waitForSelector("#captured-photo-summary-heading");
await checkLayout("captured");
await page.cdp("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
const mobileReviewScreenshot = await page.screenshot({ path: "/tmp/annotarama-photo-review-mobile.png" });
await page.cdp("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
const desktopReviewScreenshot = await page.screenshot({ path: "/tmp/annotarama-photo-review-desktop.png" });
console.log({ mobileReviewScreenshot, desktopReviewScreenshot });
await page.cdp("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
assert.equal(await page.evaluate(() => !!document.querySelector('[aria-label="Live camera quality"]')), false);
assert.equal(await page.evaluate(() => !!document.querySelector("[data-camera-focus-guide]")), false);
const capturedDetails = await page.evaluate(() => document.querySelector("#captured-photo-summary-heading")?.parentElement?.textContent ?? "");
assert.match(capturedDetails, /Resolution/);
assert.match(capturedDetails, /File size/);
assert.match(capturedDetails, /Photo quality · Poor/);
assert.match(capturedDetails, /Low resolution/);
assert.match(capturedDetails, /Live focus/);
assert.match(capturedDetails, /Live lighting/);
assert.match(capturedDetails, /Live stability/);
assert.equal(await page.evaluate(() => !!document.querySelector('[aria-label="Review photo"]')), true);
assert.equal(await page.evaluate(() => !!document.querySelector('[aria-label="Photo canvas"]')), false);
assert.deepEqual(await readDraftAnnotations(), [], "New photo starts with no old annotations");
await page.click('text="Continue to annotate"');
await page.waitForSelector('[aria-label="Photo canvas"]');
await page.evaluate(() => sessionStorage.removeItem("annotarama:photo-session"));
await page.goto(`${baseUrl}/capture`);
await page.waitForSelector('button:has-text("Start camera")', { state: "visible" });
await page.evaluate(() => {
	const canvas = document.createElement("canvas");
	canvas.width = 640;
	canvas.height = 480;
	const context = canvas.getContext("2d");
	context.fillStyle = "#777";
	context.fillRect(0, 0, 640, 480);
	setInterval(() => context.fillRect(0, 0, 640, 480), 33);
	const state = { denied: false, activeCamera: "rear-camera", cameras: ["rear-camera"] };
	navigator.mediaDevices.enumerateDevices = async () => state.cameras.map((deviceId) => ({ kind: "videoinput", deviceId }));
	navigator.mediaDevices.getUserMedia = async () => {
		if (state.denied) throw new DOMException("Denied fixture", "NotAllowedError");
		const stream = canvas.captureStream(30);
		stream.getVideoTracks()[0].getCapabilities = () => ({ torch: false });
		return stream;
	};
	window.cameraQA = state;
});
await page.click('text="Start camera"');
await page.waitForSelector('[aria-label="Capture photo"]');
assert.doesNotMatch(await page.snapshot(), /Turn torch on/);
await page.click('[aria-label="Stop camera"]');
await page.evaluate(() => { window.cameraQA.denied = true; });
await page.click('text="Start camera"');
await waitForText("Try again");
await waitForText("Allow camera access in your browser settings");
await page.evaluate(() => { Object.defineProperty(navigator, "mediaDevices", { configurable: true, value: undefined }); });
await page.click('text="Try again"');
await waitForText("Camera access is unavailable here");
console.log("PASS: front/rear switching, current dark-frame capture, balanced warmup, supported/unsupported torch, retake, permission denial, unsupported camera, five responsive layouts.");
console.log({ spaceId: task.spaceId, page: page.label });
await task.finish({ keep: [] });
// On failure, isolated browser space stays open for diagnosis.
