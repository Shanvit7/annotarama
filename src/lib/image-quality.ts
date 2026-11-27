export type QualityStatus = "good" | "warning" | "poor" | "unknown";
export type PhotoAssessment = {
	resolution: QualityStatus;
	fileSize: QualityStatus;
	overall: QualityStatus;
	advice: string | null;
};
type LightingDirection = "dark" | "bright" | "mixed" | "balanced" | "unknown";
export type PixelMetrics = {
	meanLuma: number;
	darkFraction: number;
	brightFraction: number;
	laplacianVariance: number | null;
};
export type QualityChecks = {
	focus: QualityStatus;
	lighting: QualityStatus;
	stability: QualityStatus;
	lightingDirection: LightingDirection;
};
export type LiveQuality = QualityChecks & {
	overall: QualityStatus;
	preview: { width: number; height: number } | null;
	unavailable: boolean;
};

export const unknownChecks: QualityChecks = {
	focus: "unknown",
	lighting: "unknown",
	stability: "unknown",
	lightingDirection: "unknown",
};
export const unknownQuality: LiveQuality = {
	...unknownChecks,
	overall: "unknown",
	preview: null,
	unavailable: false,
};

export const analysisSize = (width: number, height: number) => {
	const scale = Math.min(1, 320 / Math.max(width, height));
	return {
		width: Math.max(1, Math.round(width * scale)),
		height: Math.max(1, Math.round(height * scale)),
	};
};

export const rgbaToGray = (rgba: Uint8ClampedArray, gray: Uint8Array) => {
	for (let i = 0; i < gray.length; i++) {
		const p = i * 4;
		gray[i] = Math.round(
			0.299 * rgba[p] + 0.587 * rgba[p + 1] + 0.114 * rgba[p + 2],
		);
	}
};

export const analyzeGray = (
	gray: Uint8Array,
	width: number,
	height: number,
): PixelMetrics | null => {
	const n = width * height;
	if (
		!Number.isInteger(width) ||
		!Number.isInteger(height) ||
		width <= 0 ||
		height <= 0 ||
		n !== gray.length
	)
		return null;
	let total = 0;
	let dark = 0;
	let bright = 0;
	for (const y of gray) {
		total += y;
		if (y <= 15) dark++;
		if (y >= 240) bright++;
	}
	let sum = 0;
	let sumSq = 0;
	let count = 0;
	for (let y = 1; y < height - 1; y++) {
		for (let x = 1; x < width - 1; x++) {
			const i = y * width + x;
			const l =
				gray[i - width] +
				gray[i + width] +
				gray[i - 1] +
				gray[i + 1] -
				4 * gray[i];
			sum += l;
			sumSq += l * l;
			count++;
		}
	}
	return {
		meanLuma: total / n,
		darkFraction: dark / n,
		brightFraction: bright / n,
		laplacianVariance: count
			? Math.max(0, sumSq / count - (sum / count) ** 2)
			: null,
	};
};

export const meanAbsoluteDifference = (
	current: Uint8Array,
	previous: Uint8Array | null,
) => {
	if (!previous || !current.length || current.length !== previous.length)
		return null;
	let total = 0;
	for (let i = 0; i < current.length; i++)
		total += Math.abs(current[i] - previous[i]);
	return total / current.length;
};

export const assessPhoto = ({
	width,
	height,
	bytes,
}: {
	width: number;
	height: number;
	bytes: number;
}): PhotoAssessment => {
	if (
		!Number.isFinite(width) ||
		!Number.isFinite(height) ||
		!Number.isFinite(bytes) ||
		width <= 0 ||
		height <= 0 ||
		bytes < 0
	) {
		return {
			resolution: "unknown",
			fileSize: "unknown",
			overall: "unknown",
			advice: "Photo details could not be checked.",
		};
	}

	const megapixels = (width * height) / 1_000_000;
	const resolution =
		megapixels < 1 ? "poor" : megapixels < 2 ? "warning" : "good";
	const fileSize = bytes < 100_000 ? "warning" : "good";
	const overall =
		resolution === "poor"
			? "poor"
			: resolution === "warning" || fileSize === "warning"
				? "warning"
				: "good";
	const advice =
		resolution === "poor"
			? "Low resolution — use a higher-resolution camera for more detail."
			: resolution === "warning"
				? "Resolution is limited — retake if you need fine detail."
				: fileSize === "warning"
					? "File is unusually small — check image detail before annotating."
					: null;

	return { resolution, fileSize, overall, advice };
};

export const overallStatus = (checks: QualityChecks): QualityStatus => {
	const statuses = [checks.focus, checks.lighting, checks.stability];
	if (statuses.includes("poor")) return "poor";
	if (statuses.includes("warning")) return "warning";
	if (statuses.includes("unknown")) return "unknown";
	return "good";
};

export const classifyQuality = (
	metrics: PixelMetrics,
	motion: number | null,
): QualityChecks => {
	const { meanLuma, darkFraction, brightFraction, laplacianVariance } = metrics;
	const dark = meanLuma < 60 || darkFraction >= 0.1;
	const bright = meanLuma > 195 || brightFraction >= 0.1;
	const lighting =
		meanLuma < 40 ||
		meanLuma > 220 ||
		darkFraction > 0.25 ||
		brightFraction > 0.25
			? "poor"
			: dark || bright
				? "warning"
				: "good";
	return {
		focus:
			laplacianVariance === null
				? "unknown"
				: laplacianVariance > 150
					? "good"
					: laplacianVariance >= 60
						? "warning"
						: "poor",
		lighting,
		lightingDirection:
			dark && bright ? "mixed" : dark ? "dark" : bright ? "bright" : "balanced",
		stability:
			motion === null
				? "unknown"
				: motion < 3
					? "good"
					: motion <= 8
						? "warning"
						: "poor",
	};
};

// Experimental thresholds: calibrate with the same longest-side 320px preprocessing.
export const createQualityFilter = () => {
	let smoothed: PixelMetrics | null = null;
	let smoothedMotion: number | null = null;
	const visible = { ...unknownChecks };
	let candidate = { ...unknownChecks };
	const runs = { focus: 0, lighting: 0, stability: 0 };
	const ema = (previous: number | null, next: number | null): number | null =>
		next === null
			? null
			: previous === null
				? next
				: previous + 0.35 * (next - previous);
	return (metrics: PixelMetrics, motion: number | null): QualityChecks => {
		smoothed = {
			meanLuma:
				ema(smoothed?.meanLuma ?? null, metrics.meanLuma) ?? metrics.meanLuma,
			darkFraction:
				ema(smoothed?.darkFraction ?? null, metrics.darkFraction) ??
				metrics.darkFraction,
			brightFraction:
				ema(smoothed?.brightFraction ?? null, metrics.brightFraction) ??
				metrics.brightFraction,
			laplacianVariance: ema(
				smoothed?.laplacianVariance ?? null,
				metrics.laplacianVariance,
			),
		};
		smoothedMotion = ema(smoothedMotion, motion);
		const next = classifyQuality(smoothed, smoothedMotion);
		for (const key of ["focus", "lighting", "stability"] as const) {
			const same =
				next[key] === candidate[key] &&
				(key !== "lighting" ||
					next.lightingDirection === candidate.lightingDirection);
			runs[key] = same ? runs[key] + 1 : 1;
			if (next[key] === "unknown" || runs[key] >= 3) {
				visible[key] = next[key];
				if (key === "lighting")
					visible.lightingDirection = next.lightingDirection;
			}
		}
		candidate = next;
		return { ...visible };
	};
};

export const qualitySuggestion = (
	quality: QualityChecks,
	torchSupported: boolean,
	torchEnabled: boolean,
) => {
	for (const severity of ["poor", "warning"] as const) {
		if (quality.stability === severity)
			return "Hold the camera steady and wait for movement to settle.";
		if (quality.lighting === severity) {
			if (quality.lightingDirection === "mixed")
				return "Avoid glare and deep shadows.";
			if (quality.lightingDirection === "bright")
				return "Reduce direct light or move away from glare.";
			return torchSupported && !torchEnabled
				? "Increase light or turn on the torch."
				: "Increase ambient light.";
		}
		if (quality.focus === severity)
			return "Allow the camera to focus or adjust your distance.";
	}
	return "Estimates only. You can capture at any time.";
};
