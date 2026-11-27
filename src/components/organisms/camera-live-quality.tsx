import { Camera, CircleCheck, TriangleAlert } from "lucide-react";
import {
	assessPhoto,
	type LiveQuality,
	type QualityStatus,
	qualitySuggestion,
} from "@/lib/image-quality";

const liveTones: Record<QualityStatus, string> = {
	good: "text-success-light",
	warning: "text-amber-300",
	poor: "text-error-light",
	unknown: "text-surface/75",
};
const tones: Record<QualityStatus, string> = {
	good: "text-success",
	warning: "text-amber-900",
	poor: "text-error",
	unknown: "text-neutral-dark",
};
const focusLabels: Record<QualityStatus, string> = {
	good: "Sharp",
	warning: "Soft",
	poor: "Possibly blurry",
	unknown: "Unknown",
};
const stabilityLabels: Record<QualityStatus, string> = {
	good: "Steady",
	warning: "Moving",
	poor: "High movement",
	unknown: "Unknown",
};
const photoQualityLabels: Record<QualityStatus, string> = {
	good: "Good",
	warning: "Fair",
	poor: "Poor",
	unknown: "Not checked",
};
const lightingLabels = {
	balanced: "Balanced",
	dark: "Too dark",
	bright: "Too bright",
	mixed: "Mixed lighting",
	unknown: "Unknown",
};

type IndicatorProps = {
	quality: LiveQuality;
	torchSupported: boolean;
	torchEnabled: boolean;
};

const getStatusPresentation = (quality: LiveQuality) => {
	if (quality.unavailable)
		return { title: "Quality unavailable", Icon: Camera };
	if (quality.overall === "poor" || quality.overall === "warning") {
		return { title: "Adjust capture conditions", Icon: TriangleAlert };
	}
	if (quality.overall === "good") {
		return { title: "Good capture conditions", Icon: CircleCheck };
	}
	return { title: "Checking conditions…", Icon: Camera };
};

const QualitySuggestion = ({
	quality,
	torchSupported,
	torchEnabled,
}: IndicatorProps) =>
	!quality.unavailable &&
	(quality.overall === "poor" || quality.overall === "warning") && (
		<p className="m-0 text-xs leading-4 text-surface/90">
			{qualitySuggestion(quality, torchSupported, torchEnabled)}
		</p>
	);

const LiveQualityIndicator = ({
	quality,
	torchSupported,
	torchEnabled,
}: IndicatorProps) => {
	const { title, Icon: StatusIcon } = getStatusPresentation(quality);
	const checks = [
		{
			label: "Focus",
			status: quality.focus,
			value: focusLabels[quality.focus],
		},
		{
			label: "Lighting",
			status: quality.lighting,
			value: lightingLabels[quality.lightingDirection],
		},
		{
			label: "Stability",
			status: quality.stability,
			value: stabilityLabels[quality.stability],
		},
	];
	return (
		<section
			aria-label="Live camera quality"
			className="pointer-events-none absolute left-1/2 top-3 z-10 w-[calc(100%_-_1.5rem)] max-w-[22rem] -translate-x-1/2 rounded-xl border border-surface/20 bg-secondary/40 p-2.5 text-surface shadow-lg backdrop-blur-md"
		>
			<div className="flex flex-col gap-1.5">
				<div className="flex items-center gap-2">
					<StatusIcon
						aria-hidden="true"
						className={`size-4 shrink-0 ${quality.unavailable ? "text-surface" : liveTones[quality.overall]}`}
					/>
					<output
						className="m-0 text-sm font-semibold leading-5 text-surface"
						aria-live="polite"
					>
						{title}
					</output>
				</div>
				<dl className="grid w-full grid-cols-3 gap-2 text-sm leading-5">
					{checks.map(({ label, status, value }) => (
						<div key={label} className="min-w-0">
							<dt className="text-xs text-surface/70">{label}</dt>
							<dd className={`m-0 font-semibold ${liveTones[status]}`}>
								{value}
							</dd>
						</div>
					))}
				</dl>
				<QualitySuggestion
					quality={quality}
					torchSupported={torchSupported}
					torchEnabled={torchEnabled}
				/>
			</div>
			<p className="sr-only">
				Focus estimates sharpness, not autofocus. Stability estimates scene
				motion, not camera shake. The center box is a framing guide, not an
				autofocus control. Preview resolution is not still-photo resolution.
			</p>
		</section>
	);
};

export const CameraLiveQuality = (props: IndicatorProps) => (
	<LiveQualityIndicator {...props} />
);

type CapturedPhotoSummaryProps = {
	quality: LiveQuality;
	width: number;
	height: number;
	fileSize: string;
	bytes: number;
	onRetake?: () => void;
	variant?: "panel" | "overlay";
};

type PhotoMetric = {
	label: string;
	value: string;
	status: QualityStatus;
};

const getSummaryPresentation = (
	variant: NonNullable<CapturedPhotoSummaryProps["variant"]>,
	status: QualityStatus,
	metrics: PhotoMetric[],
) => {
	const isOverlay = variant === "overlay";
	return {
		sectionClass: isOverlay
			? "pointer-events-none absolute left-1/2 top-3 z-10 w-[calc(100%_-_1.5rem)] max-w-[22rem] -translate-x-1/2 rounded-xl border border-surface/20 bg-secondary/80 p-2.5 text-left text-surface shadow-lg backdrop-blur-sm"
			: "min-w-0 shrink-0 border-b border-border/60 p-4",
		heading: isOverlay
			? `Photo quality · ${photoQualityLabels[status]}`
			: "Photo details",
		headingClass: isOverlay ? "text-surface" : "sr-only",
		labelClass: isOverlay ? "text-surface/70" : "text-neutral-dark",
		metrics: isOverlay ? metrics.slice(1) : metrics,
		valueTones: isOverlay ? liveTones : tones,
		adviceTone: isOverlay
			? status === "poor"
				? "font-semibold text-error-light"
				: status === "warning"
					? "text-amber-100"
					: "text-surface/85"
			: status === "poor"
				? "font-semibold text-error"
				: status === "warning"
					? "text-amber-900"
					: "text-neutral-dark",
	};
};

export const CapturedPhotoSummary = ({
	quality,
	width,
	height,
	fileSize,
	bytes,
	onRetake,
	variant = "panel",
}: CapturedPhotoSummaryProps) => {
	const assessment = assessPhoto({ width, height, bytes });
	const metrics: PhotoMetric[] = [
		{
			label: "Photo quality",
			value: photoQualityLabels[assessment.overall],
			status: assessment.overall,
		},
		{
			label: "Resolution",
			value: `${width} × ${height}`,
			status: assessment.resolution,
		},
		{ label: "File size", value: fileSize, status: assessment.fileSize },
		{
			label: "Live focus",
			value: focusLabels[quality.focus],
			status: quality.focus,
		},
		{
			label: "Live lighting",
			value: lightingLabels[quality.lightingDirection],
			status: quality.lighting,
		},
		{
			label: "Live stability",
			value: stabilityLabels[quality.stability],
			status: quality.stability,
		},
	];
	const presentation = getSummaryPresentation(
		variant,
		assessment.overall,
		metrics,
	);

	return (
		<section
			aria-labelledby="captured-photo-summary-heading"
			className={presentation.sectionClass}
		>
			<h2
				id="captured-photo-summary-heading"
				className={`m-0 text-sm font-semibold ${presentation.headingClass}`}
			>
				{presentation.heading}
			</h2>
			<dl className="m-0 mt-3 grid grid-cols-3 gap-x-3 gap-y-3">
				{presentation.metrics.map(({ label, value, status }) => (
					<div key={label} className="min-w-0">
						<dt className={`text-tiny leading-4 ${presentation.labelClass}`}>
							{label}
						</dt>
						<dd
							className={`m-0 mt-0.5 break-words text-tiny font-semibold leading-4 tabular-nums ${presentation.valueTones[status]}`}
						>
							{value}
						</dd>
					</div>
				))}
			</dl>
			<p
				role={assessment.advice ? "status" : undefined}
				className={`m-0 mt-3 text-tiny leading-4 ${presentation.adviceTone}`}
			>
				{assessment.advice ??
					"Focus, lighting and movement are live estimates; resolution and file size use this photo."}
			</p>
			{onRetake && (
				<button
					type="button"
					onClick={onRetake}
					className="mt-3 inline-flex min-h-11 w-full cursor-pointer items-center justify-center rounded-md border border-border px-3 text-sm font-medium text-secondary transition-colors hover:bg-primary-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent [@media(pointer:fine)]:min-h-8"
				>
					Retake photo
				</button>
			)}
		</section>
	);
};
