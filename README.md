<p align="center">
  <img src="public/favicon.svg" alt="Annotarama logo" width="72" height="72" />
</p>

# Annotarama

Annotarama is a React app for capturing images with a device camera, assessing image quality, and creating editable, labeled bounding-box annotations. The target experience is responsive across desktop, tablet, and mobile. See [`docs/OBJECTIVES.md`](docs/OBJECTIVES.md) for product objectives and requirements, and [`DESIGN.md`](DESIGN.md) for the Loopr AI-inspired visual system.

> **Status:** camera capture, advisory live-preview quality checks, camera switching, and bounding-box annotation editing are implemented. Annotation data stays in memory; captured-image quality assessment and persistence are not implemented. See [live camera quality notes](docs/live-camera-quality.md) for thresholds, checks, and device-testing limits.

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

Open <http://localhost:3000>.

## Quality checks

```bash
pnpm run test
pnpm check
pnpm typecheck
pnpm knip
pnpm build
```

Husky runs Biome on staged files before commit. GitHub Actions runs tests and all four quality checks on pushes and pull requests to `main`.

## GitHub Pages

After enabling **Settings → Pages → GitHub Actions** in the repository, pushes to `main` deploy the pre-rendered app. GitHub Pages' repository base path is applied to assets and client-side routes.

## Current workflow

1. Request camera access and show a live preview.
2. Switch between available cameras; expose torch control only when supported.
3. Capture, review, or retake an image; show resolution, file size, and advisory live quality.
4. Draw, select, move, resize, label, and delete bounding boxes.
5. Keep annotations aligned as the displayed image resizes; support touch and keyboard interaction.

## Current decisions

- **Vite** is the TanStack Start build tool. Its standard plugin path is already working; Rsbuild is not justified without a measured build-time need. See [`docs/adr/0001-vite-build-tool.md`](docs/adr/0001-vite-build-tool.md).
- **Loopr AI** is a visual reference, not a template to copy. Reuse the palette, typography, and spacing documented in [`DESIGN.md`](DESIGN.md), while keeping Annotarama's own logo and product UI original.
- **No backend or persistence layer is selected.** Core capture and annotation can run in the browser; decide storage/export when product needs are clear.

## Project layout

- `src/routes/` — file-based TanStack routes
- `src/styles.css` — Tailwind import and design tokens
- `public/favicon.svg` — Annotarama icon, used as the browser favicon
- `docs/OBJECTIVES.md` — product objectives and success criteria
- `docs/adr/` — durable technical decisions

## Known limitations

Live quality thresholds are experimental and need physical-device calibration. Camera and torch capabilities vary by browser and device; unsupported features are detected in the UI. Quality estimates describe the live preview, not the captured still. Annotation data is in memory only and is cleared on retake or leaving capture. Persistence and demo deployment are not implemented.
