# Annotarama — Product Objectives

Annotarama helps people capture images with a device camera and annotate them in one responsive workflow. Users can inspect image quality, draw labeled bounding boxes, and manage annotations without losing alignment as the image is resized.

## Product workflow

1. Open the camera and view a live preview.
2. Capture an image, review it, and retake it if needed.
3. Check image resolution and file size, with clear feedback when quality is below the chosen threshold.
4. Draw and manage rectangular annotations on the image.

## Product capabilities

### Camera and capture

- Request camera access and show a live preview.
- Capture at the highest practical resolution supported by the device and browser.
- Let users capture, preview, and retake images.
- Let users switch between available cameras when device has multiple video inputs.
- Handle denied permissions and unsupported devices with clear recovery guidance.
- Offer torch control on supported mobile devices; keep the UI in sync with actual torch state and omit or explain unsupported controls.

### Image quality

- Show a visible quality indicator.
- Display captured image resolution and file size.
- Define reasonable quality thresholds and explain when an image falls short.

### Annotation

- Draw rectangular bounding boxes on captured images.
- Select, move, resize, label, and delete annotations.
- Keep annotations aligned with their image when it is resized.
- Provide a clear way to view and manage all annotations.

### Responsive experience

- Support desktop, tablet, and mobile layouts, including touch interaction.
- Keep capture-to-annotation flow clear, with visible feedback for actions and errors.
- Prioritize accessibility and usable controls across input modes.

## Success criteria

- Camera and capture work across supported browsers, with graceful permission and capability handling.
- Image quality information and thresholds are visible and useful.
- Annotation editing is accurate, and annotations remain aligned at different display sizes.
- Core workflows are understandable and usable on desktop and touch devices.
- Setup, implementation choices, limitations, and meaningful tests are documented.
