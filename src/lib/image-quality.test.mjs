import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { test } from "node:test";
import {
	analysisSize,
	analyzeGray,
	assessPhoto,
	classifyQuality,
	createQualityFilter,
	meanAbsoluteDifference,
	overallStatus,
	qualitySuggestion,
	rgbaToGray,
	unknownChecks,
} from "./image-quality.ts";

// Match the app's extensionless TS imports without adding a test dependency.
registerHooks({
	resolve: (specifier, context, next) => {
		const isSamplerImport = context.parentURL?.endsWith(
			"/live-quality-sampler.ts",
		);
		const target =
			isSamplerImport &&
			(specifier === "./image-quality" || specifier === "@/lib/image-quality")
				? "./image-quality.ts"
				: specifier;
		return next(target, context);
	},
});
const { startLiveQuality } = await import("./live-quality-sampler.ts");
const balanced = {
	meanLuma: 120,
	darkFraction: 0,
	brightFraction: 0,
	laplacianVariance: 200,
};
const classify = (patch = {}, motion = 0) =>
	classifyQuality({ ...balanced, ...patch }, motion);

test("photo assessment applies resolution and file-size thresholds", () => {
	assert.deepEqual(assessPhoto({ width: 999, height: 1000, bytes: 100_000 }), {
		resolution: "poor",
		fileSize: "good",
		overall: "poor",
		advice: "Low resolution — use a higher-resolution camera for more detail.",
	});
	assert.equal(
		assessPhoto({ width: 1000, height: 1000, bytes: 100_000 }).overall,
		"warning",
	);
	assert.equal(
		assessPhoto({ width: 1414, height: 1414, bytes: 100_000 }).resolution,
		"warning",
	);
	assert.deepEqual(assessPhoto({ width: 1415, height: 1415, bytes: 99_999 }), {
		resolution: "good",
		fileSize: "warning",
		overall: "warning",
		advice: "File is unusually small — check image detail before annotating.",
	});
	assert.deepEqual(assessPhoto({ width: 2000, height: 1500, bytes: 100_000 }), {
		resolution: "good",
		fileSize: "good",
		overall: "good",
		advice: null,
	});
});

test("invalid photo dimensions and byte counts return unknown assessment", () => {
	assert.equal(
		assessPhoto({ width: 0, height: 100, bytes: 100 }).overall,
		"unknown",
	);
	assert.equal(
		assessPhoto({ width: 100, height: 100, bytes: -1 }).overall,
		"unknown",
	);
});

test("aspect ratio, longest-side cap, no upscaling, rounded luma", () => {
	assert.deepEqual(analysisSize(1920, 1080), { width: 320, height: 180 });
	assert.deepEqual(analysisSize(1080, 1920), { width: 180, height: 320 });
	assert.deepEqual(analysisSize(40, 30), { width: 40, height: 30 });
	const gray = new Uint8Array(3);
	rgbaToGray(
		new Uint8ClampedArray([255, 0, 0, 255, 0, 255, 0, 255, 0, 0, 255, 255]),
		gray,
	);
	assert.deepEqual([...gray], [76, 150, 29]);
});

test("uniform frames, clipping proxies, insufficient and invalid dimensions", () => {
	assert.deepEqual(analyzeGray(new Uint8Array(9).fill(120), 3, 3), {
		...balanced,
		laplacianVariance: 0,
	});
	assert.equal(analyzeGray(new Uint8Array(4), 2, 2).laplacianVariance, null);
	for (const [width, height] of [
		[0, 0],
		[-1, 4],
		[2, 3],
		[1.5, 2],
		[NaN, 2],
	]) {
		assert.equal(analyzeGray(new Uint8Array(4), width, height), null);
	}
	const metrics = analyzeGray(new Uint8Array([0, 15, 16, 239, 240, 255]), 3, 2);
	assert.equal(metrics.darkFraction, 2 / 6);
	assert.equal(metrics.brightFraction, 2 / 6);
});

test("synthetic edge has greater Laplacian variance than a blurred edge", () => {
	const sharp = new Uint8Array(81);
	const soft = new Uint8Array(81);
	for (let y = 0; y < 9; y++)
		for (let x = 0; x < 9; x++) {
			sharp[y * 9 + x] = x < 4 ? 30 : 220;
			soft[y * 9 + x] = Math.round(30 + (190 * x) / 8);
		}
	assert.ok(
		analyzeGray(sharp, 9, 9).laplacianVariance >
			analyzeGray(soft, 9, 9).laplacianVariance,
	);
});

test("MAD: first frame, mismatch, empty, identical, changed", () => {
	const frame = new Uint8Array([0, 20, 40]);
	assert.equal(meanAbsoluteDifference(frame, null), null);
	assert.equal(meanAbsoluteDifference(frame, new Uint8Array(2)), null);
	assert.equal(
		meanAbsoluteDifference(new Uint8Array(), new Uint8Array()),
		null,
	);
	assert.equal(meanAbsoluteDifference(frame, frame.slice()), 0);
	assert.equal(meanAbsoluteDifference(frame, new Uint8Array([10, 30, 50])), 10);
});

test("focus, lighting and stability threshold boundaries", () => {
	for (const [value, expected] of [
		[59.9, "poor"],
		[60, "warning"],
		[150, "warning"],
		[150.1, "good"],
		[null, "unknown"],
	]) {
		assert.equal(classify({ laplacianVariance: value }).focus, expected);
	}
	for (const [value, expected] of [
		[39.9, "poor"],
		[40, "warning"],
		[59.9, "warning"],
		[60, "good"],
		[195, "good"],
		[195.1, "warning"],
		[220, "warning"],
		[220.1, "poor"],
	]) {
		assert.equal(classify({ meanLuma: value }).lighting, expected);
	}
	for (const field of ["darkFraction", "brightFraction"])
		for (const [value, expected] of [
			[0.099, "good"],
			[0.1, "warning"],
			[0.25, "warning"],
			[0.251, "poor"],
		]) {
			assert.equal(classify({ [field]: value }).lighting, expected);
		}
	for (const [value, expected] of [
		[null, "unknown"],
		[2.99, "good"],
		[3, "warning"],
		[8, "warning"],
		[8.01, "poor"],
	]) {
		assert.equal(classify({}, value).stability, expected);
	}
});

test("lighting direction, worst severity, overall ordering and guidance priority", () => {
	assert.equal(classify({ meanLuma: 20 }).lightingDirection, "dark");
	assert.equal(classify({ meanLuma: 230 }).lightingDirection, "bright");
	const mixed = classify({ darkFraction: 0.3, brightFraction: 0.2 });
	assert.equal(mixed.lighting, "poor");
	assert.equal(mixed.lightingDirection, "mixed");
	assert.match(qualitySuggestion(mixed, true, false), /glare and deep shadows/);
	assert.match(
		qualitySuggestion(classify({ meanLuma: 20 }), true, false),
		/torch/,
	);
	assert.doesNotMatch(
		qualitySuggestion(classify({ meanLuma: 20 }), false, false),
		/torch/,
	);
	assert.doesNotMatch(
		qualitySuggestion(classify({ meanLuma: 20 }), true, true),
		/torch/,
	);
	assert.match(
		qualitySuggestion({ ...mixed, stability: "poor" }, false, false),
		/steady/,
	);
	assert.match(
		qualitySuggestion({ ...mixed, stability: "warning" }, false, false),
		/glare/,
	);
	assert.equal(overallStatus(unknownChecks), "unknown");
	assert.equal(
		overallStatus({ ...unknownChecks, focus: "warning" }),
		"warning",
	);
	assert.equal(
		overallStatus({ ...unknownChecks, focus: "poor", lighting: "warning" }),
		"poor",
	);
	assert.equal(overallStatus(classify()), "good");
});

test("EMA and three consecutive candidates; unknown motion resets immediately", () => {
	const filter = createQualityFilter();
	assert.equal(filter(balanced, null).focus, "unknown");
	assert.equal(filter(balanced, 0).focus, "unknown");
	const third = filter(balanced, 0);
	assert.equal(third.focus, "good");
	assert.equal(third.stability, "unknown");
	assert.equal(filter(balanced, 0).stability, "good");
	assert.equal(filter(balanced, null).stability, "unknown");
	assert.equal(filter({ ...balanced, laplacianVariance: 0 }, 0).focus, "good");
	let result;
	for (let i = 0; i < 12; i++)
		result = filter({ ...balanced, laplacianVariance: 0 }, 0);
	assert.equal(result.focus, "poor");
	assert.equal(createQualityFilter()(balanced, null).focus, "unknown");
});

const fixture = (t, nativeFrames = true) => {
	const originals = new Map();
	const replace = (key, value) => {
		originals.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
		Object.defineProperty(globalThis, key, {
			configurable: true,
			writable: true,
			value,
		});
	};
	const document = new EventTarget();
	document.hidden = false;
	const window = new EventTarget();
	let draws = 0;
	let failed = false;
	let now = 1000;
	let nextId = 0;
	const frames = new Map();
	const timers = new Map();
	const pixels = new Uint8ClampedArray(4 * 4 * 4).fill(120);
	document.createElement = () => ({
		width: 300,
		height: 150,
		getContext: () => ({
			drawImage: () => {
				draws++;
			},
			getImageData: () => {
				if (failed) throw new Error("readback failed");
				return { data: pixels };
			},
		}),
	});
	class Stream {
		track = {
			id: "camera-one",
			muted: false,
			readyState: "live",
			stop: () => assert.fail("quality must not stop tracks"),
		};
		getVideoTracks = () => [this.track];
	}
	replace("document", document);
	replace("window", window);
	replace("MediaStream", Stream);
	replace("performance", { now: () => now });
	replace("setTimeout", (callback, delay) => {
		const id = ++nextId;
		timers.set(id, { callback, due: now + delay });
		return id;
	});
	replace("clearTimeout", (id) => timers.delete(id));
	const video = new EventTarget();
	Object.assign(video, {
		readyState: 2,
		paused: false,
		ended: false,
		videoWidth: 4,
		videoHeight: 4,
		currentTime: 0,
		srcObject: new Stream(),
	});
	if (nativeFrames)
		Object.assign(video, {
			requestVideoFrameCallback: (callback) => {
				const id = ++nextId;
				frames.set(id, callback);
				return id;
			},
			cancelVideoFrameCallback: (id) => frames.delete(id),
		});
	const updates = [];
	const stop = startLiveQuality(video, (quality) => updates.push(quality));
	t.after(() => {
		stop();
		for (const [key, descriptor] of originals) {
			if (descriptor) Object.defineProperty(globalThis, key, descriptor);
			else delete globalThis[key];
		}
	});
	const frame = (delay = 200) => {
		now += delay;
		video.currentTime += delay / 1000;
		for (const [id, callback] of [...frames]) {
			frames.delete(id);
			callback(now, {});
		}
		if (!nativeFrames)
			for (const [id, timer] of [...timers]) {
				if (timer.due <= now) {
					timers.delete(id);
					timer.callback();
				}
			}
	};
	return {
		video,
		document,
		window,
		frames,
		timers,
		updates,
		frame,
		stop,
		draws: () => draws,
		latest: () => updates.at(-1),
		fail: (value) => {
			failed = value;
		},
		poll: (delay) => {
			now += delay;
			for (const [id, timer] of [...timers]) {
				if (timer.due <= now) {
					timers.delete(id);
					timer.callback();
				}
			}
		},
	};
};

test("sampler waits for intrinsic current data and throttles native frames", (t) => {
	const f = fixture(t);
	f.video.readyState = 1;
	f.frame();
	assert.equal(f.draws(), 0);
	f.video.readyState = 2;
	f.video.videoWidth = 0;
	f.frame();
	assert.equal(f.draws(), 0);
	f.video.videoWidth = 4;
	f.frame();
	assert.equal(f.latest().stability, "unknown");
	f.frame(30);
	assert.equal(f.draws(), 1);
	f.frame(170);
	f.frame();
	f.frame();
	assert.equal(f.latest().stability, "good");
	assert.deepEqual(f.latest().preview, { width: 4, height: 4 });
	const count = f.updates.length;
	f.frame();
	assert.equal(
		f.updates.length,
		count,
		"unchanged statuses do not rerender React",
	);
});

test("stream, dimensions, orientation and long gaps reset temporal history", (t) => {
	const f = fixture(t);
	for (let i = 0; i < 4; i++) f.frame();
	assert.equal(f.latest().stability, "good");
	f.video.srcObject = new MediaStream();
	f.frame();
	assert.equal(f.latest().stability, "unknown");
	for (let i = 0; i < 3; i++) f.frame();
	f.video.videoWidth = 2;
	f.video.videoHeight = 8;
	f.frame();
	assert.equal(f.latest().stability, "unknown");
	assert.deepEqual(f.latest().preview, { width: 2, height: 8 });
	for (let i = 0; i < 3; i++) f.frame();
	f.window.dispatchEvent(new Event("orientationchange"));
	assert.equal(f.latest().overall, "unknown");
	for (let i = 0; i < 4; i++) f.frame();
	f.frame(600);
	assert.equal(f.latest().stability, "unknown");
});

test("hidden document suspends, resume warms up, stalled preview loses stale quality", (t) => {
	const f = fixture(t);
	for (let i = 0; i < 4; i++) f.frame();
	f.document.hidden = true;
	f.document.dispatchEvent(new Event("visibilitychange"));
	assert.equal(f.frames.size, 0);
	assert.equal(f.timers.size, 0);
	assert.equal(f.latest().overall, "unknown");
	f.document.hidden = false;
	f.document.dispatchEvent(new Event("visibilitychange"));
	f.frame();
	assert.equal(f.latest().stability, "unknown");
	f.poll(600);
	assert.equal(f.latest().unavailable, true);
	f.frame();
	assert.equal(f.latest().unavailable, false);
	assert.equal(f.latest().stability, "unknown");
});

test("readback failure leaves capture stream alone, recovery warms up", (t) => {
	const f = fixture(t);
	for (let i = 0; i < 4; i++) f.frame();
	f.fail(true);
	f.frame();
	assert.equal(f.latest().unavailable, true);
	assert.equal(f.latest().focus, "unknown");
	f.fail(false);
	f.frame();
	assert.equal(f.latest().unavailable, false);
	assert.equal(f.latest().stability, "unknown");
});

test("timer fallback works, interruption clears status, cleanup tolerates Strict Mode remount", (t) => {
	const f = fixture(t, false);
	for (let i = 0; i < 4; i++) f.frame();
	assert.equal(f.latest().stability, "good");
	f.video.dispatchEvent(new Event("pause"));
	assert.equal(f.latest().overall, "unknown");
	f.stop();
	assert.equal(f.timers.size, 0);
	const stopAgain = startLiveQuality(f.video, () => {});
	assert.equal(f.timers.size, 1);
	stopAgain();
	assert.equal(f.timers.size, 0);
	assert.equal(f.frames.size, 0);
});

test("timer fallback never recovers from a frozen frame until media time advances", (t) => {
	const f = fixture(t, false);
	for (let i = 0; i < 4; i++) f.frame();
	const draws = f.draws();
	f.poll(600);
	assert.equal(f.latest().unavailable, true);
	f.poll(600);
	assert.equal(f.latest().unavailable, true);
	assert.equal(f.draws(), draws);
	f.frame();
	assert.equal(f.latest().unavailable, false);
	assert.equal(f.latest().stability, "unknown");
});

test("native callback and watchdog cancelled on capture/unmount", (t) => {
	const f = fixture(t);
	assert.equal(f.frames.size, 1);
	assert.equal(f.timers.size, 1);
	f.stop();
	assert.equal(f.frames.size, 0);
	assert.equal(f.timers.size, 0);
	f.frame();
	assert.equal(f.draws(), 0);
});
