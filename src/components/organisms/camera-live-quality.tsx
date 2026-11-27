import { Camera, CircleCheck, TriangleAlert } from "lucide-react";
import {
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
const qualityLabels: Record<QualityStatus, string> = {
	good: "Good",
	warning: "Needs review",
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
			className="pointer-events-none absolute left-1/2 top-3 z-10 w-[calc(100%_-_1.5rem)] max-w-[22rem] -translate-x-1/2 rounded-xl border border-surface/20 bg-secondary/50 p-2.5 text-surface shadow-lg backdrop-blur-sm"
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
				motion, not camera shake. Preview resolution is not still-photo
				resolution.
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
	onRetake: () => void;
};

export const CapturedPhotoSummary = ({
	quality,
	width,
	height,
	fileSize,
	onRetake,
}: CapturedPhotoSummaryProps) => {
	const qualityLabel = quality.unavailable
		? "Unavailable"
		: qualityLabels[quality.overall];
	const qualityStatus = quality.unavailable ? "unknown" : quality.overall;
	const metrics = [
		{ label: "Live quality", value: qualityLabel, status: qualityStatus },
		{ label: "Resolution", value: `${width} × ${height}` },
		{ label: "File size", value: fileSize },
		{
			label: "Focus",
			value: focusLabels[quality.focus],
			status: quality.focus,
		},
		{
			label: "Lighting",
			value: lightingLabels[quality.lightingDirection],
			status: quality.lighting,
		},
		{
			label: "Stability",
			value: stabilityLabels[quality.stability],
			status: quality.stability,
		},
	];

	return (
		<section
			aria-labelledby="captured-photo-summary-heading"
			className="min-w-0 shrink-0 border-b border-border/60 p-4"
		>
			<h2
				id="captured-photo-summary-heading"
				className="m-0 text-sm font-semibold text-secondary"
			>
				Photo details
			</h2>
			<dl className="m-0 mt-3 grid grid-cols-3 gap-x-3 gap-y-3">
				{metrics.map(({ label, value, status }) => (
					<div key={label} className="min-w-0">
						<dt className="text-tiny leading-4 text-neutral-dark">{label}</dt>
						<dd
							className={`m-0 mt-0.5 break-words text-tiny font-semibold leading-4 tabular-nums ${status ? tones[status] : "text-secondary"}`}
						>
							{value}
						</dd>
					</div>
				))}
			</dl>
			<p className="m-0 mt-3 text-tiny leading-4 text-neutral-dark">
				Live estimates before capture; final photo quality may differ.
			</p>
			<button
				type="button"
				onClick={onRetake}
				className="mt-3 inline-flex min-h-11 w-full cursor-pointer items-center justify-center rounded-md border border-border px-3 text-sm font-medium text-secondary transition-colors hover:bg-primary-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent [@media(pointer:fine)]:min-h-8"
			>
				Retake photo
			</button>
		</section>
	);
};
