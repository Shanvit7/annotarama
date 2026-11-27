import type { ImageAnnotation } from "@annotorious/react";
import { AsciiFlowBackdrop } from "@/components/atoms/ascii-flow-backdrop";
import { CameraPreviewControls } from "@/components/molecules/camera-preview-controls";
import { PhotoRestorePlaceholder } from "@/components/organisms/camera-capture/photo-restore-placeholder";
import {
	CameraLiveQuality,
	CapturedPhotoSummary,
} from "@/components/organisms/camera-live-quality";
import { ImageAnnotationEditor } from "@/components/organisms/image-annotation-editor";
import type { useCamera } from "@/hooks/use-camera";
import type { LiveQuality } from "@/lib/image-quality";

const formatFileSize = (bytes: number) => {
	if (bytes < 1_000) return `${bytes} B`;
	const isMegabytes = bytes >= 1_000_000;
	const unitSize = isMegabytes ? 1_000_000 : 1_000;
	const unit = isMegabytes ? "MB" : "KB";
	return `${(bytes / unitSize).toFixed(1)} ${unit}`;
};

type CaptureWorkspaceProps = {
	camera: ReturnType<typeof useCamera>;
	isLive: boolean;
	isCaptured: boolean;
	isReviewingPhoto: boolean;
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
	onContinueToAnnotate: () => void;
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
			Looks <span className="text-success-light/80">good</span> — take the photo
			now.
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
	isReviewingPhoto,
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
	| "isReviewingPhoto"
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
		const summary = (
			<CapturedPhotoSummary
				quality={qualityAtCapture ?? liveQuality}
				onRetake={isReviewingPhoto ? undefined : onRetake}
				variant={isReviewingPhoto ? "overlay" : "panel"}
				width={photo.width}
				height={photo.height}
				fileSize={formatFileSize(photo.blob.size)}
				bytes={photo.blob.size}
			/>
		);
		if (isReviewingPhoto) {
			return (
				<>
					<img
						src={photoUrl}
						width={photo.width}
						height={photo.height}
						alt="Captured scene"
						className="absolute inset-0 size-full object-cover"
					/>
					{summary}
				</>
			);
		}
		return (
			<ImageAnnotationEditor
				imageUrl={photoUrl}
				imageWidth={photo.width}
				imageHeight={photo.height}
				draftId={draftId}
				initialAnnotations={initialAnnotations}
				draftStatus={draftStatus}
				setDraftStatus={setDraftStatus}
				photoDetails={summary}
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
	`relative overflow-hidden text-center ${isLive ? `h-full w-full max-w-full flex-1 border-2 ${liveBorderClass} min-h-40 xl:aspect-video xl:w-auto xl:flex-none xl:rounded-2xl` : "flex min-h-0 flex-1 flex-col"} ${isCaptured ? "bg-surface" : isLive ? "bg-transparent text-surface" : "bg-secondary text-surface xl:rounded-2xl"}`;

const CameraFocusGuide = ({ isLive }: { isLive: boolean }) =>
	isLive && (
		<div
			role="img"
			aria-label="Center framing guide. Does not control camera focus."
			data-camera-focus-guide
			className="pointer-events-none absolute left-1/2 top-1/2 z-[1] aspect-square w-[min(55vw,18rem)] -translate-x-1/2 -translate-y-1/2 rounded-sm border border-surface/70 shadow-sm ring-1 ring-secondary/35"
		/>
	);

const CapturePreviewFrame = ({
	camera,
	isLive,
	isCaptured,
	isReviewingPhoto,
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
	onContinueToAnnotate,
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
			<CameraFocusGuide isLive={isLive} />
			<LiveQualityOverlay
				isLive={isLive}
				quality={liveQuality}
				torchSupported={camera.torchSupported}
				torchEnabled={camera.torchEnabled}
			/>
			<IdleCameraBackdrop isLive={isLive} isCaptured={isCaptured} />
			<CapturedPhotoPreview
				isCaptured={isCaptured}
				isReviewingPhoto={isReviewingPhoto}
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
				isReviewingPhoto={isReviewingPhoto}
				canSwitchCamera={camera.canSwitchCamera}
				torchSupported={camera.torchSupported}
				torchEnabled={camera.torchEnabled}
				onStart={() => void camera.startCamera()}
				onCapture={onCapture}
				onSwitchCamera={() => void camera.switchCamera()}
				onStop={camera.stopCamera}
				onTorch={() => void camera.setTorch(!camera.torchEnabled)}
				onRetake={onRetake}
				onContinueToAnnotate={onContinueToAnnotate}
			/>
		</div>
	);
};

const CaptureWorkspace = (props: CaptureWorkspaceProps) => {
	const { isLive, isCaptured, isReviewingPhoto } = props;

	return (
		<section
			aria-label={
				isReviewingPhoto
					? "Review photo"
					: isCaptured
						? "Annotate photo"
						: "Capture an image"
			}
			className={`relative grid min-h-0 min-w-0 grid-rows-[minmax(0,1fr)] overflow-hidden ${isCaptured ? "bg-surface" : isLive ? "bg-transparent xl:rounded-2xl" : "bg-secondary xl:rounded-2xl"}`}
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

export const CaptureMain = ({
	isRestoring,
	...workspace
}: CaptureMainProps) => (
	<main
		className={`mx-auto grid min-h-0 w-full min-w-0 ${workspace.isCaptured || workspace.isLive || isRestoring ? "max-w-none" : "max-w-none xl:max-w-5xl"}`}
	>
		{isRestoring ? (
			<PhotoRestorePlaceholder />
		) : (
			<CaptureWorkspace {...workspace} />
		)}
	</main>
);
