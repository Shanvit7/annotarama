import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "@yusufceng1z/ding-react";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { PhotoRestorePlaceholder } from "@/components/organisms/camera-capture/photo-restore-placeholder";
import { CapturedPhotoSummary } from "@/components/organisms/camera-live-quality";
import { ImageAnnotationEditor } from "@/components/organisms/image-annotation-editor";
import { TOAST_DURATION_MS } from "@/lib/constants";
import { logger } from "@/lib/logger";
import type { PhotoDraftStatus } from "@/lib/photo-drafts";
import {
	deletePhotoDraft,
	getOrCreatePhotoSessionId,
	loadPhotoDraft,
} from "@/lib/photo-drafts";

const formatFileSize = (bytes: number) => {
	if (bytes < 1_000) return `${bytes} B`;
	const isMegabytes = bytes >= 1_000_000;
	const unitSize = isMegabytes ? 1_000_000 : 1_000;
	const unit = isMegabytes ? "MB" : "KB";
	return `${(bytes / unitSize).toFixed(1)} ${unit}`;
};

const AnnotatePage = () => {
	const navigate = useNavigate();
	const [draftId, setDraftId] = useState<string | null>(null);
	const [draft, setDraft] = useState<Awaited<
		ReturnType<typeof loadPhotoDraft>
	> | null>();
	const [photoUrl, setPhotoUrl] = useState<string | null>(null);
	const [draftStatus, setDraftStatus] = useState<PhotoDraftStatus>("saved");
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		let ignore = false;
		const id = getOrCreatePhotoSessionId();
		setDraftId(id);
		if (!id) {
			setIsLoading(false);
			setDraftStatus("error");
			return () => {
				ignore = true;
			};
		}

		void loadPhotoDraft(id).then(
			(loadedDraft) => {
				if (ignore) return;
				setDraft(loadedDraft ?? null);
				setIsLoading(false);
			},
			(error: unknown) => {
				if (ignore) return;
				logger.error("Could not load this tab's photo for annotation", error);
				setDraftStatus("error");
				setIsLoading(false);
			},
		);

		return () => {
			ignore = true;
		};
	}, []);

	useEffect(() => {
		if (!draft) return;
		const url = URL.createObjectURL(draft.blob);
		setPhotoUrl(url);
		return () => URL.revokeObjectURL(url);
	}, [draft]);

	const handleBackToCapture = async () => {
		try {
			if (draftId) await deletePhotoDraft(draftId);
			await navigate({ to: "/capture" });
		} catch (error) {
			logger.error("Could not discard this tab's photo data", error);
			toast.error("Could not discard this photo. Try again.", {
				duration: TOAST_DURATION_MS,
			});
		}
	};

	const photoDetails = draft ? (
		<CapturedPhotoSummary
			quality={draft.qualityAtCapture}
			width={draft.width}
			height={draft.height}
			fileSize={formatFileSize(draft.blob.size)}
			bytes={draft.blob.size}
		/>
	) : null;

	return (
		<div className="flex h-dvh min-h-0 flex-col bg-surface">
			<header className="flex h-14 shrink-0 items-center border-b border-border/60 px-4">
				<button
					type="button"
					onClick={() => void handleBackToCapture()}
					disabled={isLoading}
					aria-label="Back to capture; discard photo and annotations"
					title="Discard this photo and its annotations"
					className="group inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-full border border-border/60 bg-surface px-3 text-sm font-medium tracking-tight text-secondary transition-colors hover:border-primary/20 hover:bg-primary-light hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-wait disabled:opacity-60"
				>
					<ArrowLeft
						aria-hidden="true"
						className="size-4 transition-transform group-hover:-translate-x-0.5"
					/>
					Back to capture
				</button>
				<h1 className="sr-only">Photo annotations</h1>
			</header>
			<main className="flex min-h-0 flex-1 flex-col">
				{isLoading ? (
					<PhotoRestorePlaceholder />
				) : draft && photoUrl ? (
					<ImageAnnotationEditor
						imageUrl={photoUrl}
						imageWidth={draft.width}
						imageHeight={draft.height}
						draftId={draftId}
						initialAnnotations={draft.annotations}
						draftStatus={draftStatus}
						setDraftStatus={setDraftStatus}
						photoDetails={photoDetails}
					/>
				) : (
					<section className="m-auto max-w-md p-6 text-center">
						<h2 className="text-lg font-semibold text-secondary">
							{draftStatus === "error"
								? "Photo could not be loaded"
								: "No photo to annotate yet"}
						</h2>
						<p className="mt-2 text-sm text-neutral-dark">
							Capture a photo first. It will be ready here to annotate.
						</p>
						<Link
							to="/capture"
							className="mt-5 inline-flex min-h-12 items-center justify-center rounded-full bg-primary px-5 font-semibold text-surface hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
						>
							Capture a photo
						</Link>
					</section>
				)}
			</main>
		</div>
	);
};

export const Route = createFileRoute("/annotate")({ component: AnnotatePage });
