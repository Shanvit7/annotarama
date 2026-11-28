import {
	Camera,
	LoaderCircle,
	Square,
	SwitchCamera,
	Zap,
	ZapOff,
} from "lucide-react";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import type { CameraStatus } from "@/hooks/use-camera";

type CameraPreviewControlsProps = {
	status: CameraStatus;
	canSwitchCamera: boolean;
	torchSupported: boolean;
	torchEnabled: boolean;
	onStart: () => void;
	onCapture: () => void;
	isReviewingPhoto: boolean;
	onRetake: () => void;
	onContinueToAnnotate: () => void;
	onSwitchCamera: () => void;
	onStop: () => void;
	onTorch: () => void;
};

export const CapturingOverlay = () => (
	<output
		aria-live="polite"
		className="absolute inset-0 z-20 grid place-items-center bg-secondary/45 p-6 text-surface backdrop-blur-sm"
	>
		<div className="relative flex flex-col items-center gap-3 text-center">
			<div className="grid size-16 place-items-center rounded-full border-2 border-surface/80 bg-secondary/50 shadow-lg">
				<LoaderCircle aria-hidden="true" className="size-8 animate-spin" />
			</div>
			<p className="m-0 text-medium font-semibold">Saving photo…</p>
			<p className="m-0 text-sm">Hold camera steady.</p>
		</div>
	</output>
);

type CameraStartPromptProps = Pick<
	CameraPreviewControlsProps,
	"status" | "onStart"
>;

const CameraStartPrompt = ({ status, onStart }: CameraStartPromptProps) => (
	<div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-secondary/15 p-4">
		<p className="m-0 max-w-xs font-mono text-base leading-6 text-surface">
			{status === "requesting"
				? "Allow camera access in your browser if asked."
				: "Start the camera to see a live preview."}
		</p>
		<button
			type="button"
			disabled={status === "requesting"}
			onClick={onStart}
			className="inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-full bg-surface px-6 font-mono font-semibold text-primary shadow-sm transition-colors hover:bg-primary-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-wait disabled:opacity-70"
		>
			<Camera aria-hidden="true" className="size-5" />
			{status === "requesting"
				? "Starting camera..."
				: status === "error"
					? "Try again"
					: "Start camera"}
		</button>
	</div>
);

type LiveCameraButtonsProps = Pick<
	CameraPreviewControlsProps,
	| "canSwitchCamera"
	| "torchSupported"
	| "torchEnabled"
	| "onCapture"
	| "onSwitchCamera"
	| "onStop"
	| "onTorch"
>;

const LiveCameraButtons = ({
	canSwitchCamera,
	torchSupported,
	torchEnabled,
	onCapture,
	onStop,
	onSwitchCamera,
	onTorch,
}: LiveCameraButtonsProps) => (
	<div className="absolute inset-x-0 bottom-3 z-10 flex justify-center px-3">
		<div className="flex items-center gap-5 rounded-full bg-secondary/85 p-2 text-surface">
			<Tooltip>
				<TooltipTrigger asChild>
					<button
						type="button"
						onClick={onStop}
						aria-label="Stop camera"
						className="grid size-12 cursor-pointer place-items-center rounded-full hover:bg-surface/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
					>
						<Square aria-hidden="true" className="size-5" />
					</button>
				</TooltipTrigger>
				<TooltipContent>Stop camera</TooltipContent>
			</Tooltip>
			<Tooltip>
				<TooltipTrigger asChild>
					<button
						type="button"
						onClick={onCapture}
						aria-label="Capture photo"
						className="grid size-16 cursor-pointer place-items-center rounded-full border-4 border-surface bg-surface/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:bg-surface/40"
					>
						<span
							aria-hidden="true"
							className="size-12 rounded-full bg-surface"
						/>
					</button>
				</TooltipTrigger>
				<TooltipContent>Capture photo</TooltipContent>
			</Tooltip>
			{canSwitchCamera && (
				<Tooltip>
					<TooltipTrigger asChild>
						<button
							type="button"
							onClick={onSwitchCamera}
							aria-label="Switch camera"
							className="grid size-12 cursor-pointer place-items-center rounded-full hover:bg-surface/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
						>
							<SwitchCamera aria-hidden="true" className="size-5" />
						</button>
					</TooltipTrigger>
					<TooltipContent>Switch camera</TooltipContent>
				</Tooltip>
			)}
			{torchSupported && (
				<Tooltip>
					<TooltipTrigger asChild>
						<button
							type="button"
							onClick={onTorch}
							aria-pressed={torchEnabled}
							aria-label={torchEnabled ? "Turn torch off" : "Turn torch on"}
							className="grid size-12 cursor-pointer place-items-center rounded-full hover:bg-surface/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
						>
							{torchEnabled ? (
								<Zap aria-hidden="true" className="size-5" />
							) : (
								<ZapOff aria-hidden="true" className="size-5" />
							)}
						</button>
					</TooltipTrigger>
					<TooltipContent>
						{torchEnabled ? "Turn torch off" : "Turn torch on"}
					</TooltipContent>
				</Tooltip>
			)}
		</div>
	</div>
);

const PhotoReviewButtons = ({
	onRetake,
	onContinueToAnnotate,
}: Pick<CameraPreviewControlsProps, "onRetake" | "onContinueToAnnotate">) => (
	<div className="absolute inset-x-0 bottom-3 z-10 flex justify-center px-3">
		<div className="inline-flex items-center gap-2 rounded-full bg-secondary/85 p-2 text-surface">
			<button
				type="button"
				onClick={onRetake}
				className="min-h-12 cursor-pointer rounded-full border border-surface/30 px-4 text-sm font-medium text-surface transition-colors hover:bg-surface/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
			>
				Retake photo
			</button>
			<button
				type="button"
				onClick={onContinueToAnnotate}
				className="min-h-12 cursor-pointer rounded-full bg-primary px-4 text-sm font-semibold text-surface transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
			>
				Continue to annotate
			</button>
		</div>
	</div>
);

export const CameraPreviewControls = ({
	status,
	isReviewingPhoto,
	onRetake,
	onContinueToAnnotate,
	canSwitchCamera,
	torchSupported,
	torchEnabled,
	onStart,
	onCapture,
	onSwitchCamera,
	onStop,
	onTorch,
}: CameraPreviewControlsProps) => {
	if (status === "captured") {
		return isReviewingPhoto ? (
			<PhotoReviewButtons
				onRetake={onRetake}
				onContinueToAnnotate={onContinueToAnnotate}
			/>
		) : null;
	}
	if (status === "capturing") return <CapturingOverlay />;
	if (status !== "live") {
		return <CameraStartPrompt status={status} onStart={onStart} />;
	}
	return (
		<LiveCameraButtons
			{...{
				canSwitchCamera,
				torchSupported,
				torchEnabled,
				onCapture,
				onStop,
				onSwitchCamera,
				onTorch,
			}}
		/>
	);
};
