import type { ImageAnnotation } from "@annotorious/react";
import { ClientOnly } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import type { PhotoDraftStatus } from "@/lib/photo-drafts";

type ImageAnnotationEditorProps = {
	imageUrl: string;
	imageWidth: number;
	imageHeight: number;
	draftId: string | null;
	initialAnnotations: ImageAnnotation[];
	draftStatus: PhotoDraftStatus;
	setDraftStatus: (status: PhotoDraftStatus) => void;
	annotationSheetContainer: HTMLElement;
};

const ClientImageAnnotationEditor = lazy(
	() => import("./image-annotation-editor.client"),
);

export const ImageAnnotationEditor = (props: ImageAnnotationEditorProps) => (
	<ClientOnly fallback={null}>
		<Suspense fallback={null}>
			<ClientImageAnnotationEditor {...props} />
		</Suspense>
	</ClientOnly>
);
