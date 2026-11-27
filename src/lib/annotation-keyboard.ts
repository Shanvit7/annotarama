import type { RectangleGeometry } from "@annotorious/react";

export type RectangleArrowKey =
	| "ArrowDown"
	| "ArrowLeft"
	| "ArrowRight"
	| "ArrowUp";

export const adjustRectangleForKey = (
	geometry: RectangleGeometry,
	key: RectangleArrowKey,
	imageWidth: number,
	imageHeight: number,
	resize: boolean,
	fine: boolean,
): RectangleGeometry => {
	const step = fine ? 1 : 10;
	let { x, y, w, h } = geometry;

	if (resize) {
		if (key === "ArrowLeft") w = Math.max(1, w - step);
		if (key === "ArrowRight")
			w = Math.min(Math.max(1, imageWidth - x), w + step);
		if (key === "ArrowUp") h = Math.max(1, h - step);
		if (key === "ArrowDown")
			h = Math.min(Math.max(1, imageHeight - y), h + step);
	} else {
		if (key === "ArrowLeft") x = Math.max(0, x - step);
		if (key === "ArrowRight")
			x = Math.min(Math.max(0, imageWidth - w), x + step);
		if (key === "ArrowUp") y = Math.max(0, y - step);
		if (key === "ArrowDown")
			y = Math.min(Math.max(0, imageHeight - h), y + step);
	}

	return {
		...geometry,
		x,
		y,
		w,
		h,
		bounds: { minX: x, minY: y, maxX: x + w, maxY: y + h },
	};
};
