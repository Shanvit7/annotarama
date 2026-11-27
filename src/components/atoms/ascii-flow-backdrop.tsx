import { useEffect, useRef } from "react";

export const AsciiFlowBackdrop = () => {
	const canvasRef = useRef<HTMLCanvasElement>(null);

	useEffect(() => {
		const canvas = canvasRef.current;
		const context = canvas?.getContext("2d");
		if (!canvas || !context) return;

		const rootStyles = getComputedStyle(document.documentElement);
		const colors = [
			"--color-accent",
			"--color-frost",
			"--color-indigo-light",
		].map((token) => rootStyles.getPropertyValue(token).trim());
		const reducedMotion = matchMedia(
			"(prefers-reduced-motion: reduce)",
		).matches;
		let width = 0;
		let height = 0;
		let animationFrame = 0;
		let lastFrame = 0;

		const draw = (time: number) => {
			const cellWidth = 8;
			const cellHeight = 12;
			const columns = Math.ceil(width / cellWidth);
			const rows = Math.ceil(height / cellHeight);
			const phase = ((time % 8000) / 8000) * Math.PI * 2;
			context.clearRect(0, 0, width, height);
			context.font = `${cellHeight}px monospace`;

			for (let row = 0; row < rows; row += 1) {
				for (let column = 0; column < columns; column += 1) {
					const x = column / columns;
					const y = row / rows;
					const flow =
						(Math.sin(x * 8 + phase + Math.sin(y * 5 - phase)) +
							Math.cos(y * 10 - phase + x * 3) +
							Math.sin((x + y) * 12 - phase * 2)) /
						3;
					const density = (flow + 1) / 2;
					if (density < 0.22) continue;

					context.globalAlpha = 0.22 + density * 0.38;
					context.fillStyle =
						colors[(column + row + Math.floor(density * 3)) % colors.length];
					const glyphs = " .:-=+*#%@";
					const glyph =
						glyphs[
							Math.min(glyphs.length - 1, Math.floor(density * glyphs.length))
						];
					context.fillText(glyph, column * cellWidth, row * cellHeight);
				}
			}
		};

		const animate = (time: number) => {
			if (time - lastFrame >= 1000 / 30 && !document.hidden) {
				lastFrame = time;
				draw(time);
			}
			animationFrame = requestAnimationFrame(animate);
		};

		const resize = () => {
			const bounds = canvas.getBoundingClientRect();
			const scale = Math.min(window.devicePixelRatio || 1, 1.5);
			width = bounds.width;
			height = bounds.height;
			canvas.width = Math.floor(width * scale);
			canvas.height = Math.floor(height * scale);
			context.setTransform(scale, 0, 0, scale, 0, 0);
			draw(reducedMotion ? 0 : performance.now());
		};
		const observer = new ResizeObserver(resize);
		observer.observe(canvas);
		resize();
		if (!reducedMotion) animationFrame = requestAnimationFrame(animate);

		return () => {
			observer.disconnect();
			cancelAnimationFrame(animationFrame);
		};
	}, []);

	return (
		<div aria-hidden="true" className="pointer-events-none absolute inset-0">
			<canvas ref={canvasRef} className="size-full" />
		</div>
	);
};
