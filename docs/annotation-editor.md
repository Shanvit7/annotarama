# Image annotation editor

## Decision

The captured-image editor uses `@annotorious/react` `3.10.0` for rectangle drawing and direct manipulation. It provides the image overlay, drawing, selection, move, resize, touch handles, and annotation lifecycle. No OpenSeadragon integration is used; captured photos are ordinary images, not zoomable or IIIF content.

## Setup

```sh
pnpm add @annotorious/react
```

`src/components/organisms/image-annotation-editor.tsx` lazy-loads the browser-only `src/components/organisms/image-annotation-editor.client.tsx`, which imports the React bindings and `@annotorious/react/annotorious-react.css`.

## Implementation

- `src/components/organisms/camera-capture.tsx` renders `ImageAnnotationEditor` only after a photo is captured.
- `ImageAnnotator` is configured with `tool="rectangle"` and `drawingMode="drag"`.
- The image and overlay share a size-fitting container computed from captured image dimensions. Both retain the exact image aspect ratio without cropping or internal letterboxing; do not use `object-cover`.
- Annotorious owns rectangle geometry. Its image-responsive overlay keeps rectangle positions and dimensions aligned as display size changes.
- `ImageAnnotationPopup` supplies a compact anchored textarea, portaled outside the clipped canvas. Save stores a trimmed label as an annotation body with `purpose: "commenting"` and closes the popup. Close or Escape discards the draft. A top-corner close icon overlays the composer rather than reserving a spacer row. Its bottom toolbar uses an icon-only Delete action (accessible label and tooltip) and returns focus to an adjacent annotation.
- Each rectangle has a numbered chat-style badge at its top-left, matching its annotation-list row. Annotation list gives users visible count, active selection, keyboard-accessible selection, and delete controls. Long labels truncate with a full-text tooltip. The list scrolls independently; desktop and short landscape layouts place it beside the photo, narrow portrait layouts below it. Drag handles support pointer and touch editing.

## Limits

- Rectangles only. No polygons, freehand marks, zoomable imagery, collaboration, export, or persistence.
- Annotations live in editor memory. Retaking photo or leaving capture route clears them.
- Keyboard users can select and delete through annotation list and label through popup. Geometry adjustment remains pointer/touch-driven by Annotorious handles.

## Validation

Run before release:

```sh
pnpm typecheck
pnpm lint
pnpm build
```

With the dev server running, automated captured-state browser check (requires `ego-browser`):

```sh
ego-browser nodejs < scripts/check-annotation-ui.mjs
```

Uses a synthetic camera stream, checks label validation/save/close/delete, numbered markers and 15 annotations at four viewport sizes, and writes desktop/mobile screenshots to `/tmp/annotation-ui-{desktop,mobile}.png`. Physical touch dragging still needs device testing.

Manual checks on desktop and touch device:

1. Capture photo, draw rectangle, move it, and resize each edge/corner.
2. Select box, save label, confirm numbered badge and row stay in sync, then delete it from popup.
3. Resize viewport and confirm boxes stay aligned.
4. Tab through annotation list and popup controls; confirm visible focus and usable delete action.
