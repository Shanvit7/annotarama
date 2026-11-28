import { expect, test } from "@playwright/test";

test("capture, label annotation, and restore after refresh", async ({ page }) => {
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

	await page.goto("/capture");
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
	await labelEditor.getByRole("textbox", { name: "Annotation label" }).fill("Crack near mounting hole");
	await labelEditor.getByRole("button", { name: "Save label" }).click();
	const saveStatus = page.getByText("Saving changes…", { exact: true });
	await expect(saveStatus).toBeVisible();
	await expect(page.getByText("Changes saved on this tab.", { exact: true })).toBeVisible();
	await expect(
		page.getByRole("button", { name: "Edit label for annotation 1: Crack near mounting hole" }),
	).toBeVisible();

	await page.reload();
	await expect(page.getByRole("button", { name: "Edit label for annotation 1: Crack near mounting hole" })).toBeVisible();
	await expect(page.getByAltText("Captured scene")).toBeVisible();
});
