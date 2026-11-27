import { Minus, Plus } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";

type PhotoZoomControlsProps = {
	imageWidth: number;
	imageHeight: number;
	zoom: number;
	setZoom: Dispatch<SetStateAction<number>>;
};

export const PhotoZoomControls = ({
	imageWidth,
	imageHeight,
	zoom,
	setZoom,
}: PhotoZoomControlsProps) => (
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
				onClick={() => setZoom((current) => Math.max(0.25, current - 0.25))}
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
				onClick={() => setZoom((current) => Math.min(4, current + 0.25))}
				className="inline-flex size-10 items-center justify-center rounded-md text-neutral-dark hover:bg-surface-muted disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
			>
				<Plus aria-hidden="true" className="size-4" />
			</button>
		</fieldset>
	</div>
);
