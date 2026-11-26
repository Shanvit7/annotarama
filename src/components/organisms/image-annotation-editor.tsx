import { ClientOnly } from "@tanstack/react-router";
import { lazy, Suspense } from "react";

type ImageAnnotationEditorProps = {
	imageUrl: string;
	imageWidth: number;
	imageHeight: number;
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
