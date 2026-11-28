import {
	analysisSize,
	analyzeGray,
	createQualityFilter,
	type LiveQuality,
	meanAbsoluteDifference,
	overallStatus,
	rgbaToGray,
	unknownQuality,
} from "@/lib/image-quality";

// Observes the existing preview; never owns or stops its MediaStream tracks.
export const startLiveQuality = (
	video: HTMLVideoElement,
	onQuality: (quality: LiveQuality) => void,
) => {
	const canvas = document.createElement("canvas");
	const context = canvas.getContext("2d", { willReadFrequently: true });
	let current = new Uint8Array(0);
	let previous = new Uint8Array(0);
	let filter = createQualityFilter();
	let lastSample = 0;
	let samplingSince = performance.now();
	let lastMediaTime = -1;
	let hasPrevious = false;
	let source: HTMLVideoElement["srcObject"] = null;
	let trackId: string | undefined;
	let width = 0;
	let height = 0;
	let frameId: number | null = null;
	let timer: ReturnType<typeof setTimeout> | null = null;
	let stopped = false;
	let published = unknownQuality;

	const publish = (next: LiveQuality) => {
		if (
			next.focus === published.focus &&
			next.lighting === published.lighting &&
			next.stability === published.stability &&
			next.lightingDirection === published.lightingDirection &&
			next.unavailable === published.unavailable &&
			next.preview?.width === published.preview?.width &&
			next.preview?.height === published.preview?.height
		)
			return;
		published = next;
		onQuality(next);
	};
	const reset = (unavailable = false) => {
		filter = createQualityFilter();
		hasPrevious = false;
		lastSample = 0;
		publish({ ...unknownQuality, unavailable });
	};
	const cancel = () => {
		if (frameId !== null) video.cancelVideoFrameCallback(frameId);
		if (timer !== null) clearTimeout(timer);
		frameId = null;
		timer = null;
	};
	const sample = (now: number) => {
		if (lastSample && now - lastSample < 200) return;
		const stream = video.srcObject;
		const track =
			stream instanceof MediaStream ? stream.getVideoTracks()[0] : undefined;
		if (
			video.readyState < 2 ||
			video.paused ||
			video.ended ||
			!video.videoWidth ||
			!video.videoHeight ||
			track?.muted ||
			track?.readyState === "ended"
		) {
			reset();
			return;
		}
		if (
			stream !== source ||
			track?.id !== trackId ||
			width !== video.videoWidth ||
			height !== video.videoHeight
		) {
			reset();
			samplingSince = now;
			lastMediaTime = -1;
			source = stream;
			trackId = track?.id;
			width = video.videoWidth;
			height = video.videoHeight;
		}
		if (video.currentTime === lastMediaTime) return;
		const gap = now - lastSample;
		if (lastSample && gap > 400) reset();
		try {
			if (!context) throw new Error("Canvas unavailable");
			const size = analysisSize(width, height);
			if (
				canvas.width !== size.width ||
				canvas.height !== size.height ||
				current.length !== size.width * size.height
			) {
				canvas.width = size.width;
				canvas.height = size.height;
				current = new Uint8Array(size.width * size.height);
				previous = new Uint8Array(current.length);
			}
			context.drawImage(video, 0, 0, size.width, size.height);
			rgbaToGray(
				context.getImageData(0, 0, size.width, size.height).data,
				current,
			);
			const metrics = analyzeGray(current, size.width, size.height);
			if (!metrics) throw new Error("Invalid frame dimensions");
			const motion =
				hasPrevious && gap >= 100 && gap <= 400
					? meanAbsoluteDifference(current, previous)
					: null;
			const checks = filter(metrics, motion);
			publish({
				...checks,
				overall: overallStatus(checks),
				preview: { width, height },
				unavailable: false,
			});
			[previous, current] = [current, previous];
			hasPrevious = true;
			lastSample = now;
			lastMediaTime = video.currentTime;
		} catch {
			reset(true);
			// Throttle retries too; a readback error must never disable capture.
			lastSample = now;
		}
	};
	const tick: VideoFrameRequestCallback = (now) => {
		frameId = null;
		if (stopped || document.hidden) return;
		sample(now);
		frameId = video.requestVideoFrameCallback(tick);
	};
	const poll = () => {
		timer = null;
		if (stopped || document.hidden) return;
		const now = performance.now();
		if (lastSample && now - lastSample > 400) reset(true);
		else if (!lastSample && now - samplingSince > 2_000) reset(true);
		if (typeof video.requestVideoFrameCallback !== "function") sample(now);
		timer = setTimeout(poll, 200);
	};
	const resume = () => {
		cancel();
		samplingSince = performance.now();
		reset();
		if (stopped || document.hidden) return;
		if (typeof video.requestVideoFrameCallback === "function")
			frameId = video.requestVideoFrameCallback(tick);
		timer = setTimeout(poll, 200);
	};
	const interrupt = () => {
		samplingSince = performance.now();
		reset();
	};
	document.addEventListener("visibilitychange", resume);
	window.addEventListener("orientationchange", resume);
	for (const event of ["emptied", "waiting", "pause", "ended"])
		video.addEventListener(event, interrupt);
	resume();
	return () => {
		stopped = true;
		cancel();
		document.removeEventListener("visibilitychange", resume);
		window.removeEventListener("orientationchange", resume);
		for (const event of ["emptied", "waiting", "pause", "ended"])
			video.removeEventListener(event, interrupt);
	};
};
