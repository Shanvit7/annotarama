<p align="center">
  <img src="public/favicon.svg" alt="Annotarama logo" width="72" height="72" />
</p>

# Annotarama

Annotarama is a React app for capturing images with a device camera, assessing image quality, and creating editable, labeled bounding-box annotations. The target experience is responsive across desktop, tablet, and mobile. See [`docs/OBJECTIVES.md`](docs/OBJECTIVES.md) for product objectives and requirements, and [`DESIGN.md`](DESIGN.md) for the Loopr AI-inspired visual system.

> **Status:** project scaffold is in place; camera capture, image quality assessment, and annotation workflows are not implemented yet.

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
pnpm check
pnpm typecheck
pnpm knip
pnpm build
```

Husky runs Biome on staged files before commit. GitHub Actions runs all four quality checks on pushes and pull requests to `main`.

## Planned workflow

1. Request camera access and show a live preview.
2. Capture, review, or retake an image; expose torch control only when supported.
3. Show actual resolution and file size with clear quality feedback.
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

Camera, torch, quality thresholds, annotation editing, feature tests, persistence, and demo deployment remain to be built. Camera and torch capabilities vary by browser and device; unsupported features must be detected and explained in the UI.
