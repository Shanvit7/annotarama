import { expect, test } from "@playwright/test";

test("capture, label annotation, and restore after refresh", async ({ page }) => {
	const runtimeErrors: string[] = [];
	page.on("pageerror", (error) => runtimeErrors.push(error.stack ?? error.message));
	page.on("console", (message) => {
		if (message.type() === "error") runtimeErrors.push(message.text());
	});

	await page.addInitScript(() => {
		const canvas = document.createElement("canvas");
		canvas.width = 640;
		canvas.height = 480;
		const context = canvas.getContext("2d");
		if (!context) throw new Error("Canvas is unavailable");
		context.fillStyle = "#dce1e6";
		context.fillRect(0, 0, canvas.width, canvas.height);
		context.fillStyle = "#354655";
		context.fillRect(80, 60, 480, 360);
		setInterval(() => context.fillRect(0, 0, 1, 1), 50);

		navigator.mediaDevices.getUserMedia = async () => {
			const stream = canvas.captureStream(30);
			const track = stream.getVideoTracks()[0];
			track.getCapabilities = () => ({ width: { max: 640 }, height: { max: 480 } });
			track.applyConstraints = async () => {};
			return stream;
		};
		navigator.mediaDevices.enumerateDevices = async () => [
			{ kind: "videoinput", deviceId: "test-camera" } as MediaDeviceInfo,
		];
	});

	await page.goto("/");
	await page.getByRole("link", { name: "Get started" }).click();
	await expect(page.getByRole("button", { name: "Start camera" })).toBeVisible();
	await page.goto("/annotate");
	await expect(page).toHaveURL(/\/capture$/);
	await page.getByRole("button", { name: "Start camera" }).click();
	await page.getByRole("button", { name: "Capture photo" }).click();
	await expect(page.getByRole("heading", { name: /Photo quality/ })).toBeVisible();
	await page.getByRole("button", { name: "Continue to annotate" }).click();
	await expect(page.getByRole("region", { name: "Photo canvas" })).toBeVisible();

	const photo = page.getByAltText("Captured scene");
	await expect(photo).toBeVisible();
	const bounds = await photo.boundingBox();
	expect(bounds).not.toBeNull();
	if (!bounds) throw new Error("Captured photo has no visible bounds");

	await page.mouse.move(bounds.x + bounds.width * 0.2, bounds.y + bounds.height * 0.2);
	await page.mouse.down();
	await page.mouse.move(bounds.x + bounds.width * 0.65, bounds.y + bounds.height * 0.65);
	await page.mouse.up();

	const labelEditor = page.getByRole("form", { name: "Edit annotation label" });
	await expect(labelEditor).toBeVisible();
	await expect(labelEditor.getByText("1", { exact: true })).toBeVisible();
	await labelEditor.getByRole("textbox", { name: "Annotation label" }).fill("Crack near mounting hole");
	await labelEditor.getByRole("button", { name: "Save label" }).click();
	const saveStatus = page.getByText("Saving changes…", { exact: true });
	await expect(saveStatus).toBeVisible();
	await expect(page.getByText("Changes saved for this session.", { exact: true })).toBeVisible();
	await expect(
		page.getByRole("button", { name: "Edit label for annotation 1: Crack near mounting hole" }),
	).toBeVisible();

	await page.setViewportSize({ width: 390, height: 844 });
	await expect(page.getByText("Drag empty space to draw · Drag a box to move · Tap a box to resize", { exact: true })).toBeVisible();
	await expect(page.getByText("Select a box to move or resize · Drag empty space to draw", { exact: true })).toBeHidden();
	await expect(photo).toBeVisible();
	await expect(page.getByText("640 × 480", { exact: true }).first()).toBeVisible();
	const canvasRegion = page.getByRole("region", { name: "Photo canvas" });
	const expandedCanvas = await canvasRegion.boundingBox();
	expect(expandedCanvas).not.toBeNull();
	if (!expandedCanvas) throw new Error("Photo canvas has no visible bounds");
	await page.getByRole("button", { name: "Collapse annotations" }).click();
	await expect(page.getByRole("button", { name: "Expand annotations" })).toHaveAttribute(
		"aria-expanded",
		"false",
	);
	await expect
		.poll(async () => (await canvasRegion.boundingBox())?.height ?? 0)
		.toBeGreaterThan(expandedCanvas.height);
	await expect(page.getByRole("button", { name: "Zoom in" })).toBeHidden();
	await expect(page.getByRole("button", { name: "Zoom out" })).toBeHidden();
	await expect(page.getByRole("button", { name: "Fit photo to view" })).toBeHidden();
	await expect(page.getByRole("slider", { name: "Photo and annotation split" })).toHaveCount(0);
	await page.setViewportSize({ width: 1280, height: 720 });
	await expect(page.getByText("Select a box to move or resize · Drag empty space to draw", { exact: true })).toBeVisible();
	await expect(page.getByText("Drag empty space to draw · Drag a box to move · Tap a box to resize", { exact: true })).toBeHidden();
	await expect(page.getByRole("button", { name: "Zoom in" })).toBeVisible();

	await page.reload();
	await expect(page.getByRole("button", { name: "Edit label for annotation 1: Crack near mounting hole" })).toBeVisible();
	await expect(page.getByAltText("Captured scene")).toBeVisible();
	expect(runtimeErrors).toEqual([]);
});
