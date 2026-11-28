---
version: 1
slug: "src-components-organisms-camera-capture-tsx"
primary_target: "src/components/organisms/camera-capture.tsx"
related_targets: ["src/components/organisms/image-annotation-editor.client.tsx","src/components/organisms/camera-live-quality.tsx"]
---

# Annotation workspace layout

## Intent
User requested an editor-like layout revamp, not identity replacement or new capabilities: photo left, quality and annotation labels right, responsive. Visitor mode: Operate. Preserve Outfit, indigo tokens, existing drawing/label/delete primitives and tab-local persistence.

## Spatial thesis
Photo is primary task surface. A real in-flow right inspector groups photo quality/details above annotations; do not overlay the inspector on the image. Tight inspector gutters and rows support repeated edits; quiet neutral canvas supplies working space. Keep labels, save feedback, count, numbered rectangles with stable creation-order numbers through Newest/Oldest sorting, popover editing and confirmation.

## Structure
Desktop/tablet: flexible photo column + 20rem inspector. Short landscape (width >=40rem, height <=34rem): 17rem inspector, scroll inspector as a whole, retain >=12rem annotation area. Phones: stable max(17rem,40dvh) photo track followed by natural-height inspector; workspace scrolls. One annotation list/provider, matching visual and DOM order. Remove old translations and imaginary sidebar width subtraction. Preserve original aspect ratio, fit-to-view reset, centered scrollable zoom, common image/overlay coordinates, and body-portalled popovers.

## Verification
Biome check, TypeScript, 17 Node tests, production build pass. Impeccable layout detector returns []. React Doctor full scope: 100/100, zero errors/warnings. Existing ego-browser synthetic-camera check updated: capture/annotator readiness, label whitespace validation and save/edit, Escape focus return, 15 annotations including long label, marker alignment, independent list scrolling, image/inspector non-overlap, popup bounds, direct touch-drag of an existing box without preselection, touch drawing, cancelled/confirmed deletion and focus return, same-tab restore. Nine widths/heights: 1440x900,1024x768,768x1024,390x844,320x568,844x390,667x375,667x320,720x450. Desktop/mobile screenshots reviewed. Short-landscape list was 8–11 units high before fix; now 192 CSS pixels and scrollable inspector. Manual physical touch move/resize and real browser zoom remain unverified.

## Related fixes
Guard draft synchronization until annotator exists; initial capture previously crashed. Delete confirmation must not auto-restore focus to deleted popup after caller focuses surviving annotation row; cancellation retains normal restoration. No new packages, export, server sync, or timeline.
