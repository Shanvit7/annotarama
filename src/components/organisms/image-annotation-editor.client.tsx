import {
	Annotorious,
	ImageAnnotationPopup,
	ImageAnnotator,
	useAnnotations,
	useAnnotator,
	useSelection,
} from "@annotorious/react";
import "@annotorious/react/annotorious-react.css";
import type {
	Annotator,
	ImageAnnotation,
	PopupProps,
} from "@annotorious/react";
import {
	ArrowUp,
	Minus,
	Plus,
	ScanSearch,
	SquareDashedMousePointer,
	Trash2,
	X,
} from "lucide-react";
import {
	type ReactNode,
	useEffect,
	useLayoutEffect,
	useRef,
	useState,
} from "react";
import { createPortal } from "react-dom";
import { AnnotationDeleteConfirmation } from "@/components/molecules/annotation-delete-confirmation";
import { logger } from "@/lib/logger";
import type { PhotoDraftStatus } from "@/lib/photo-drafts";
import { savePhotoAnnotations } from "@/lib/photo-drafts";

const AnnotationLabelForm = ({
	annotation,
	onCreateBody,
	onUpdateBody,
}: PopupProps) => {
	const annotator = useAnnotator();
	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const body = annotation.bodies.find((item) => item.purpose === "commenting");
	const [value, setValue] = useState(body?.value ?? "");
	const [showError, setShowError] = useState(false);
	const errorId = `label-error-${annotation.id}`;
	const close = () => {
		annotator?.setSelected();
		document
			.querySelector<HTMLButtonElement>(
				`[data-annotation-id="${CSS.escape(annotation.id)}"]`,
			)
			?.focus({ preventScroll: true });
	};
	const deleteAnnotation = async () => {
		if (body?.value?.trim()) {
			const confirmed = await AnnotationDeleteConfirmation.call({});
			if (!confirmed) return;
		}

		const current = document.querySelector<HTMLButtonElement>(
			`[data-annotation-id="${CSS.escape(annotation.id)}"]`,
		);
		const row = current?.closest("li");
		const target =
			row?.nextElementSibling?.querySelector<HTMLButtonElement>(
				"[data-annotation-id]",
			) ??
			row?.previousElementSibling?.querySelector<HTMLButtonElement>(
				"[data-annotation-id]",
			) ??
			document.querySelector<HTMLHeadingElement>("[data-annotations-heading]");

		annotator?.removeAnnotation(annotation.id);
		annotator?.setSelected();
		window.setTimeout(() => target?.focus({ preventScroll: true }), 0);
	};

	useEffect(() => {
		textareaRef.current?.focus({ preventScroll: true });
	}, []);

	return (
		<form
			aria-label="Edit annotation label"
			className="relative w-80 max-w-[calc(100vw-1rem)] overflow-hidden rounded-xl bg-surface text-left text-secondary shadow-lg shadow-secondary/20 ring-1 ring-border/60"
			onSubmit={(event) => {
				event.preventDefault();
				const label = value.trim();
				if (!label) {
					setShowError(true);
					textareaRef.current?.focus();
					return;
				}
				if (body) onUpdateBody(body, { ...body, value: label });
				else onCreateBody({ purpose: "commenting", value: label });
				close();
			}}
		>
			<button
				type="button"
				onClick={close}
				aria-label="Close label editor"
				title="Close"
				className="absolute right-1 top-1 z-10 grid size-11 cursor-pointer place-items-center rounded-full text-neutral-dark transition-colors hover:bg-primary-light hover:text-secondary focus-visible:outline-2 focus-visible:outline-accent [@media(pointer:fine)]:size-9"
			>
				<X aria-hidden="true" className="size-4" />
			</button>
			<label className="sr-only" htmlFor={`label-${annotation.id}`}>
				Annotation label
			</label>
			<textarea
				ref={textareaRef}
				id={`label-${annotation.id}`}
				name="label"
				rows={3}
				value={value}
				placeholder="Add a label…"
				aria-required="true"
				aria-invalid={showError}
				aria-describedby={showError ? errorId : undefined}
				onChange={(event) => {
					const nextValue = event.currentTarget.value;
					setValue(nextValue);
					if (body) onUpdateBody(body, { ...body, value: nextValue });
					else if (nextValue) {
						onCreateBody({ purpose: "commenting", value: nextValue });
					}
					if (nextValue.trim()) setShowError(false);
				}}
				onKeyDown={(event) => {
					if (event.key === "Escape") {
						event.stopPropagation();
						close();
					}
				}}
				className="block w-full resize-none border-0 bg-transparent px-4 pb-3 pr-12 pt-3 text-base leading-6 text-ink caret-primary placeholder:text-neutral-dark focus-visible:outline-none focus-visible:ring-0 [@media(pointer:fine)]:text-sm"
			/>
			{showError && (
				<p
					id={errorId}
					role="alert"
					className="m-0 px-2 py-1 text-tiny text-error"
				>
					Enter a label before saving.
				</p>
			)}
			<div className="flex items-center justify-between border-t border-border/60 px-2 py-1.5">
				<button
					type="button"
					onClick={deleteAnnotation}
					aria-label={`Delete annotation${body?.value ? `: ${body.value}` : ""}`}
					title="Delete annotation"
					className="grid size-11 cursor-pointer place-items-center rounded-full text-error transition-colors hover:bg-error-light focus-visible:outline-2 focus-visible:outline-accent [@media(pointer:fine)]:size-9"
				>
					<Trash2 aria-hidden="true" className="size-4" />
				</button>
				<button
					type="submit"
					aria-label="Save label"
					title="Save label"
					className="grid size-11 cursor-pointer place-items-center rounded-full bg-primary text-surface shadow-sm transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent [@media(pointer:fine)]:size-9"
				>
					<ArrowUp aria-hidden="true" className="size-4" />
				</button>
			</div>
		</form>
	);
};

const AnnotationList = ({ draftStatus }: { draftStatus: PhotoDraftStatus }) => {
	const annotator = useAnnotator();
	const annotations = useAnnotations();
	const { selected } = useSelection();
	const selectedId = selected[0]?.annotation.id;

	return (
		<section
			aria-label="Annotations"
			className="flex min-h-48 flex-col overflow-hidden bg-surface text-left md:min-h-0 md:flex-1 [@media(max-height:34rem)_and_(min-width:40rem)]:min-h-48 [@media(max-height:34rem)_and_(min-width:40rem)]:flex-none"
		>
			<div className="flex h-12 shrink-0 items-center gap-2.5 px-4">
				<ScanSearch aria-hidden="true" className="size-4 text-primary" />
				<h2
					data-annotations-heading
					tabIndex={-1}
					className="m-0 flex-1 text-sm font-semibold text-secondary focus-visible:outline-2 focus-visible:outline-accent"
				>
					Annotations
				</h2>
				<output
					aria-label={`${annotations.length} ${annotations.length === 1 ? "annotation" : "annotations"}`}
					className="rounded bg-primary-light px-2 py-0.5 text-xs font-semibold tabular-nums text-primary"
				>
					{annotations.length}
				</output>
			</div>
			<p
				aria-live="polite"
				className={`m-0 px-4 pb-3 text-tiny ${draftStatus === "error" ? "text-error" : "text-neutral-dark"}`}
			>
				{draftStatus === "saving"
					? "Saving changes…"
					: draftStatus === "error"
						? "Changes could not be saved on this tab."
						: "Changes saved on this tab."}
			</p>
			{annotations.length === 0 ? (
				<div className="flex flex-col items-center gap-2 px-6 py-6 text-center">
					<SquareDashedMousePointer
						aria-hidden="true"
						className="size-6 text-neutral-dark"
					/>
					<p className="m-0 text-sm font-medium text-secondary">
						No annotations yet
					</p>
					<p className="m-0 max-w-52 text-xs leading-5 text-neutral-dark">
						Drag on the photo to draw a box, then add a label.
					</p>
				</div>
			) : (
				<ul className="m-0 max-h-72 min-h-0 flex-1 list-none overflow-y-auto overscroll-contain px-2 pb-2 md:max-h-none [@media(max-height:34rem)_and_(min-width:40rem)]:max-h-48">
					{annotations.map((annotation, index) => {
						const label = annotation.bodies
							.find((body) => body.purpose === "commenting")
							?.value?.trim();

						return (
							<li
								key={annotation.id}
								className={`group flex min-w-0 items-center rounded-lg px-1.5 py-1 ${selectedId === annotation.id ? "bg-primary-light" : "hover:bg-surface-muted"}`}
							>
								<button
									type="button"
									onClick={() => annotator?.setSelected(annotation.id)}
									aria-label={`Edit label for annotation ${index + 1}${label ? `: ${label}` : ""}`}
									data-annotation-id={annotation.id}
									aria-pressed={selectedId === annotation.id}
									title={label || "Add a label"}
									className="flex min-h-11 min-w-0 flex-1 cursor-pointer items-center gap-2 rounded-md px-2 text-left text-sm text-secondary focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-accent [@media(pointer:fine)]:min-h-9"
								>
									<span className="grid size-5 shrink-0 place-items-center rounded bg-primary-light text-tiny font-medium tabular-nums text-primary">
										{index + 1}
									</span>
									<span
										className={`truncate ${label ? "font-medium" : "text-neutral-dark"}`}
									>
										{label || "Add a label…"}
									</span>
								</button>
								<button
									type="button"
									onClick={async () => {
										if (label) {
											const confirmed = await AnnotationDeleteConfirmation.call(
												{},
											);
											if (!confirmed) return;
										}

										const row = document
											.querySelector<HTMLButtonElement>(
												`[data-annotation-id="${CSS.escape(annotation.id)}"]`,
											)
											?.closest("li");
										const target =
											row?.nextElementSibling?.querySelector<HTMLButtonElement>(
												"[data-annotation-id]",
											) ??
											row?.previousElementSibling?.querySelector<HTMLButtonElement>(
												"[data-annotation-id]",
											) ??
											document.querySelector<HTMLHeadingElement>(
												"[data-annotations-heading]",
											);

										annotator?.removeAnnotation(annotation.id);
										requestAnimationFrame(() =>
											target?.focus({ preventScroll: true }),
										);
									}}
									aria-label={`Delete annotation ${index + 1}${label ? `: ${label}` : ""}`}
									className="grid size-11 shrink-0 cursor-pointer place-items-center rounded-md text-neutral-dark transition-colors hover:bg-error-light hover:text-error focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-accent [@media(pointer:fine)]:size-9"
								>
									<Trash2 aria-hidden="true" className="size-3.5" />
								</button>
							</li>
						);
					})}
				</ul>
			)}
		</section>
	);
};

type ImageAnnotationEditorProps = {
	imageUrl: string;
	imageWidth: number;
	imageHeight: number;
	draftId: string | null;
	initialAnnotations: ImageAnnotation[];
	draftStatus: PhotoDraftStatus;
	setDraftStatus: (status: PhotoDraftStatus) => void;
	photoDetails: ReactNode;
};

type AnnotationNumberMarkersProps = Pick<
	ImageAnnotationEditorProps,
	"imageWidth" | "imageHeight"
>;

const AnnotationNumberMarkers = ({
	imageWidth,
	imageHeight,
}: AnnotationNumberMarkersProps) => {
	const annotations = useAnnotations();

	return (
		<div aria-hidden="true" className="pointer-events-none absolute inset-0">
			{annotations.map((annotation, index) => {
				const { minX, minY } = annotation.target.selector.geometry.bounds;

				return (
					<span
						key={annotation.id}
						data-annotation-number={index + 1}
						style={{
							left: `${(minX / imageWidth) * 100}%`,
							top: `${(minY / imageHeight) * 100}%`,
						}}
						className="absolute grid size-6 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-primary text-tiny font-semibold tabular-nums text-surface shadow-sm ring-1 ring-surface"
					>
						{index + 1}
					</span>
				);
			})}
		</div>
	);
};

const AnnotationDraftSync = ({
	draftId,
	initialAnnotations,
	setDraftStatus,
}: {
	draftId: string;
	initialAnnotations: ImageAnnotation[];
	setDraftStatus: (status: PhotoDraftStatus) => void;
}) => {
	const annotator = useAnnotator<Annotator<ImageAnnotation, ImageAnnotation>>();
	const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		if (!annotator) return;
		annotator.setAnnotations(initialAnnotations, true);

		const save = () => {
			if (timer.current) clearTimeout(timer.current);
			timer.current = null;
			void savePhotoAnnotations(draftId, annotator.getAnnotations())
				.then(() => setDraftStatus("saved"))
				.catch((error: unknown) => {
					logger.error("Could not save photo annotations", error);
					setDraftStatus("error");
				});
		};
		const scheduleSave = () => {
			if (timer.current) clearTimeout(timer.current);
			setDraftStatus("saving");
			timer.current = setTimeout(save, 250);
		};

		annotator.on("createAnnotation", scheduleSave);
		annotator.on("updateAnnotation", scheduleSave);
		annotator.on("deleteAnnotation", scheduleSave);
		window.addEventListener("pagehide", save);

		return () => {
			if (timer.current) clearTimeout(timer.current);
			annotator.off("createAnnotation", scheduleSave);
			annotator.off("updateAnnotation", scheduleSave);
			annotator.off("deleteAnnotation", scheduleSave);
			window.removeEventListener("pagehide", save);
		};
	}, [annotator, draftId, initialAnnotations, setDraftStatus]);

	return null;
};

const ImageAnnotationEditor = ({
	imageUrl,
	imageWidth,
	imageHeight,
	draftId,
	initialAnnotations,
	draftStatus,
	setDraftStatus,
	photoDetails,
}: ImageAnnotationEditorProps) => {
	const [zoom, setZoom] = useState(1);
	const [fitWidth, setFitWidth] = useState<number | null>(null);
	const photoScrollerRef = useRef<HTMLDivElement>(null);

	useLayoutEffect(() => {
		const frame = photoScrollerRef.current?.parentElement;
		if (!frame) return;

		const observer = new ResizeObserver(([entry]) => {
			setFitWidth(
				Math.min(
					entry.contentRect.width,
					(entry.contentRect.height * imageWidth) / imageHeight,
				),
			);
		});
		observer.observe(frame);
		return () => observer.disconnect();
	}, [imageWidth, imageHeight]);

	useLayoutEffect(() => {
		const scroller = photoScrollerRef.current;
		const photo = scroller?.firstElementChild;
		if (!scroller || !photo || fitWidth === null) return;
		const bounds = photo.getBoundingClientRect();
		const scaledWidth = fitWidth * zoom;
		const scaledHeight = (scaledWidth * imageHeight) / imageWidth;
		scroller.scrollLeft =
			scaledWidth > scroller.clientWidth
				? (bounds.width - scroller.clientWidth) / 2
				: 0;
		scroller.scrollTop =
			scaledHeight > scroller.clientHeight
				? (bounds.height - scroller.clientHeight) / 2
				: 0;
	}, [fitWidth, imageHeight, imageWidth, zoom]);

	const photoWidth =
		fitWidth === null
			? `min(100cqw, ${(imageWidth / imageHeight) * 100}cqh)`
			: fitWidth * zoom;

	return (
		<Annotorious>
			<div className="grid min-h-0 min-w-0 flex-1 grid-rows-[max(17rem,40dvh)_auto] overflow-y-auto md:grid-cols-[minmax(0,1fr)_20rem] md:grid-rows-[minmax(0,1fr)] md:overflow-hidden [@media(max-height:34rem)_and_(min-width:40rem)]:grid-cols-[minmax(0,1fr)_17rem] [@media(max-height:34rem)_and_(min-width:40rem)]:grid-rows-[minmax(0,1fr)] [@media(max-height:34rem)_and_(min-width:40rem)]:overflow-hidden">
				<section
					aria-label="Photo canvas"
					className="grid min-h-0 min-w-0 grid-rows-[auto_minmax(0,1fr)_auto] bg-surface-muted"
				>
					<div className="flex min-h-11 items-center justify-between gap-3 border-b border-border/60 bg-surface px-3 sm:px-4">
						<span className="inline-flex items-center gap-2 rounded-md bg-primary-light px-2.5 py-1.5 text-xs font-medium text-primary">
							<SquareDashedMousePointer aria-hidden="true" className="size-4" />
							Rectangle
						</span>
						<p className="m-0 text-xs text-neutral-dark">
							Drag to mark an area
						</p>
					</div>
					<div className="min-h-0 min-w-0 p-3 sm:p-6 [@media(max-height:34rem)_and_(min-width:40rem)]:p-3">
						<div
							ref={photoScrollerRef}
							className={`flex size-full min-h-0 min-w-0 ${zoom > 1 ? "overflow-auto" : "overflow-hidden"} [container-type:size]`}
						>
							<div
								className="relative m-auto shrink-0 shadow-sm"
								style={{
									width: photoWidth,
									aspectRatio: `${imageWidth} / ${imageHeight}`,
								}}
							>
								<ImageAnnotator
									containerClassName="relative size-full [&_.a9s-inner]:fill-primary/5! [&_.a9s-inner]:stroke-primary! [&_.a9s-outer]:hidden! [&_.a9s-inner]:[stroke-width:1px]! [&_.a9s-handle-dot]:stroke-primary!"
									drawingMode="drag"
									tool="rectangle"
								>
									<img
										src={imageUrl}
										width={imageWidth}
										height={imageHeight}
										alt="Captured scene. Draw boxes to mark areas needing attention."
										className="block size-full"
									/>
								</ImageAnnotator>
								<AnnotationNumberMarkers
									imageWidth={imageWidth}
									imageHeight={imageHeight}
								/>
							</div>
						</div>
					</div>
					<div className="flex min-h-11 items-center justify-between gap-2 border-t border-border/60 bg-surface px-3 text-xs tabular-nums text-neutral-dark sm:px-4">
						<span className="shrink-0">
							{imageWidth} × {imageHeight}
						</span>
						<fieldset className="m-0 inline-flex shrink-0 items-center gap-1 border-0 p-0">
							<legend className="sr-only">Photo zoom</legend>
							<button
								type="button"
								aria-label="Zoom out"
								title="Zoom out"
								disabled={zoom <= 0.25}
								onClick={() =>
									setZoom((current) => Math.max(0.25, current - 0.25))
								}
								className="inline-flex size-10 items-center justify-center rounded-md text-neutral-dark hover:bg-surface-muted disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
							>
								<Minus aria-hidden="true" className="size-4" />
							</button>
							<button
								type="button"
								aria-label="Fit photo to view"
								title="Reset zoom to Fit; percentage is relative to Fit"
								onClick={() => setZoom(1)}
								className="min-h-10 rounded-md px-2 text-xs font-medium text-neutral-dark hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
							>
								{Math.round(zoom * 100)}%
							</button>
							<button
								type="button"
								aria-label="Zoom in"
								title="Zoom in"
								disabled={zoom >= 4}
								onClick={() =>
									setZoom((current) => Math.min(4, current + 0.25))
								}
								className="inline-flex size-10 items-center justify-center rounded-md text-neutral-dark hover:bg-surface-muted disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
							>
								<Plus aria-hidden="true" className="size-4" />
							</button>
						</fieldset>
					</div>
				</section>
				<aside
					aria-label="Photo inspector"
					className="flex min-w-0 flex-col border-t border-border/60 bg-surface text-left md:min-h-0 md:overflow-hidden md:border-l md:border-t-0 [@media(max-height:34rem)_and_(min-width:40rem)]:min-h-0 [@media(max-height:34rem)_and_(min-width:40rem)]:overflow-y-auto [@media(max-height:34rem)_and_(min-width:40rem)]:border-l [@media(max-height:34rem)_and_(min-width:40rem)]:border-t-0"
				>
					{photoDetails}
					<AnnotationList draftStatus={draftStatus} />
				</aside>
			</div>
			{draftId && (
				<AnnotationDraftSync
					draftId={draftId}
					initialAnnotations={initialAnnotations}
					setDraftStatus={setDraftStatus}
				/>
			)}
			{typeof document !== "undefined" &&
				createPortal(
					<ImageAnnotationPopup
						popup={(props) => (
							<AnnotationLabelForm key={props.annotation.id} {...props} />
						)}
					/>,
					document.body,
				)}
		</Annotorious>
	);
};

export default ImageAnnotationEditor;
