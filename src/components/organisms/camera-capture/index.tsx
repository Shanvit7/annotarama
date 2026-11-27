import type { ImageAnnotation } from "@annotorious/react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "@yusufceng1z/ding-react";
import { useEffect, useState } from "react";
import { CaptureMain } from "@/components/organisms/camera-capture/capture-workspace";
import { useCamera } from "@/hooks/use-camera";
import { useLiveImageQuality } from "@/hooks/use-live-image-quality";
import { TOAST_DURATION_MS } from "@/lib/constants";
import type { LiveQuality } from "@/lib/image-quality";
import { logger } from "@/lib/logger";
import {
	deletePhotoDraft,
	getOrCreatePhotoSessionId,
	loadPhotoDraft,
	savePhotoDraft,
	setPhotoDraftStage,
} from "@/lib/photo-drafts";

const getLiveBorderClass = (quality: LiveQuality) => {
	if (quality.unavailable || quality.overall === "unknown") {
		return "border-surface/50";
	}
	if (quality.overall === "good") return "border-success";
	if (quality.overall === "warning") return "border-amber-400";
	return "border-error";
};

export const CameraCapture = () => {
	const camera = useCamera();
	const navigate = useNavigate();
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
	const isReviewingPhoto = isCaptured;
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
			toast.error("This photo could not be saved for this tab.", {
				duration: TOAST_DURATION_MS,
			});
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
	const handleContinueToAnnotate = async () => {
		if (draftId) {
			try {
				await setPhotoDraftStage(draftId, "annotating");
			} catch (stageError) {
				logger.warn("Could not save photo review progress", stageError);
			}
		}
		await navigate({ to: "/annotate" });
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
		if (error) toast.error(error.message, { duration: TOAST_DURATION_MS });
	}, [error]);

	return (
		<div
			className={`grid h-dvh grid-rows-[minmax(0,1fr)] ${isCaptured || isRestoring ? "bg-surface" : "bg-primary-light xl:gap-5 xl:p-6"}`}
		>
			<CaptureMain
				isRestoring={isRestoring}
				camera={camera}
				isLive={isLive}
				isCaptured={isCaptured}
				isReviewingPhoto={isReviewingPhoto}
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
				onContinueToAnnotate={handleContinueToAnnotate}
			/>
		</div>
	);
};
