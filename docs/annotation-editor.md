# Image annotation editor

## Decision

The captured-image editor uses `@annotorious/react` `3.10.0` for rectangle drawing and direct manipulation. It provides the image overlay, drawing, selection, move, resize, touch handles, and annotation lifecycle. No OpenSeadragon integration is used; captured photos are ordinary images, not zoomable or IIIF content.

## Setup

`@annotorious/react` `3.10.0` is already listed in `package.json`; install project dependencies with `pnpm install`. `src/components/organisms/image-annotation-editor.tsx` lazy-loads the browser-only `src/components/organisms/image-annotation-editor.client.tsx`, which imports the React bindings and `@annotorious/react/annotorious-react.css`.

## Implementation

- `src/components/organisms/camera-capture.tsx` renders `ImageAnnotationEditor` only after a photo is captured.
- The captured stage uses an editor workspace: photo canvas on the left, a docked inspector on the right with photo quality/details above annotations. The canvas includes rectangle-mode guidance, zoom-out/in controls, and a percentage button that resets to Fit. Fit shows the whole photo; zoom preserves the photo, centers the view, and scrolls to the edges when enlarged. The percentage is relative to Fit. Annotation geometry stays attached to the image at every zoom level. Phones stack the inspector below the canvas and scroll the workspace. Short landscape screens scroll the inspector as a whole so quality cannot squeeze annotation rows out of view.
- `ImageAnnotator` is configured with `tool="rectangle"` and `drawingMode="drag"`.
- The image and overlay share a size-fitting container computed from captured image dimensions. Both retain the exact image aspect ratio without cropping or internal letterboxing; do not use `object-cover`.
- `src/lib/photo-drafts.ts` stores the captured photo blob, dimensions, quality snapshot, and full Annotorious annotation objects in Dexie/IndexedDB. Annotation changes debounce for 250 ms and flush on `pagehide`; same-tab refresh restores the photo and labels. Retake deletes the tab's draft.
- The tab ID lives in `sessionStorage`; a fresh top-level navigation creates a new ID, avoiding reuse of copied session storage when a browser duplicates a tab. Reload and back/forward navigation reuse the current ID. `pagehide` queues cleanup in `localStorage`; any later visit to this origin processes due deletions after a 5-second grace period. A 30-day stale-record fallback handles missed close events.
- Annotorious owns rectangle geometry. Its image-responsive overlay keeps rectangle positions and dimensions aligned as display size changes.
- `ImageAnnotationPopup` supplies a compact anchored textarea, portaled outside the clipped canvas. Save stores a trimmed label as an annotation body with `purpose: "commenting"` and closes the popup. Typing updates the locally saved label; Close or Escape closes the editor. A top-corner close icon overlays the composer rather than reserving a spacer row. Its bottom toolbar uses an icon-only Delete action (accessible label and tooltip) and returns focus to an adjacent annotation.
- Each rectangle has a numbered chat-style badge at its top-left, matching its annotation-list row. Annotation list gives users visible count, active selection, keyboard-accessible selection, and delete controls. Long labels truncate with a full-text tooltip. The list scrolls independently; desktop and short landscape layouts place it beside the photo, narrow portrait layouts below it. Drag handles support pointer and touch editing.

## Limits

- Rectangles only. No polygons, freehand marks, zoomable imagery, collaboration, or export.
- Drafts are local to one tab and device; there is no account, server sync, or permanent archive. Closing a tab queues deletion for the next visit to this origin. Browser shutdown can interrupt `pagehide`, so cleanup is best-effort; stale records expire after 30 days.
- Retaking explicitly deletes the current tab's saved photo and annotations.
- Keyboard users can navigate/select/delete from the annotation list and edit labels.

## Validation

Run before release:

```sh
pnpm test
pnpm check
pnpm typecheck
pnpm build
```

The Node tests cover camera error mapping and image-quality analysis/sampling. The browser check below covers photo/annotation save and same-tab restore; closed-tab cleanup still needs manual validation.

With the dev server running, automated captured-state browser check (requires `ego-browser`):

```sh
ego-browser nodejs < scripts/check-annotation-ui.mjs
```

Uses a synthetic camera stream and checks capture, label validation/save/edit, Escape focus return, confirmed deletion/cancellation, same-tab refresh, numbered-marker alignment, long labels, and 15 annotations at nine viewport sizes (including tablet and short landscape). It checks docked versus stacked layout, usable canvas/list sizes, overflow, zoom-in/out and Fit reset at nine viewport sizes, and popup bounds; emulates touch drawing and writes desktop/mobile screenshots to `/tmp/annotation-ui-{desktop,mobile}.png`. The default server URL is `http://localhost:3000`; set `globalThis.annotationTestUrl` before the script to override it. Physical touch manipulation still needs device testing.

Manual checks on desktop and touch device:

1. Capture a photo, draw a rectangle, move it, and resize each edge/corner.
2. Select a box, save a label, confirm numbered badge and row stay in sync, then delete it from the list or popup.
3. Refresh the same tab; confirm photo, dimensions, labels, and rectangle geometry restore.
4. Open the app in a separate tab; confirm it does not load the first tab's draft. Retake in the original tab and confirm its draft is deleted.
5. Close a tab with a draft, then revisit any route on this origin after the grace period; confirm its queued draft is deleted.
6. Resize viewport and confirm boxes stay aligned. Tab through list and popup controls; confirm visible focus. Verify rectangle geometry editing by touch on a physical device.
