import {
	Camera,
	LoaderCircle,
	Square,
	SwitchCamera,
	Zap,
	ZapOff,
} from "lucide-react";
import type { CameraStatus } from "@/hooks/use-camera";

type CameraPreviewControlsProps = {
	status: CameraStatus;
	canSwitchCamera: boolean;
	torchSupported: boolean;
	torchEnabled: boolean;
	onStart: () => void;
	onCapture: () => void;
	onSwitchCamera: () => void;
	onStop: () => void;
	onTorch: () => void;
};

const CapturingOverlay = () => (
	<output
		aria-live="polite"
		className="absolute inset-0 z-20 grid place-items-center rounded-2xl bg-secondary/65 p-6 text-surface backdrop-blur-sm"
	>
		<div className="absolute inset-3 rounded-xl border-2 border-accent animate-pulse" />
		<div className="relative flex flex-col items-center gap-3 text-center">
			<LoaderCircle aria-hidden="true" className="size-8 animate-spin" />
			<p className="m-0 text-medium font-semibold">Saving your photo…</p>
			<p className="m-0 text-sm">This can take a moment.</p>
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
			<button
				type="button"
				onClick={onStop}
				aria-label="Stop camera"
				title="Stop camera"
				className="grid size-12 cursor-pointer place-items-center rounded-full hover:bg-surface/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
			>
				<Square aria-hidden="true" className="size-5" />
			</button>
			<button
				type="button"
				onClick={onCapture}
				aria-label="Capture photo"
				title="Capture photo"
				className="grid size-16 cursor-pointer place-items-center rounded-full border-4 border-surface bg-surface/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:bg-surface/40"
			>
				<span aria-hidden="true" className="size-12 rounded-full bg-surface" />
			</button>
			{canSwitchCamera && (
				<button
					type="button"
					onClick={onSwitchCamera}
					aria-label="Switch camera"
					title="Switch camera"
					className="grid size-12 cursor-pointer place-items-center rounded-full hover:bg-surface/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
				>
					<SwitchCamera aria-hidden="true" className="size-5" />
				</button>
			)}
			{torchSupported && (
				<button
					type="button"
					onClick={onTorch}
					aria-pressed={torchEnabled}
					aria-label={torchEnabled ? "Turn torch off" : "Turn torch on"}
					title={torchEnabled ? "Turn torch off" : "Turn torch on"}
					className="grid size-12 cursor-pointer place-items-center rounded-full hover:bg-surface/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
				>
					{torchEnabled ? (
						<Zap aria-hidden="true" className="size-5" />
					) : (
						<ZapOff aria-hidden="true" className="size-5" />
					)}
				</button>
			)}
		</div>
	</div>
);

export const CameraPreviewControls = ({
	status,
	canSwitchCamera,
	torchSupported,
	torchEnabled,
	onStart,
	onCapture,
	onSwitchCamera,
	onStop,
	onTorch,
}: CameraPreviewControlsProps) => {
	if (status === "captured") return null;
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
