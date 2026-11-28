import {
	Annotorious,
	ImageAnnotationPopup,
	ImageAnnotator,
	ShapeType,
	useAnnotations,
	useAnnotator,
	useSelection,
} from "@annotorious/react";
import "@annotorious/react/annotorious-react.css";
import type {
	Annotator,
	ImageAnnotation,
	PopupProps,
	Rectangle,
	RectangleGeometry,
} from "@annotorious/react";
import {
	ArrowUp,
	ScanSearch,
	SquareDashedMousePointer,
	Trash2,
	X,
} from "lucide-react";
import {
	type ReactNode,
	type RefObject,
	useEffect,
	useLayoutEffect,
	useRef,
	useState,
} from "react";
import { createPortal } from "react-dom";
import { AnnotationDeleteConfirmation } from "@/components/molecules/annotation-delete-confirmation";
import { CollapsiblePanel } from "@/components/molecules/collapsible-panel";
import { PhotoZoomControls } from "@/components/molecules/photo-zoom-controls";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { useMediaQuery } from "@/hooks/use-media-query";
import { adjustRectangleForKey } from "@/lib/annotation-keyboard";
import { logger } from "@/lib/logger";
import type { PhotoDraftStatus } from "@/lib/photo-drafts";
import { savePhotoAnnotations } from "@/lib/photo-drafts";

const AnnotationLabelForm = ({
	annotation,
	onCreateBody,
	onUpdateBody,
}: PopupProps) => {
	const annotator = useAnnotator();
	const annotations = useAnnotations();
	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const boxNumber =
		annotations.findIndex((item) => item.id === annotation.id) + 1;
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
			className="relative w-64 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl bg-surface text-left text-secondary shadow-lg shadow-secondary/20"
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
				className="absolute right-0 top-0 z-10 grid size-11 cursor-pointer place-items-center rounded-full text-neutral-dark transition-colors hover:bg-primary-light hover:text-secondary focus-visible:outline-2 focus-visible:outline-accent [@media(pointer:fine)]:size-9"
			>
				<X aria-hidden="true" className="size-4" />
			</button>
			<div className="flex min-h-11 items-center gap-2 border-b border-border/60 px-3 pr-12 [@media(pointer:fine)]:min-h-9 [@media(pointer:fine)]:px-2 [@media(pointer:fine)]:pr-10">
				<span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary text-tiny font-semibold tabular-nums text-surface shadow-sm ring-1 ring-surface">
					{boxNumber}
				</span>
			</div>
			<label className="sr-only" htmlFor={`label-${annotation.id}`}>
				Annotation label for box {boxNumber}
			</label>
			<textarea
				ref={textareaRef}
				id={`label-${annotation.id}`}
				name="label"
				rows={4}
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
				className="block w-full resize-none border-0 bg-transparent px-3 py-1 text-base leading-6 text-ink caret-primary placeholder:text-neutral-dark focus-visible:outline-none focus-visible:ring-0 [@media(pointer:fine)]:text-sm"
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
			<div className="flex items-center justify-between border-t border-border/60 px-1 py-0">
				<Tooltip>
					<TooltipTrigger asChild>
						<button
							type="button"
							onClick={deleteAnnotation}
							aria-label={`Delete annotation${body?.value ? `: ${body.value}` : ""}`}
							className="grid size-11 cursor-pointer place-items-center rounded-full text-error transition-colors hover:bg-error-light focus-visible:outline-2 focus-visible:outline-accent [@media(pointer:fine)]:size-9"
						>
							<Trash2 aria-hidden="true" className="size-4" />
						</button>
					</TooltipTrigger>
					<TooltipContent>Delete annotation</TooltipContent>
				</Tooltip>
				<button
					type="submit"
					aria-label="Save label"
					title="Save label"
					className="group relative grid size-11 cursor-pointer place-items-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent [@media(pointer:fine)]:size-8"
				>
					<span
						aria-hidden="true"
						className="absolute size-6 rounded-full bg-primary shadow-sm transition-colors group-hover:bg-primary-hover"
					/>
					<ArrowUp
						aria-hidden="true"
						className="relative size-3 text-surface"
					/>
				</button>
			</div>
		</form>
	);
};

type AnnotationSortOrder = "newest" | "oldest";

const getOrderedAnnotations = (
	annotations: ImageAnnotation[],
	sortOrder: AnnotationSortOrder,
) => {
	const numberedAnnotations = annotations.map((annotation, index) => ({
		annotation,
		number: index + 1,
	}));
	return sortOrder === "newest"
		? numberedAnnotations.reverse()
		: numberedAnnotations;
};

const AnnotationList = ({
	draftStatus,
	sortOrder,
	setSortOrder,
	imageWidth,
	imageHeight,
	canCollapse,
	isCollapsed,
	setIsCollapsed,
}: {
	draftStatus: PhotoDraftStatus;
	sortOrder: AnnotationSortOrder;
	setSortOrder: (order: AnnotationSortOrder) => void;
	imageWidth: number;
	imageHeight: number;
	canCollapse: boolean;
	isCollapsed: boolean;
	setIsCollapsed: (isCollapsed: boolean) => void;
}) => {
	const annotator = useAnnotator();
	const annotations = useAnnotations();
	const { selected } = useSelection();
	const selectedId = selected[0]?.annotation.id;
	const orderedAnnotations = getOrderedAnnotations(annotations, sortOrder);
	const removeAnnotation = async (
		annotation: ImageAnnotation,
		label: string | undefined,
	) => {
		if (label) {
			const confirmed = await AnnotationDeleteConfirmation.call({});
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
			document.querySelector<HTMLHeadingElement>("[data-annotations-heading]");

		annotator?.removeAnnotation(annotation.id);
		requestAnimationFrame(() => target?.focus({ preventScroll: true }));
	};

	return (
		<section
			aria-label="Annotations"
			className={`order-1 flex min-h-12 flex-none flex-col overflow-hidden bg-surface text-left transition-[height] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] motion-reduce:transition-none lg:h-auto lg:flex-[1_1_0%] lg:order-2 [@media(max-height:34rem)_and_(min-width:40rem)]:order-2 [@media(max-height:34rem)_and_(min-width:40rem)]:h-auto [@media(max-height:34rem)_and_(min-width:40rem)]:min-h-48 [@media(max-height:34rem)_and_(min-width:40rem)]:flex-none ${isCollapsed ? "h-12" : "h-[min(32dvh,calc(100dvh-18rem))]"}`}
		>
			<CollapsiblePanel
				open={!isCollapsed}
				collapsible={canCollapse}
				onOpenChange={(open) => setIsCollapsed(!open)}
				headingProps={{
					"data-annotations-heading": true,
					tabIndex: -1,
				}}
				rowClassName="flex-1"
				contentClassName="flex h-full min-h-0 flex-col"
				label={
					<>
						<span className="sr-only">
							{isCollapsed ? "Expand" : "Collapse"} annotations
						</span>
						<ScanSearch
							aria-hidden="true"
							className="size-4 shrink-0 text-primary"
						/>
						<span>Annotations</span>
						<output
							aria-label={`${annotations.length} ${annotations.length === 1 ? "annotation" : "annotations"}`}
							className="rounded bg-primary-light px-2 py-0.5 text-xs font-semibold tabular-nums text-primary"
						>
							{annotations.length > 999 ? "+999" : annotations.length}
						</output>
					</>
				}
				actions={
					<fieldset className="relative m-0 inline-grid shrink-0 grid-cols-2 rounded-md border-0 bg-surface-muted p-0.5">
						<legend className="sr-only">Annotation order</legend>
						<span
							aria-hidden="true"
							className={`absolute inset-y-0.5 left-0.5 w-[calc(50%_-_0.125rem)] rounded bg-surface shadow-sm transition-transform duration-200 ease-out motion-reduce:transition-none ${sortOrder === "oldest" ? "translate-x-full" : "translate-x-0"}`}
						/>
						{(["newest", "oldest"] as const).map((order) => (
							<button
								key={order}
								type="button"
								aria-pressed={sortOrder === order}
								onClick={() => setSortOrder(order)}
								className={`relative min-h-9 cursor-pointer rounded px-2 text-xs font-medium transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-accent motion-reduce:transition-none ${sortOrder === order ? "text-primary" : "text-neutral-dark hover:text-secondary"}`}
							>
								{order === "newest" ? "Newest" : "Oldest"}
							</button>
						))}
					</fieldset>
				}
			>
				<p
					aria-live="polite"
					className={`m-0 px-4 pb-3 text-tiny ${draftStatus === "error" ? "text-error" : "text-neutral-dark"}`}
				>
					{draftStatus === "saving"
						? "Saving changes…"
						: draftStatus === "error"
							? "Changes could not be saved on this tab."
							: "Changes saved for this session."}
				</p>
				{annotations.length === 0 ? (
					<div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-2 overflow-y-auto px-6 py-6 text-center">
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
					<>
						<p id="annotation-keyboard-help" className="sr-only">
							Focus an annotation row. Arrow keys move its box 10 pixels; Alt
							plus an arrow moves it 1 pixel. Shift plus an arrow resizes it.
							Enter edits its label. Delete removes it.
						</p>
						<ul className="m-0 min-h-0 flex-1 list-none overflow-y-auto overscroll-contain px-2 pb-2">
							{orderedAnnotations.map(({ annotation, number }) => {
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
											aria-label={`Edit label for annotation ${number}${label ? `: ${label}` : ""}`}
											aria-describedby="annotation-keyboard-help"
											aria-keyshortcuts="ArrowUp ArrowDown ArrowLeft ArrowRight Alt+ArrowUp Alt+ArrowDown Alt+ArrowLeft Alt+ArrowRight Shift+ArrowUp Shift+ArrowDown Shift+ArrowLeft Shift+ArrowRight Delete Enter"
											onKeyDown={(event) => {
												if (event.key === "Delete") {
													event.preventDefault();
													if (!event.repeat)
														void removeAnnotation(annotation, label);
													return;
												}

												if (!event.key.startsWith("Arrow")) return;
												event.preventDefault();
												const selector = annotation.target.selector;
												if (selector.type !== ShapeType.RECTANGLE) return;

												const geometry = adjustRectangleForKey(
													selector.geometry as RectangleGeometry,
													event.key as
														| "ArrowDown"
														| "ArrowLeft"
														| "ArrowRight"
														| "ArrowUp",
													imageWidth,
													imageHeight,
													event.shiftKey,
													event.altKey,
												);
												annotator?.updateAnnotation({
													...annotation,
													target: {
														...annotation.target,
														selector: { ...selector, geometry },
													},
												});
											}}
											data-annotation-id={annotation.id}
											aria-pressed={selectedId === annotation.id}
											title={label || "Add a label"}
											className="flex min-h-11 min-w-0 flex-1 cursor-pointer items-center gap-2 rounded-md px-2 text-left text-sm text-secondary focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-accent [@media(pointer:fine)]:min-h-9"
										>
											<span className="grid size-5 shrink-0 place-items-center rounded bg-primary-light text-tiny font-medium tabular-nums text-primary">
												{number}
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
													const confirmed =
														await AnnotationDeleteConfirmation.call({});
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
											aria-label={`Delete annotation ${number}${label ? `: ${label}` : ""}`}
											className="grid size-11 shrink-0 cursor-pointer place-items-center rounded-md text-neutral-dark transition-colors hover:bg-error-light hover:text-error focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-accent [@media(pointer:fine)]:size-9"
										>
											<Trash2 aria-hidden="true" className="size-3.5" />
										</button>
									</li>
								);
							})}
						</ul>
					</>
				)}
			</CollapsiblePanel>
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
	sortOrder,
}: AnnotationNumberMarkersProps & { sortOrder: AnnotationSortOrder }) => {
	const annotations = useAnnotations();
	const orderedAnnotations = getOrderedAnnotations(annotations, sortOrder);

	return (
		<div aria-hidden="true" className="pointer-events-none absolute inset-0">
			{orderedAnnotations.map(({ annotation, number }) => {
				const { minX, minY } = annotation.target.selector.geometry.bounds;

				return (
					<span
						key={annotation.id}
						data-annotation-number={number}
						style={{
							left: `${(minX / imageWidth) * 100}%`,
							top: `${(minY / imageHeight) * 100}%`,
						}}
						className="absolute grid size-6 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-primary text-tiny font-semibold tabular-nums text-surface shadow-sm ring-1 ring-surface"
					>
						{number}
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

const TouchAnnotationDrag = ({
	scrollerRef,
	imageWidth,
	imageHeight,
}: {
	scrollerRef: RefObject<HTMLDivElement | null>;
	imageWidth: number;
	imageHeight: number;
}) => {
	const annotator = useAnnotator<Annotator<ImageAnnotation, ImageAnnotation>>();

	useEffect(() => {
		const scroller = scrollerRef.current;
		if (!scroller || !annotator) return;

		let drag: {
			pointerId: number;
			annotationId: string;
			annotation: ImageAnnotation;
			selector: Rectangle;
			geometry: RectangleGeometry;
			startX: number;
			startY: number;
			imageBounds: DOMRect;
			moved: boolean;
		} | null = null;

		const onPointerDown = (event: PointerEvent) => {
			if (event.pointerType !== "touch") return;
			if (drag) {
				if (drag.pointerId !== event.pointerId) {
					scroller.releasePointerCapture(drag.pointerId);
					drag = null;
					event.preventDefault();
					event.stopPropagation();
				}
				return;
			}

			const target = event.target;
			if (!(target instanceof Element)) return;
			const shape = target.closest<SVGGElement>(".a9s-annotation[data-id]");
			const annotationId = shape?.dataset.id;
			const annotation = annotationId
				? annotator.getAnnotationById(annotationId)
				: undefined;
			const selector = annotation?.target.selector;
			if (
				!annotationId ||
				!annotation ||
				selector?.type !== ShapeType.RECTANGLE
			)
				return;

			const image = scroller.querySelector("img");
			if (!image) return;
			const geometry = selector.geometry as RectangleGeometry;
			event.preventDefault();
			event.stopPropagation();
			annotator.setSelected();
			drag = {
				pointerId: event.pointerId,
				annotationId,
				annotation,
				selector: selector as Rectangle,
				geometry,
				startX: event.clientX,
				startY: event.clientY,
				imageBounds: image.getBoundingClientRect(),
				moved: false,
			};
			scroller.setPointerCapture(event.pointerId);
		};

		const onPointerMove = (event: PointerEvent) => {
			if (!drag || drag.pointerId !== event.pointerId) return;
			event.preventDefault();
			event.stopPropagation();
			const deltaX = event.clientX - drag.startX;
			const deltaY = event.clientY - drag.startY;
			if (!drag.moved && Math.hypot(deltaX, deltaY) < 4) return;
			drag.moved = true;

			const { geometry, imageBounds } = drag;
			const x = Math.max(
				0,
				Math.min(
					imageWidth - geometry.w,
					geometry.x + (deltaX * imageWidth) / imageBounds.width,
				),
			);
			const y = Math.max(
				0,
				Math.min(
					imageHeight - geometry.h,
					geometry.y + (deltaY * imageHeight) / imageBounds.height,
				),
			);
			const nextGeometry: RectangleGeometry = {
				...geometry,
				x,
				y,
				bounds: {
					minX: x,
					minY: y,
					maxX: x + geometry.w,
					maxY: y + geometry.h,
				},
			};
			annotator.updateAnnotation({
				...drag.annotation,
				target: {
					...drag.annotation.target,
					selector: { ...drag.selector, geometry: nextGeometry },
				},
			});
		};

		const onPointerUp = (event: PointerEvent) => {
			if (!drag || drag.pointerId !== event.pointerId) return;
			event.preventDefault();
			event.stopPropagation();
			if (!drag.moved) annotator.setSelected(drag.annotationId);
			drag = null;
		};

		const onPointerCancel = (event: PointerEvent) => {
			if (drag?.pointerId === event.pointerId) drag = null;
		};

		scroller.addEventListener("pointerdown", onPointerDown, true);
		scroller.addEventListener("pointermove", onPointerMove, true);
		scroller.addEventListener("pointerup", onPointerUp, true);
		scroller.addEventListener("pointercancel", onPointerCancel, true);
		return () => {
			scroller.removeEventListener("pointerdown", onPointerDown, true);
			scroller.removeEventListener("pointermove", onPointerMove, true);
			scroller.removeEventListener("pointerup", onPointerUp, true);
			scroller.removeEventListener("pointercancel", onPointerCancel, true);
		};
	}, [annotator, imageHeight, imageWidth, scrollerRef]);

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
	const [annotationSortOrder, setAnnotationSortOrder] =
		useState<AnnotationSortOrder>("newest");
	const [annotationsCollapsedState, setAnnotationsCollapsed] = useState(false);
	const isSideBySide = useMediaQuery(
		"(min-width: 64rem), (min-width: 40rem) and (max-height: 34rem)",
	);
	const annotationsCollapsed = !isSideBySide && annotationsCollapsedState;
	const [isPinching, setIsPinching] = useState(false);
	const [fitWidth, setFitWidth] = useState<number | null>(null);
	const photoScrollerRef = useRef<HTMLDivElement>(null);
	const zoomRef = useRef(zoom);
	const preservePinchPositionRef = useRef(false);

	useLayoutEffect(() => {
		zoomRef.current = zoom;
	}, [zoom]);

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
		if (preservePinchPositionRef.current) return;
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

	useEffect(() => {
		const scroller = photoScrollerRef.current;
		if (!scroller) return;

		let pinch: {
			distance: number;
			zoom: number;
			imageX: number;
			imageY: number;
		} | null = null;
		let frame = 0;
		const getCenter = (touches: TouchList) => ({
			x: (touches[0].clientX + touches[1].clientX) / 2,
			y: (touches[0].clientY + touches[1].clientY) / 2,
		});
		const getDistance = (touches: TouchList) =>
			Math.hypot(
				touches[0].clientX - touches[1].clientX,
				touches[0].clientY - touches[1].clientY,
			);
		const onTouchStart = (event: TouchEvent) => {
			if (event.touches.length < 2 || fitWidth === null) return;
			setIsPinching(true);
			const photo = scroller.firstElementChild;
			if (!photo) return;
			const center = getCenter(event.touches);
			const bounds = photo.getBoundingClientRect();
			pinch = {
				distance: getDistance(event.touches),
				zoom: zoomRef.current,
				imageX: Math.max(
					0,
					Math.min(1, (center.x - bounds.left) / bounds.width),
				),
				imageY: Math.max(
					0,
					Math.min(1, (center.y - bounds.top) / bounds.height),
				),
			};
		};
		const onTouchMove = (event: TouchEvent) => {
			if (!pinch || event.touches.length < 2 || fitWidth === null) return;
			event.preventDefault();
			const pinchState = pinch;
			const nextZoom = Math.max(
				0.25,
				Math.min(
					4,
					pinchState.zoom * (getDistance(event.touches) / pinchState.distance),
				),
			);
			const center = getCenter(event.touches);
			const bounds = scroller.getBoundingClientRect();
			setZoom(nextZoom);
			zoomRef.current = nextZoom;
			preservePinchPositionRef.current = true;
			cancelAnimationFrame(frame);
			frame = requestAnimationFrame(() => {
				const width = fitWidth * nextZoom;
				const height = (width * imageHeight) / imageWidth;
				const offsetX = Math.max(0, (scroller.clientWidth - width) / 2);
				const offsetY = Math.max(0, (scroller.clientHeight - height) / 2);
				scroller.scrollLeft = Math.max(
					0,
					pinchState.imageX * width + offsetX - (center.x - bounds.left),
				);
				scroller.scrollTop = Math.max(
					0,
					pinchState.imageY * height + offsetY - (center.y - bounds.top),
				);
				preservePinchPositionRef.current = false;
			});
		};
		const onTouchEnd = (event: TouchEvent) => {
			if (event.touches.length < 2) {
				pinch = null;
				setIsPinching(false);
			}
		};

		scroller.addEventListener("touchstart", onTouchStart, { passive: true });
		scroller.addEventListener("touchmove", onTouchMove, { passive: false });
		scroller.addEventListener("touchend", onTouchEnd, { passive: true });
		scroller.addEventListener("touchcancel", onTouchEnd, { passive: true });
		return () => {
			cancelAnimationFrame(frame);
			scroller.removeEventListener("touchstart", onTouchStart);
			scroller.removeEventListener("touchmove", onTouchMove);
			scroller.removeEventListener("touchend", onTouchEnd);
			scroller.removeEventListener("touchcancel", onTouchEnd);
		};
	}, [fitWidth, imageHeight, imageWidth]);

	const photoWidth =
		fitWidth === null
			? `min(100cqw, ${(imageWidth / imageHeight) * 100}cqh)`
			: fitWidth * zoom;
	const workspaceClassName = [
		"grid min-h-0 min-w-0 flex-1 grid-rows-[minmax(0,1fr)_auto] overflow-hidden",
		"lg:grid-cols-[minmax(0,1fr)_20rem] lg:grid-rows-[minmax(0,1fr)]",
		"[@media(max-height:34rem)_and_(min-width:40rem)]:grid-cols-[minmax(0,1fr)_17rem] [@media(max-height:34rem)_and_(min-width:40rem)]:grid-rows-[minmax(0,1fr)]",
	].join(" ");

	return (
		<Annotorious>
			<TouchAnnotationDrag
				scrollerRef={photoScrollerRef}
				imageWidth={imageWidth}
				imageHeight={imageHeight}
			/>
			<div className={workspaceClassName}>
				<section
					aria-label="Photo canvas"
					className="grid min-h-0 min-w-0 grid-rows-[auto_minmax(0,1fr)_auto] bg-surface-muted"
				>
					<div className="flex min-h-11 items-center justify-end border-b border-border/60 bg-surface px-3 py-2 sm:px-4">
						<p className="m-0 min-w-0 flex-1 whitespace-normal text-left text-xs leading-4 text-neutral-dark lg:text-right">
							<span className="inline lg:hidden">
								Drag empty space to draw · Drag a box to move · Tap a box to
								resize
							</span>
							<span className="hidden lg:inline">
								Select a box to move or resize · Drag empty space to draw
							</span>
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
									containerClassName="relative size-full [&_.a9s-inner]:fill-primary/5! [&_.a9s-inner]:stroke-primary! [&_.a9s-outer]:hidden! [&_.a9s-inner]:[stroke-width:1px]! [&_.a9s-handle-dot]:stroke-primary! [&_.a9s-annotationlayer.hover]:cursor-move!"
									drawingEnabled={!isPinching}
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
									sortOrder={annotationSortOrder}
								/>
							</div>
						</div>
					</div>
					<PhotoZoomControls
						imageWidth={imageWidth}
						imageHeight={imageHeight}
						zoom={zoom}
						setZoom={setZoom}
					/>
				</section>
				<aside
					aria-label="Photo inspector"
					className="flex min-h-0 min-w-0 flex-col overflow-hidden border-t border-border/60 bg-surface text-left lg:border-l lg:border-t-0 [@media(max-height:34rem)_and_(min-width:40rem)]:border-l [@media(max-height:34rem)_and_(min-width:40rem)]:border-t-0 [@media(max-height:34rem)_and_(min-width:40rem)]:overflow-y-auto"
				>
					<div
						id="photo-inspector-content"
						className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-1 [@media(max-height:34rem)_and_(min-width:40rem)]:flex-none [@media(max-height:34rem)_and_(min-width:40rem)]:overflow-visible"
					>
						<div className="order-2 shrink-0 border-b border-border/60 lg:order-1 [@media(max-height:34rem)_and_(min-width:40rem)]:order-1">
							<CollapsiblePanel
								label="Photo details"
								defaultOpen={isSideBySide}
							>
								{photoDetails}
							</CollapsiblePanel>
						</div>
						<AnnotationList
							draftStatus={draftStatus}
							sortOrder={annotationSortOrder}
							setSortOrder={setAnnotationSortOrder}
							imageWidth={imageWidth}
							imageHeight={imageHeight}
							canCollapse={!isSideBySide}
							isCollapsed={annotationsCollapsed}
							setIsCollapsed={setAnnotationsCollapsed}
						/>
					</div>
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
						arrow
						arrowProps={{
							className: "fill-surface",
							tipRadius: 3,
							strokeWidth: 0,
						}}
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
