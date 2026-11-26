import { type RefObject, useEffect, useState } from "react";
import { type LiveQuality, unknownQuality } from "@/lib/image-quality";
import { startLiveQuality } from "@/lib/live-quality-sampler";

// Sample only while the camera preview is live; disabling cancels sampling.
export const useLiveImageQuality = (
	videoRef: RefObject<HTMLVideoElement | null>,
	enabled = true,
) => {
	const [quality, setQuality] = useState<LiveQuality>(unknownQuality);
	useEffect(() => {
		if (!enabled) return;
		const video = videoRef.current;
		if (video) return startLiveQuality(video, setQuality);
	}, [videoRef, enabled]);
	return quality;
};
