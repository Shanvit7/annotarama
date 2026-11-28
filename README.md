<p align="center">
  <img src="public/favicon.svg" alt="Annotarama logo" width="72" height="72" />
</p>

# Annotarama

Annotarama is a React app for capturing images with a device camera, assessing image quality, and creating editable, labeled bounding-box annotations. The target experience is responsive across desktop, tablet, and mobile. See [`docs/OBJECTIVES.md`](docs/OBJECTIVES.md) for product objectives and requirements, and [`DESIGN.md`](DESIGN.md) for the Loopr AI-inspired visual system.

> **Status:** camera capture, advisory live-preview quality checks, camera switching, torch control where supported, rectangular annotation editing, and per-tab local photo/annotation restore are implemented. Quality thresholds remain experimental; real-device calibration and persistence-path tests remain outstanding. See [camera quality notes](docs/live-camera-quality.md) and [annotation editor notes](docs/annotation-editor.md).

## Stack

- React 19 and TanStack Start / Router
- Vite 8
- Tailwind CSS 4
- TypeScript
- pnpm 12; Node.js 22+

## Run locally

```bash
pnpm install
pnpm dev
```

Open <http://localhost:3000>. React Scan is opt-in: run `VITE_REACT_SCAN=true pnpm dev` when profiling renders; normal development runs without its hook instrumentation.

## Quality checks

```bash
pnpm exec playwright install chromium # once per machine
pnpm test
pnpm test:e2e
pnpm check
pnpm typecheck
pnpm knip
pnpm build
```

`pnpm test:e2e` starts the app automatically and runs a Chromium capture → annotate → refresh/restore flow with a synthetic camera. GitHub Actions installs Chromium and runs the same browser test on pull requests to `main`. Husky runs Biome on staged files before commit.

## GitHub Pages

After enabling **Settings → Pages → GitHub Actions** in the repository, pushes to `main` deploy the pre-rendered app. GitHub Pages' repository base path is applied to assets and client-side routes.

## Current workflow

1. Request camera access and show a live preview.
2. Switch between available cameras; expose torch control only when supported.
3. Capture, review, or retake an image; show resolution, file size, and advisory live quality.
4. Draw, select, move, resize, label, and delete bounding boxes; view them in the annotation list.
5. Keep annotations aligned as the displayed image resizes; support touch interaction on mobile and tablets.

## Technical notes

- **Camera, torch, and quality:** requests an ideal 3840×2160 preview, then captures at the dimensions actually supplied by the browser. Torch control is shown only when the active camera reports torch support; unsupported controls are omitted rather than shown disabled, since they cannot be used. After a toggle, the UI reads the track’s reported torch state when available, falling back to the requested state if the browser does not report it. Quality checks are advisory live-preview estimates, not analysis of the saved still; thresholds are experimental. See [`docs/live-camera-quality.md`](docs/live-camera-quality.md).
- **Annotations and session storage:** `@annotorious/react` manages rectangles; Dexie/IndexedDB stores the photo and its annotation geometry/labels for the current tab. Same-tab refresh restores them; tab-close cleanup is queued for the next visit to this origin. Storage is local, temporary, and not synced or exported. See [`docs/annotation-editor.md`](docs/annotation-editor.md).
- **Vite** is the TanStack Start build tool; see [`docs/adr/0001-vite-build-tool.md`](docs/adr/0001-vite-build-tool.md).
- **Loopr AI** is a visual reference, not a template to copy. Reuse the palette, typography, and spacing documented in [`DESIGN.md`](DESIGN.md), while keeping Annotarama's own logo and product UI original.

## Project layout

- `src/routes/` — file-based TanStack routes
- `src/styles.css` — Tailwind import and design tokens
- `public/favicon.svg` — Annotarama icon, used as the browser favicon
- `docs/OBJECTIVES.md` — product objectives and success criteria
- `docs/adr/` — durable technical decisions

## Demo and known limitations

For a running demonstration, start `pnpm dev`, open `/capture` on `localhost`, and walk through camera permission, quality feedback, capture, rectangle labeling/editing, same-tab refresh restore, and retake. No recorded video or public demo URL is included. Camera access on deployed sites requires a secure context. Camera and torch behavior varies by browser/device; physical-device checks remain outstanding. Quality thresholds need calibration with representative photos. Per-tab storage cleanup is best-effort and runs on the next visit to this origin; there is no export, permanent archive, or server sync.
