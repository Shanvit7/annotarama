import { Link } from "@tanstack/react-router";
import { toast } from "@yusufceng1z/ding-react";
import { useEffect, useRef, useState } from "react";
import { CameraPreviewControls } from "@/components/molecules/camera-preview-controls";
import {
	CameraLiveQuality,
	CapturedPhotoSummary,
} from "@/components/organisms/camera-live-quality";
import { ImageAnnotationEditor } from "@/components/organisms/image-annotation-editor";
import { useCamera } from "@/hooks/use-camera";
import { useLiveImageQuality } from "@/hooks/use-live-image-quality";
import { APP_FAVICON_URL } from "@/lib/constants";
import type { LiveQuality } from "@/lib/image-quality";

const formatFileSize = (bytes: number) => {
	const isMegabytes = bytes >= 1_000_000;
	const unitSize = isMegabytes ? 1_000_000 : 1_000;
	const unit = isMegabytes ? "MB" : "KB";
	return `${(bytes / unitSize).toFixed(isMegabytes ? 1 : 0)} ${unit}`;
};

const AsciiFlowBackdrop = () => {
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

type CaptureWorkspaceProps = {
	camera: ReturnType<typeof useCamera>;
	isLive: boolean;
	isCaptured: boolean;
	liveQuality: LiveQuality;
	qualityAtCapture: LiveQuality | null;
	liveBorderClass: string;
	photoUrl: string | null;
	annotationSheetContainer: HTMLElement | null;
	setAnnotationSheetContainer: (container: HTMLElement | null) => void;
	onCapture: () => void;
	onRetake: () => void;
};

const getLiveBorderClass = (quality: LiveQuality) => {
	if (quality.unavailable || quality.overall === "unknown") {
		return "border-surface/50";
	}
	if (quality.overall === "good") return "border-success";
	if (quality.overall === "warning") return "border-amber-400";
	return "border-error";
};

const LiveQualityOverlay = ({
	isLive,
	quality,
	torchSupported,
	torchEnabled,
}: {
	isLive: boolean;
	quality: LiveQuality;
	torchSupported: boolean;
	torchEnabled: boolean;
}) => {
	if (!isLive) return null;
	if (quality.unavailable || quality.overall !== "good") {
		return (
			<CameraLiveQuality
				quality={quality}
				torchSupported={torchSupported}
				torchEnabled={torchEnabled}
			/>
		);
	}
	return (
		<p
			aria-live="polite"
			className="pointer-events-none absolute left-1/2 top-3 z-10 w-fit max-w-[calc(100%_-_1.5rem)] -translate-x-1/2 rounded-xl border border-success/40 bg-secondary/50 px-3 py-1.5 text-sm font-semibold text-surface shadow-sm backdrop-blur-sm"
		>
			Looks good — take the photo now.
		</p>
	);
};

const IdleCameraBackdrop = ({
	isLive,
	isCaptured,
}: Pick<CaptureWorkspaceProps, "isLive" | "isCaptured">) =>
	!isLive && !isCaptured ? <AsciiFlowBackdrop /> : null;

const CapturedPhotoPreview = ({
	isCaptured,
	photo,
	photoUrl,
	annotationSheetContainer,
}: Pick<
	CaptureWorkspaceProps,
	"isCaptured" | "photoUrl" | "annotationSheetContainer"
> & {
	photo: ReturnType<typeof useCamera>["photo"];
}) => {
	if (!isCaptured) return null;
	if (photoUrl && annotationSheetContainer && photo) {
		return (
			<ImageAnnotationEditor
				imageUrl={photoUrl}
				imageWidth={photo.width}
				imageHeight={photo.height}
				annotationSheetContainer={annotationSheetContainer}
			/>
		);
	}
	return (
		<p className="absolute inset-0 z-10 m-0 grid place-content-center p-4 text-regular leading-relaxed text-white/90 lg:text-base lg:leading-6">
			Preparing photo preview…
		</p>
	);
};

const getPreviewFrameClass = (
	isLive: boolean,
	isCaptured: boolean,
	liveBorderClass: string,
) =>
	`relative overflow-hidden rounded-2xl text-center ${isLive ? `h-full w-auto max-w-full aspect-video flex-none border-2 ${liveBorderClass} min-h-40` : "flex min-h-0 flex-1 flex-col"} ${isCaptured ? "bg-surface" : isLive ? "bg-transparent text-surface" : "bg-secondary text-surface"}`;

const CapturePreviewFrame = ({
	camera,
	isLive,
	isCaptured,
	liveQuality,
	liveBorderClass,
	photoUrl,
	annotationSheetContainer,
	onCapture,
}: CaptureWorkspaceProps) => {
	const { photo, videoRef } = camera;

	return (
		<div className={getPreviewFrameClass(isLive, isCaptured, liveBorderClass)}>
			<video
				ref={videoRef}
				autoPlay
				muted
				playsInline
				aria-label="Live camera preview"
				aria-hidden={!isLive}
				className={
					isLive ? "absolute inset-0 size-full object-cover" : "hidden"
				}
			/>
			<LiveQualityOverlay
				isLive={isLive}
				quality={liveQuality}
				torchSupported={camera.torchSupported}
				torchEnabled={camera.torchEnabled}
			/>
			<IdleCameraBackdrop isLive={isLive} isCaptured={isCaptured} />
			<CapturedPhotoPreview
				isCaptured={isCaptured}
				photo={photo}
				photoUrl={photoUrl}
				annotationSheetContainer={annotationSheetContainer}
			/>
			<CameraPreviewControls
				status={camera.status}
				canSwitchCamera={camera.canSwitchCamera}
				torchSupported={camera.torchSupported}
				torchEnabled={camera.torchEnabled}
				onStart={() => void camera.startCamera()}
				onCapture={onCapture}
				onSwitchCamera={() => void camera.switchCamera()}
				onStop={camera.stopCamera}
				onTorch={() => void camera.setTorch(!camera.torchEnabled)}
			/>
		</div>
	);
};

const CaptureWorkspace = (props: CaptureWorkspaceProps) => {
	const {
		camera,
		isLive,
		isCaptured,
		liveQuality,
		qualityAtCapture,
		setAnnotationSheetContainer,
		onRetake,
	} = props;
	const { photo } = camera;

	return (
		<section
			ref={setAnnotationSheetContainer}
			aria-label={isCaptured ? "Annotate photo" : "Capture an image"}
			className={`relative grid min-h-0 min-w-0 grid-rows-[minmax(0,1fr)] overflow-hidden ${isCaptured ? "rounded-xl border border-border/50 bg-surface p-3" : isLive ? "rounded-2xl bg-transparent" : "rounded-2xl bg-secondary"}`}
		>
			<div
				data-capture-workspace
				className={`relative min-h-0 min-w-0 ${isCaptured ? "grid flex-1 grid-rows-[minmax(0,1fr)_auto] gap-2 lg:grid-cols-[15rem_minmax(0,1fr)] lg:grid-rows-1 [@media(max-height:34rem)_and_(min-width:40rem)]:grid-cols-[12rem_minmax(0,1fr)] [@media(max-height:34rem)_and_(min-width:40rem)]:grid-rows-1" : "flex min-h-0 flex-col"}`}
			>
				{isCaptured && photo && (
					<div className="order-last min-w-0 lg:order-first">
						<CapturedPhotoSummary
							quality={qualityAtCapture ?? liveQuality}
							onRetake={onRetake}
							width={photo.width}
							height={photo.height}
							fileSize={formatFileSize(photo.blob.size)}
						/>
					</div>
				)}
				<div
					className={`flex min-h-0 flex-1 ${isLive ? "justify-center" : ""} ${isCaptured ? "order-first min-w-0 lg:order-last" : ""}`}
				>
					<CapturePreviewFrame {...props} />
				</div>
			</div>
		</section>
	);
};

const CameraCapture = () => {
	const camera = useCamera();
	const { videoRef, status, error, photo, capturePhoto, retakePhoto } = camera;
	const [photoUrl, setPhotoUrl] = useState<string | null>(null);
	const [annotationSheetContainer, setAnnotationSheetContainer] =
		useState<HTMLElement | null>(null);
	const [qualityAtCapture, setQualityAtCapture] = useState<LiveQuality | null>(
		null,
	);
	const isLive = status === "live";
	const isCaptured = status === "captured" && photo !== null;
	const liveQuality = useLiveImageQuality(videoRef, isLive);
	const liveBorderClass = getLiveBorderClass(liveQuality);
	const handleCapture = () => {
		setQualityAtCapture(liveQuality);
		void capturePhoto();
	};
	const handleRetake = () => {
		setQualityAtCapture(null);
		void retakePhoto();
	};

	useEffect(() => {
		if (!photo) return;

		const url = URL.createObjectURL(photo.blob);
		setPhotoUrl(url);

		return () => URL.revokeObjectURL(url);
	}, [photo]);

	useEffect(() => {
		if (error) toast.error(error.message);
	}, [error]);

	return (
		<div
			className={`grid h-dvh grid-rows-[auto_minmax(0,1fr)] bg-primary-light ${isCaptured ? "gap-2 p-3 sm:p-4" : "gap-4 p-4 sm:gap-5 sm:p-6"}`}
		>
			<header
				className={`mx-auto flex w-full items-center justify-between ${isCaptured ? "max-w-7xl" : isLive ? "max-w-none" : "max-w-5xl"}`}
			>
				<div className="inline-flex items-center gap-2.5">
					<Link
						to="/"
						aria-label="Back to Annotarama"
						className="grid size-12 place-items-center rounded-xl"
					>
						<img src={APP_FAVICON_URL} alt="" width="36" height="36" />
					</Link>
					<h1 className="m-0 text-medium font-semibold tracking-[-0.03em] text-secondary">
						{isCaptured ? "Annotate" : isLive ? "Capture" : "Get Ready"}
					</h1>
				</div>
			</header>

			<main
				className={`mx-auto grid min-h-0 w-full min-w-0 ${isCaptured ? "max-w-7xl" : isLive ? "max-w-none" : "max-w-5xl"}`}
			>
				<CaptureWorkspace
					camera={camera}
					isLive={isLive}
					isCaptured={isCaptured}
					liveQuality={liveQuality}
					qualityAtCapture={qualityAtCapture}
					liveBorderClass={liveBorderClass}
					photoUrl={photoUrl}
					annotationSheetContainer={annotationSheetContainer}
					setAnnotationSheetContainer={setAnnotationSheetContainer}
					onCapture={handleCapture}
					onRetake={handleRetake}
				/>
			</main>
		</div>
	);
};

export { CameraCapture };
