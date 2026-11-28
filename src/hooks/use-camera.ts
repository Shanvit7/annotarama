import { useCallback, useEffect, useRef, useState } from "react";
import { logger } from "../lib/logger.ts";

export type CameraStatus =
	| "idle"
	| "requesting"
	| "live"
	| "capturing"
	| "captured"
	| "error";

type CameraErrorCode =
	| "unsupported"
	| "permission-denied"
	| "camera-not-found"
	| "camera-in-use"
	| "constraints-unsupported"
	| "preview-failed"
	| "capture-not-ready"
	| "capture-failed"
	| "torch-unsupported"
	| "torch-failed"
	| "unknown";

export type CameraError = {
	code: CameraErrorCode;
	message: string;
};

export type CapturedPhoto = {
	blob: Blob;
	width: number;
	height: number;
};

type TorchCapabilities = MediaTrackCapabilities & { torch?: boolean };
type TorchConstraints = MediaTrackConstraints & {
	advanced?: Array<MediaTrackConstraintSet & { torch?: boolean }>;
};

const stopTracks = (stream: MediaStream) => {
	stream.getTracks().forEach((track) => {
		track.stop();
	});
};

export const getMaxResolution = (
	capabilities: MediaTrackCapabilities | undefined,
): { width: number; height: number } | null => {
	const width = capabilities?.width?.max ?? 0;
	const height = capabilities?.height?.max ?? 0;
	return width > 0 && height > 0 ? { width, height } : null;
};

const readTrackMaxResolution = (track: MediaStreamTrack) => {
	try {
		return getMaxResolution(track.getCapabilities?.());
	} catch (capabilityError) {
		logger.warn("Could not read camera capabilities", capabilityError);
		return null;
	}
};

// Camera streams default to a preview-friendly size, so ask for the sensor maximum before capturing.
const applyMaxResolution = async (track: MediaStreamTrack) => {
	const max = readTrackMaxResolution(track);
	if (!max) return;

	try {
		await track.applyConstraints({
			width: { ideal: max.width },
			height: { ideal: max.height },
		});
	} catch (constraintError) {
		logger.warn("Could not raise capture resolution", constraintError);
	}
};

const captureVideoFrame = async (
	video: HTMLVideoElement,
	width: number,
	height: number,
) => {
	const canvas = document.createElement("canvas");
	canvas.width = width;
	canvas.height = height;
	const context = canvas.getContext("2d");
	if (!context) throw new Error("Canvas is unavailable");
	context.drawImage(video, 0, 0, width, height);

	return await new Promise<Blob>((resolve, reject) => {
		canvas.toBlob(
			(result) => {
				if (result) resolve(result);
				else reject(new Error("Photo encoding failed"));
			},
			"image/jpeg",
			0.92,
		);
	});
};

export const mapCameraError = (error: unknown): CameraError => {
	const name = error instanceof Error ? error.name : "";

	switch (name) {
		case "NotAllowedError":
		case "SecurityError":
			return {
				code: "permission-denied",
				message:
					"Allow camera access in your browser settings, then try again.",
			};
		case "NotFoundError":
			return {
				code: "camera-not-found",
				message: "No camera was found. Connect a camera and try again.",
			};
		case "NotReadableError":
			return {
				code: "camera-in-use",
				message:
					"The camera is unavailable. Close other apps using it, then try again.",
			};
		case "OverconstrainedError":
			return {
				code: "constraints-unsupported",
				message: "This camera cannot use the requested settings. Try again.",
			};
		default:
			return {
				code: "unknown",
				message:
					"Camera could not be started. Check your browser settings and try again.",
			};
	}
};

const createCameraError = (
	code: CameraErrorCode,
	message: string,
): CameraError => ({
	code,
	message,
});

export const useCamera = () => {
	const videoRef = useRef<HTMLVideoElement>(null);
	const streamRef = useRef<MediaStream | null>(null);
	const photoRef = useRef<CapturedPhoto | null>(null);
	const requestIdRef = useRef(0);
	const [status, setStatus] = useState<CameraStatus>("idle");
	const [error, setError] = useState<CameraError | null>(null);
	const [photo, setPhoto] = useState<CapturedPhoto | null>(null);
	const [torchSupported, setTorchSupported] = useState(false);
	const [torchEnabled, setTorchEnabled] = useState(false);
	const [resolution, setResolution] = useState<{
		width: number;
		height: number;
	} | null>(null);
	const [cameraIds, setCameraIds] = useState<string[]>([]);
	const [activeCameraIndex, setActiveCameraIndex] = useState(0);
	const selectedCameraIdRef = useRef<string | null>(null);

	const releaseStream = useCallback(() => {
		const stream = streamRef.current;
		streamRef.current = null;
		if (stream) stopTracks(stream);

		if (videoRef.current?.srcObject === stream) {
			videoRef.current.srcObject = null;
		}
	}, []);

	const stopCamera = useCallback(() => {
		requestIdRef.current += 1;
		releaseStream();
		setTorchSupported(false);
		setTorchEnabled(false);
		setResolution(null);
		setError(null);
		setStatus(photoRef.current ? "captured" : "idle");
	}, [releaseStream]);

	const startCamera = useCallback(
		async (deviceId?: string) => {
			requestIdRef.current += 1;
			const requestId = requestIdRef.current;
			releaseStream();
			photoRef.current = null;
			setPhoto(null);
			setTorchSupported(false);
			setTorchEnabled(false);
			setResolution(null);
			setError(null);
			setStatus("requesting");

			if (
				typeof navigator === "undefined" ||
				!navigator.mediaDevices?.getUserMedia
			) {
				setError(
					createCameraError(
						"unsupported",
						"Camera access is unavailable here. Use a supported browser on HTTPS or localhost.",
					),
				);
				setStatus("error");
				return;
			}

			let stream: MediaStream;
			try {
				stream = await navigator.mediaDevices.getUserMedia({
					audio: false,
					video: {
						...(deviceId
							? { deviceId: { exact: deviceId } }
							: { facingMode: { ideal: "environment" } }),
						width: { ideal: 3840 },
						height: { ideal: 2160 },
					},
				});
			} catch (cameraError) {
				if (requestId !== requestIdRef.current) return;
				logger.warn("Camera access failed", cameraError);
				setError(mapCameraError(cameraError));
				setStatus("error");
				return;
			}

			if (requestId !== requestIdRef.current) {
				stopTracks(stream);
				return;
			}

			const video = videoRef.current;
			const track = stream.getVideoTracks()[0];
			if (!video || !track) {
				stopTracks(stream);
				setError(
					createCameraError(
						"preview-failed",
						"Camera preview could not be started. Try again.",
					),
				);
				setStatus("error");
				return;
			}

			streamRef.current = stream;
			video.srcObject = stream;
			video.muted = true;
			video.playsInline = true;

			try {
				await video.play();
			} catch (previewError) {
				if (requestId !== requestIdRef.current) return;
				logger.error("Camera preview failed", previewError);
				releaseStream();
				setError(
					createCameraError(
						"preview-failed",
						"Camera preview could not be started. Try again.",
					),
				);
				setStatus("error");
				return;
			}

			if (requestId !== requestIdRef.current) {
				stopTracks(stream);
				return;
			}

			await applyMaxResolution(track);

			if (requestId !== requestIdRef.current) {
				stopTracks(stream);
				return;
			}

			const settings = track.getSettings?.();
			const width = settings?.width ?? video.videoWidth;
			const height = settings?.height ?? video.videoHeight;
			const activeCameraId = settings?.deviceId ?? deviceId ?? null;
			selectedCameraIdRef.current = activeCameraId;
			setResolution(width > 0 && height > 0 ? { width, height } : null);

			try {
				const capabilities = track.getCapabilities?.() as
					| TorchCapabilities
					| undefined;
				setTorchSupported(capabilities?.torch === true);
			} catch {
				setTorchSupported(false);
			}

			try {
				const cameras = await navigator.mediaDevices.enumerateDevices();
				if (requestId !== requestIdRef.current) {
					stopTracks(stream);
					return;
				}
				const ids = cameras
					.filter((camera) => camera.kind === "videoinput" && camera.deviceId)
					.map((camera) => camera.deviceId);
				setCameraIds(ids);
				const index = ids.indexOf(activeCameraId ?? "");
				setActiveCameraIndex(index < 0 ? 0 : index);
			} catch (enumerateError) {
				if (requestId !== requestIdRef.current) {
					stopTracks(stream);
					return;
				}
				logger.warn("Could not enumerate cameras", enumerateError);
				setCameraIds([]);
				setActiveCameraIndex(0);
			}
			setStatus("live");
		},
		[releaseStream],
	);

	const restorePhoto = useCallback(
		(restoredPhoto: CapturedPhoto) => {
			requestIdRef.current += 1;
			releaseStream();
			photoRef.current = restoredPhoto;
			setPhoto(restoredPhoto);
			setError(null);
			setStatus("captured");
		},
		[releaseStream],
	);

	const capturePhoto = useCallback(async () => {
		const video = videoRef.current;
		const track = streamRef.current?.getVideoTracks()[0] ?? null;
		const frameWidth = video?.videoWidth ?? 0;
		const frameHeight = video?.videoHeight ?? 0;

		if (!video || !track || frameWidth === 0 || frameHeight === 0) {
			setError(
				createCameraError(
					"capture-not-ready",
					"Wait for the camera preview, then try again.",
				),
			);
			return null;
		}

		setStatus("capturing");

		try {
			const blob = await captureVideoFrame(video, frameWidth, frameHeight);
			const capturedPhoto = {
				blob,
				width: frameWidth,
				height: frameHeight,
			};
			photoRef.current = capturedPhoto;
			setPhoto(capturedPhoto);
			requestIdRef.current += 1;
			releaseStream();
			setTorchSupported(false);
			setTorchEnabled(false);
			setError(null);
			setStatus("captured");
			return capturedPhoto;
		} catch (captureError) {
			logger.error("Photo capture failed", captureError);
			setError(
				createCameraError(
					"capture-failed",
					"Photo could not be captured. Try again.",
				),
			);
			setStatus("live");
			return null;
		}
	}, [releaseStream]);

	const retakePhoto = useCallback(async () => {
		photoRef.current = null;
		setPhoto(null);
		await startCamera(selectedCameraIdRef.current ?? undefined);
	}, [startCamera]);

	const switchCamera = useCallback(async () => {
		if (cameraIds.length < 2) return;
		const nextIndex = (activeCameraIndex + 1) % cameraIds.length;
		await startCamera(cameraIds[nextIndex]);
	}, [activeCameraIndex, cameraIds, startCamera]);

	const setTorch = useCallback(async (enabled: boolean) => {
		const track = streamRef.current?.getVideoTracks()[0];
		let capabilities: TorchCapabilities | undefined;
		try {
			capabilities = track?.getCapabilities?.() as
				| TorchCapabilities
				| undefined;
		} catch (capabilityError) {
			logger.warn("Could not read torch capability", capabilityError);
			setTorchSupported(false);
			setTorchEnabled(false);
			setError(
				createCameraError(
					"torch-failed",
					"Torch support could not be checked on this camera.",
				),
			);
			return false;
		}

		if (!track || capabilities?.torch !== true) {
			setTorchSupported(false);
			setTorchEnabled(false);
			setError(
				createCameraError(
					"torch-unsupported",
					"Torch is not available on this camera.",
				),
			);
			return false;
		}

		try {
			const constraints: TorchConstraints = { advanced: [{ torch: enabled }] };
			await track.applyConstraints(constraints);
			const actualTorchState = track.getSettings().torch ?? enabled;
			setTorchEnabled(actualTorchState);
			setError(null);
			return actualTorchState;
		} catch (torchError) {
			logger.warn("Could not change torch state", torchError);
			try {
				setTorchEnabled(track.getSettings().torch ?? false);
			} catch {
				setTorchEnabled(false);
			}
			setError(
				createCameraError(
					"torch-failed",
					"Torch could not be changed on this camera.",
				),
			);
			return false;
		}
	}, []);

	useEffect(
		() => () => {
			requestIdRef.current += 1;
			releaseStream();
		},
		[releaseStream],
	);

	return {
		videoRef,
		status,
		error,
		photo,
		torchSupported,
		torchEnabled,
		resolution,
		canSwitchCamera: cameraIds.length > 1,
		startCamera,
		switchCamera,
		stopCamera,
		capturePhoto,
		restorePhoto,
		retakePhoto,
		setTorch,
	};
};
