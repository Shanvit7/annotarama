import {
	Annotorious,
	ImageAnnotationPopup,
	ImageAnnotator,
	useAnnotations,
	useAnnotator,
	useSelection,
} from "@annotorious/react";
import "@annotorious/react/annotorious-react.css";
import type { PopupProps } from "@annotorious/react";
import { ArrowUp, PanelRightOpen, ScanSearch, Trash2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
	Sheet,
	SheetClose,
	SheetContent,
	SheetDescription,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet";

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
	const deleteAnnotation = () => {
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
		requestAnimationFrame(() => target?.focus({ preventScroll: true }));
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
					setValue(event.currentTarget.value);
					if (event.currentTarget.value.trim()) setShowError(false);
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

const AnnotationList = () => {
	const annotator = useAnnotator();
	const annotations = useAnnotations();
	const { selected } = useSelection();
	const selectedId = selected[0]?.annotation.id;

	return (
		<aside
			aria-label="Annotations"
			className="flex h-full min-h-0 flex-col overflow-hidden bg-surface text-left"
		>
			<div className="flex h-12 shrink-0 items-center gap-3 border-b border-border/60 px-4">
				<ScanSearch aria-hidden="true" className="size-4 text-primary" />
				<SheetTitle
					data-annotations-heading
					tabIndex={-1}
					className="m-0 flex-1 text-base font-semibold focus-visible:outline-2 focus-visible:outline-accent"
				>
					Annotations
				</SheetTitle>
				<SheetDescription className="sr-only">
					Review and edit annotations for this photo.
				</SheetDescription>
				<output
					aria-label={`${annotations.length} ${annotations.length === 1 ? "annotation" : "annotations"}`}
					className="rounded-full bg-primary-light px-2.5 py-1 text-small font-semibold tabular-nums text-primary"
				>
					{annotations.length}
				</output>
				<SheetClose asChild>
					<button
						type="button"
						aria-label="Hide annotations"
						className="grid size-11 shrink-0 cursor-pointer place-items-center rounded-lg text-neutral-dark transition-colors hover:bg-primary-light hover:text-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
					>
						<X aria-hidden="true" className="size-4" />
					</button>
				</SheetClose>
			</div>
			{annotations.length === 0 ? (
				<p className="m-0 px-3 py-4 text-sm leading-5 text-neutral-dark">
					Draw a box, then add a label.
				</p>
			) : (
				<ul className="m-0 min-h-0 flex-1 list-none overflow-y-auto overscroll-contain p-2">
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
									onClick={() => annotator?.removeAnnotation(annotation.id)}
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
		</aside>
	);
};

type ImageAnnotationEditorProps = {
	imageUrl: string;
	imageWidth: number;
	imageHeight: number;
	annotationSheetContainer: HTMLElement;
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

const AnnotationSidebar = ({
	annotationSheetContainer,
}: Pick<ImageAnnotationEditorProps, "annotationSheetContainer">) => {
	const annotations = useAnnotations();

	return (
		<Sheet modal={false} defaultOpen>
			{createPortal(
				<SheetTrigger asChild>
					<button
						type="button"
						aria-label={`Open annotations drawer (${annotations.length})`}
						className="absolute right-4 top-4 z-10 inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-lg bg-primary px-3 text-sm font-semibold text-surface shadow-md transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
					>
						<PanelRightOpen aria-hidden="true" className="size-4" />
						<span>Open annotations</span>
						<span
							aria-hidden="true"
							className="rounded-full bg-surface/20 px-2 py-0.5 text-tiny tabular-nums"
						>
							{annotations.length}
						</span>
					</button>
				</SheetTrigger>,
				annotationSheetContainer,
			)}
			<SheetContent
				portalContainer={annotationSheetContainer}
				className="h-full overflow-hidden p-0 [@media(max-height:34rem)_and_(min-width:40rem)]:!w-72"
			>
				<AnnotationList />
			</SheetContent>
		</Sheet>
	);
};

const ImageAnnotationEditor = ({
	imageUrl,
	imageWidth,
	imageHeight,
	annotationSheetContainer,
}: ImageAnnotationEditorProps) => (
	<Annotorious>
		<div className="relative min-h-0 min-w-0 flex-1">
			<div className="flex size-full min-h-0 min-w-0 items-center justify-center overflow-hidden rounded-lg [container-type:size]">
				<div
					className="relative lg:translate-x-[-7.75rem] lg:max-w-[calc(100cqw_-_15rem)] [@media(max-height:34rem)_and_(min-width:40rem)]:translate-x-[-6.25rem] [@media(max-height:34rem)_and_(min-width:40rem)]:max-w-[calc(100cqw_-_12rem)]"
					style={{
						width: `min(100cqw, ${(imageWidth / imageHeight) * 100}cqh)`,
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
							alt="Captured photo. Draw boxes to mark areas needing attention."
							className="block size-full"
						/>
					</ImageAnnotator>
					<AnnotationNumberMarkers
						imageWidth={imageWidth}
						imageHeight={imageHeight}
					/>
				</div>
			</div>
			<AnnotationSidebar annotationSheetContainer={annotationSheetContainer} />
		</div>
		{createPortal(
			<ImageAnnotationPopup
				popup={(props) => (
					<AnnotationLabelForm key={props.annotation.id} {...props} />
				)}
			/>,
			document.body,
		)}
	</Annotorious>
);

export default ImageAnnotationEditor;
