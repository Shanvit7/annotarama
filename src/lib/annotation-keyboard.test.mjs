import assert from "node:assert/strict";
import { test } from "node:test";
import { adjustRectangleForKey } from "./annotation-keyboard.ts";

const rectangle = {
	x: 20,
	y: 30,
	w: 40,
	h: 50,
	bounds: { minX: 20, minY: 30, maxX: 60, maxY: 80 },
};

test("arrow keys move rectangle in 10px steps; Alt makes steps precise", () => {
	assert.deepEqual(
		adjustRectangleForKey(rectangle, "ArrowRight", 100, 100, false, false),
		{ ...rectangle, x: 30, bounds: { minX: 30, minY: 30, maxX: 70, maxY: 80 } },
	);
	assert.equal(
		adjustRectangleForKey(rectangle, "ArrowUp", 100, 100, false, true).y,
		29,
	);
});

test("movement stays within image bounds", () => {
	assert.equal(
		adjustRectangleForKey(
			{ ...rectangle, x: 5 },
			"ArrowLeft",
			100,
			100,
			false,
			false,
		).x,
		0,
	);
	assert.equal(
		adjustRectangleForKey(
			{ ...rectangle, y: 45 },
			"ArrowDown",
			100,
			100,
			false,
			false,
		).y,
		50,
	);
});

test("Shift+arrows resize from top-left and keep 1px minimum", () => {
	assert.deepEqual(
		adjustRectangleForKey(rectangle, "ArrowRight", 100, 100, true, false),
		{ ...rectangle, w: 50, bounds: { minX: 20, minY: 30, maxX: 70, maxY: 80 } },
	);
	assert.equal(
		adjustRectangleForKey(rectangle, "ArrowLeft", 100, 100, true, false).w,
		30,
	);
	assert.equal(
		adjustRectangleForKey(
			{ ...rectangle, w: 5 },
			"ArrowLeft",
			100,
			100,
			true,
			false,
		).w,
		1,
	);
});

test("resizing cannot extend beyond image edges", () => {
	assert.equal(
		adjustRectangleForKey(rectangle, "ArrowRight", 65, 100, true, false).w,
		45,
	);
	assert.equal(
		adjustRectangleForKey(rectangle, "ArrowDown", 100, 82, true, false).h,
		52,
	);
});
