import type { ImageAnnotation } from "@annotorious/react";
import { Link } from "@tanstack/react-router";
import { toast } from "@yusufceng1z/ding-react";
import { useEffect, useState } from "react";
import { AsciiFlowBackdrop } from "@/components/atoms/ascii-flow-backdrop";
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
import { logger } from "@/lib/logger";
import {
	deletePhotoDraft,
	getOrCreatePhotoSessionId,
	loadPhotoDraft,
	savePhotoDraft,
} from "@/lib/photo-drafts";

const formatFileSize = (bytes: number) => {
	const isMegabytes = bytes >= 1_000_000;
	const unitSize = isMegabytes ? 1_000_000 : 1_000;
	const unit = isMegabytes ? "MB" : "KB";
	return `${(bytes / unitSize).toFixed(isMegabytes ? 1 : 0)} ${unit}`;
};

type CaptureWorkspaceProps = {
	camera: ReturnType<typeof useCamera>;
	isLive: boolean;
	isCaptured: boolean;
	liveQuality: LiveQuality;
	qualityAtCapture: LiveQuality | null;
	liveBorderClass: string;
	photoUrl: string | null;
	draftId: string | null;
	initialAnnotations: ImageAnnotation[];
	isPhotoSaving: boolean;
	draftStatus: "saving" | "saved" | "error";
	setDraftStatus: (status: "saving" | "saved" | "error") => void;
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
	draftId,
	initialAnnotations,
	isPhotoSaving,
	draftStatus,
	setDraftStatus,
	qualityAtCapture,
	liveQuality,
	onRetake,
}: Pick<
	CaptureWorkspaceProps,
	| "isCaptured"
	| "photoUrl"
	| "draftId"
	| "initialAnnotations"
	| "isPhotoSaving"
	| "draftStatus"
	| "setDraftStatus"
	| "qualityAtCapture"
	| "liveQuality"
	| "onRetake"
> & {
	photo: ReturnType<typeof useCamera>["photo"];
}) => {
	if (!isCaptured) return null;
	if (isPhotoSaving) {
		return (
			<p className="absolute inset-0 z-10 m-0 grid place-content-center p-4 text-regular leading-relaxed text-white/90">
				Saving photo for this tab…
			</p>
		);
	}
	if (photoUrl && photo) {
		return (
			<ImageAnnotationEditor
				imageUrl={photoUrl}
				imageWidth={photo.width}
				imageHeight={photo.height}
				draftId={draftId}
				initialAnnotations={initialAnnotations}
				draftStatus={draftStatus}
				setDraftStatus={setDraftStatus}
				photoDetails={
					<CapturedPhotoSummary
						quality={qualityAtCapture ?? liveQuality}
						onRetake={onRetake}
						width={photo.width}
						height={photo.height}
						fileSize={formatFileSize(photo.blob.size)}
					/>
				}
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
	`relative overflow-hidden text-center ${isLive ? `h-full w-auto max-w-full aspect-video flex-none rounded-2xl border-2 ${liveBorderClass} min-h-40` : "flex min-h-0 flex-1 flex-col"} ${isCaptured ? "bg-surface" : isLive ? "bg-transparent text-surface" : "rounded-2xl bg-secondary text-surface"}`;

const CapturePreviewFrame = ({
	camera,
	isLive,
	isCaptured,
	liveQuality,
	liveBorderClass,
	photoUrl,
	draftId,
	initialAnnotations,
	isPhotoSaving,
	draftStatus,
	setDraftStatus,
	qualityAtCapture,
	onRetake,
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
				draftId={draftId}
				initialAnnotations={initialAnnotations}
				isPhotoSaving={isPhotoSaving}
				draftStatus={draftStatus}
				setDraftStatus={setDraftStatus}
				qualityAtCapture={qualityAtCapture}
				liveQuality={liveQuality}
				onRetake={onRetake}
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
	const { isLive, isCaptured } = props;

	return (
		<section
			aria-label={isCaptured ? "Annotate photo" : "Capture an image"}
			className={`relative grid min-h-0 min-w-0 grid-rows-[minmax(0,1fr)] overflow-hidden ${isCaptured ? "bg-surface" : isLive ? "rounded-2xl bg-transparent" : "rounded-2xl bg-secondary"}`}
		>
			<div
				data-capture-workspace
				className="relative flex min-h-0 min-w-0 flex-col"
			>
				<div
					className={`flex min-h-0 min-w-0 flex-1 ${isLive ? "justify-center" : ""}`}
				>
					<CapturePreviewFrame {...props} />
				</div>
			</div>
		</section>
	);
};

type CaptureMainProps = CaptureWorkspaceProps & { isRestoring: boolean };

type CaptureHeaderProps = {
	isCaptured: boolean;
	isLive: boolean;
	isRestoring: boolean;
};

const CaptureHeader = ({
	isCaptured,
	isLive,
	isRestoring,
}: CaptureHeaderProps) => (
	<header
		className={`mx-auto flex w-full items-center justify-between ${isCaptured || isRestoring ? "h-14 border-b border-border/60 px-3 sm:px-5" : isLive ? "max-w-none" : "max-w-5xl"}`}
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
				{isRestoring
					? "Restoring photo…"
					: isCaptured
						? "Annotate"
						: isLive
							? "Capture"
							: "Get Ready"}
			</h1>
		</div>
	</header>
);

const PhotoRestorePlaceholder = () => (
	<output
		aria-label="Restoring your photo"
		className="grid min-h-0 flex-1 grid-rows-[max(17rem,40dvh)_auto] overflow-y-auto rounded-2xl bg-surface text-secondary md:grid-cols-[minmax(0,1fr)_20rem] md:grid-rows-[minmax(0,1fr)] md:overflow-hidden [@media(max-height:34rem)_and_(min-width:40rem)]:grid-cols-[minmax(0,1fr)_17rem] [@media(max-height:34rem)_and_(min-width:40rem)]:grid-rows-[minmax(0,1fr)] [@media(max-height:34rem)_and_(min-width:40rem)]:overflow-hidden"
	>
		<section
			aria-hidden="true"
			className="grid min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] bg-surface-muted"
		>
			<div className="flex min-h-11 items-center justify-between border-b border-border/60 bg-surface px-4">
				<span className="h-6 w-24 animate-pulse rounded-md bg-primary-light motion-reduce:animate-none" />
				<span className="h-3 w-28 animate-pulse rounded bg-primary-light motion-reduce:animate-none" />
			</div>
			<div className="grid min-h-0 place-items-center p-3 sm:p-6">
				<div className="aspect-[4/3] max-h-full w-full max-w-3xl animate-pulse rounded-md bg-secondary/10 motion-reduce:animate-none" />
			</div>
			<div className="flex min-h-11 items-center justify-between border-t border-border/60 bg-surface px-4">
				<span className="h-3 w-20 animate-pulse rounded bg-primary-light motion-reduce:animate-none" />
				<span className="h-9 w-24 animate-pulse rounded-md bg-primary-light motion-reduce:animate-none" />
			</div>
		</section>
		<aside
			aria-hidden="true"
			className="flex min-h-0 flex-col border-t border-border/60 bg-surface md:border-l md:border-t-0"
		>
			<div className="space-y-3 border-b border-border/60 p-4">
				<div className="h-4 w-28 animate-pulse rounded bg-primary-light motion-reduce:animate-none" />
				<div className="h-3 w-36 animate-pulse rounded bg-primary-light motion-reduce:animate-none" />
				<div className="h-3 w-24 animate-pulse rounded bg-primary-light motion-reduce:animate-none" />
			</div>
			<div className="flex-1 space-y-4 p-4">
				<div className="flex items-center justify-between">
					<div className="h-4 w-24 animate-pulse rounded bg-primary-light motion-reduce:animate-none" />
					<div className="size-5 animate-pulse rounded bg-primary-light motion-reduce:animate-none" />
				</div>
				<div className="h-3 w-32 animate-pulse rounded bg-primary-light motion-reduce:animate-none" />
			</div>
		</aside>
		<p className="sr-only">Restoring your photo…</p>
	</output>
);

const CaptureMain = ({ isRestoring, ...workspace }: CaptureMainProps) => (
	<main
		className={`mx-auto grid min-h-0 w-full min-w-0 ${workspace.isCaptured || workspace.isLive || isRestoring ? "max-w-none" : "max-w-5xl"}`}
	>
		{isRestoring ? (
			<PhotoRestorePlaceholder />
		) : (
			<CaptureWorkspace {...workspace} />
		)}
	</main>
);

const CameraCapture = () => {
	const camera = useCamera();
	const {
		videoRef,
		status,
		error,
		photo,
		capturePhoto,
		restorePhoto,
		retakePhoto,
	} = camera;
	const [draftId, setDraftId] = useState<string | null>(null);
	const [initialAnnotations, setInitialAnnotations] = useState<
		ImageAnnotation[]
	>([]);
	const [draftStatus, setDraftStatus] = useState<"saving" | "saved" | "error">(
		"saved",
	);
	const [isPhotoSaving, setIsPhotoSaving] = useState(false);
	const [isRestoring, setIsRestoring] = useState(true);
	const [photoUrl, setPhotoUrl] = useState<string | null>(null);
	const [qualityAtCapture, setQualityAtCapture] = useState<LiveQuality | null>(
		null,
	);
	const isLive = status === "live";
	const isCaptured = status === "captured" && photo !== null;
	const liveQuality = useLiveImageQuality(videoRef, isLive);
	const liveBorderClass = getLiveBorderClass(liveQuality);
	const handleCapture = async () => {
		setQualityAtCapture(liveQuality);
		setIsPhotoSaving(Boolean(draftId));
		setDraftStatus(draftId ? "saving" : "error");
		const capturedPhoto = await capturePhoto();
		if (!capturedPhoto) {
			setIsPhotoSaving(false);
			setDraftStatus("saved");
			return;
		}
		if (!draftId) return;

		try {
			await savePhotoDraft(draftId, capturedPhoto, liveQuality);
			setIsPhotoSaving(false);
			setInitialAnnotations([]);
			setDraftStatus("saved");
		} catch (saveError) {
			logger.error("Could not save captured photo for this tab", saveError);
			setIsPhotoSaving(false);
			setDraftStatus("error");
			toast.error("This photo could not be saved for this tab.");
		}
	};
	const handleRetake = async () => {
		setQualityAtCapture(null);
		setInitialAnnotations([]);
		setIsPhotoSaving(false);
		if (draftId) {
			try {
				await deletePhotoDraft(draftId);
				setDraftStatus("saved");
			} catch (deleteError) {
				logger.error("Could not clear this tab's photo data", deleteError);
				setDraftStatus("error");
			}
		}
		await retakePhoto();
	};

	useEffect(() => {
		let ignore = false;
		const id = getOrCreatePhotoSessionId();
		setDraftId(id);
		if (!id) {
			setDraftStatus("error");
			setIsRestoring(false);
			return () => {
				ignore = true;
			};
		}

		void loadPhotoDraft(id).then(
			(draft) => {
				if (ignore) return;
				if (draft) {
					setInitialAnnotations(draft.annotations);
					setQualityAtCapture(draft.qualityAtCapture);
					restorePhoto({
						blob: draft.blob,
						width: draft.width,
						height: draft.height,
					});
				}
				setDraftStatus("saved");
				setIsRestoring(false);
			},
			(restoreError: unknown) => {
				if (ignore) return;
				logger.error("Could not restore this tab's photo data", restoreError);
				setDraftStatus("error");
				setIsRestoring(false);
			},
		);

		return () => {
			ignore = true;
		};
	}, [restorePhoto]);

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
			className={`grid h-dvh grid-rows-[auto_minmax(0,1fr)] ${isCaptured || isRestoring ? "bg-surface" : "gap-4 bg-primary-light p-4 sm:gap-5 sm:p-6"}`}
		>
			<CaptureHeader
				isCaptured={isCaptured}
				isLive={isLive}
				isRestoring={isRestoring}
			/>

			<CaptureMain
				isRestoring={isRestoring}
				camera={camera}
				isLive={isLive}
				isCaptured={isCaptured}
				liveQuality={liveQuality}
				qualityAtCapture={qualityAtCapture}
				liveBorderClass={liveBorderClass}
				photoUrl={photoUrl}
				draftId={draftId}
				initialAnnotations={initialAnnotations}
				isPhotoSaving={isPhotoSaving}
				draftStatus={draftStatus}
				setDraftStatus={setDraftStatus}
				onCapture={handleCapture}
				onRetake={handleRetake}
			/>
		</div>
	);
};

export { CameraCapture };
