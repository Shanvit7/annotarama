import { createFileRoute } from "@tanstack/react-router";
import { CameraCapture } from "@/components/organisms/camera-capture";

export const Route = createFileRoute("/capture")({
	component: CameraCapture,
});
