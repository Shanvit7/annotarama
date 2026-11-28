# Image annotation editor

## Decision

The captured-image editor uses `@annotorious/react` `3.10.0` for rectangle drawing and direct manipulation. It provides the image overlay, drawing, selection, move, resize, touch handles, and annotation lifecycle. No OpenSeadragon integration is used; captured photos are ordinary images, not zoomable or IIIF content.

## Setup

`@annotorious/react` `3.10.0` is already listed in `package.json`; install project dependencies with `pnpm install`. `src/components/organisms/image-annotation-editor.tsx` lazy-loads the browser-only `src/components/organisms/image-annotation-editor.client.tsx`, which imports the React bindings and `@annotorious/react/annotorious-react.css`.

## Implementation

- `src/components/organisms/camera-capture.tsx` renders `ImageAnnotationEditor` only after a photo is captured.
- The captured stage uses an editor workspace: photo canvas beside an inspector on wide layouts. Desktop and short-landscape inspectors place photo details above annotations; phone inspectors place the annotation list first and photo details after it. Gesture guidance distinguishes desktop selection from touch dragging; mobile hides zoom buttons; pinch zooms and single-finger pans. Desktop keeps zoom buttons and a percentage reset to Fit. Fit shows the whole photo; zoom preserves the photo, centers the view, and scrolls to the edges when enlarged. The percentage is relative to Fit. Annotation geometry stays attached to the image at every zoom level. Phones stack the inspector below the canvas and scroll the workspace; short landscape screens dock it beside the canvas and scroll the inspector as a whole.
- `ImageAnnotator` stays in `tool="rectangle"` and `drawingMode="drag"`; a separate draw/edit toggle was unnecessary because Annotorious already moves and resizes selected boxes. On desktop, select a box before dragging or resizing; an unselected drag draws a new annotation. On touch, `TouchAnnotationDrag` moves an existing box without requiring a prior tap; a tap selects the box and shows Annotorious resize handles.
- The image and overlay share a size-fitting container computed from captured image dimensions. Both retain the exact image aspect ratio without cropping or internal letterboxing; do not use `object-cover`.
- `src/lib/photo-drafts.ts` stores the captured photo blob, dimensions, quality snapshot, and full Annotorious annotation objects in Dexie/IndexedDB. Annotation changes debounce for 250 ms and flush on `pagehide`; same-tab refresh restores the photo and labels. Retake deletes the tab's draft.
- The tab ID lives in `sessionStorage`; a fresh top-level navigation creates a new ID, avoiding reuse of copied session storage when a browser duplicates a tab. Reload and back/forward navigation reuse the current ID. `pagehide` queues cleanup in `localStorage`; any later visit to this origin processes due deletions after a 5-second grace period. A 30-day stale-record fallback handles missed close events.
- Annotorious owns rectangle geometry. Its image-responsive overlay keeps rectangle positions and dimensions aligned as display size changes.
- `ImageAnnotationPopup` supplies a compact anchored textarea, portaled outside the clipped canvas. Save stores a trimmed label as an annotation body with `purpose: "commenting"` and closes the popup. Typing updates the locally saved label; Close or Escape closes the editor. A top-corner close icon overlays the composer rather than reserving a spacer row. Its bottom toolbar uses an icon-only Delete action (accessible label and tooltip) and returns focus to an adjacent annotation.
- Annotations receive stable numbers in creation order. List rows and photo badges keep the same numbers when sorting: Newest shows highest number first; Oldest shows number 1 first. Annotation list gives users visible count, active selection, keyboard-accessible selection, and delete controls. Long labels truncate with a full-text tooltip. The list scrolls independently; desktop and short landscape layouts place it beside the photo, narrow portrait layouts below it. Drag handles support pointer and touch editing.

## Limits

- Rectangles only. No polygons, freehand marks, deep-zoom imagery, collaboration, or export.
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
ego-browser nodejs < scripts/ego-browser/check-annotation-ui.mjs
```

Uses a synthetic camera stream and checks capture, label validation/save/edit, Escape focus return, confirmed deletion/cancellation, same-tab refresh, numbered-marker alignment, long labels, and 15 annotations at nine viewport sizes (including tablet and short landscape). It checks docked versus stacked layout, usable canvas/list sizes, overflow, zoom-in/out and Fit reset at nine viewport sizes, popup bounds, touch-dragging an existing box without selecting first, and touch drawing; writes desktop/mobile screenshots to `/tmp/annotation-ui-{desktop,mobile}.png`. The default server URL is `http://localhost:3000`; set `globalThis.egoCheckBaseUrl` before the script to override it. Run all Ego Browser checks with `pnpm test:ego`; see `scripts/ego-browser/README.md`. Physical touch manipulation still needs device testing.

Manual checks on desktop and touch device:

1. Capture a photo, draw a rectangle, drag an existing box to move it without selecting first, then tap it to resize each edge/corner.
2. Select a box, save a label, confirm numbered badge and row stay in sync, then delete it from the list or popup.
3. Refresh the same tab; confirm photo, dimensions, labels, and rectangle geometry restore.
4. Open the app in a separate tab; confirm it does not load the first tab's draft. Retake in the original tab and confirm its draft is deleted.
5. Close a tab with a draft, then revisit any route on this origin after the grace period; confirm its queued draft is deleted.
6. Resize viewport and confirm boxes stay aligned. Tab through list and popup controls; confirm keyboard focus is indicated by the background tint and, on text fields, border color. Verify direct touch move and resize on a physical device.
