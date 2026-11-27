import assert from "node:assert/strict";
import test from "node:test";
import { getMaxResolution, mapCameraError } from "./use-camera.ts";

test("maps denied camera permission to a recoverable error", () => {
	const error = Object.assign(new Error("denied"), { name: "NotAllowedError" });

	assert.equal(mapCameraError(error).code, "permission-denied");
});

test("maps missing camera devices", () => {
	const error = Object.assign(new Error("missing"), { name: "NotFoundError" });

	assert.equal(mapCameraError(error).code, "camera-not-found");
});

test("maps unknown errors without losing recovery guidance", () => {
	assert.match(mapCameraError(new Error("unexpected")).message, /try again/i);
});

test("asks for the sensor maximum resolution when the track reports one", () => {
	const capabilities = { width: { max: 4032 }, height: { max: 3024 } };

	assert.deepEqual(getMaxResolution(capabilities), {
		width: 4032,
		height: 3024,
	});
});

test("ignores capabilities without a usable maximum", () => {
	assert.equal(getMaxResolution(undefined), null);
	assert.equal(
		getMaxResolution({ width: { max: 0 }, height: { max: 0 } }),
		null,
	);
});
