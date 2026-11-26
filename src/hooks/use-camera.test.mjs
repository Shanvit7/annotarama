import assert from "node:assert/strict";
import test from "node:test";
import { mapCameraError } from "./use-camera.ts";

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
