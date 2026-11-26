# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

People who need to capture and mark up images, primarily manufacturing workers documenting things they see on the job. Copy should stay plain, practical, and non-technical.

## Product Purpose

Capture an image with a device camera, check its quality, and add labeled rectangular marks to show what matters.

## Positioning

An open, browser-based image capture and annotation app. No sign-in is required. No further positioning claim is confirmed.

## Operating Context

The app is intended for desktop, tablet, and mobile use. Manufacturing-floor workflows are the primary context; exact device, lighting, connectivity, and glove-use constraints are not yet confirmed.

## Capabilities and Constraints

- Implemented: live camera preview, capture/preview/retake, switching between available cameras, practical maximum resolution, quality feedback, and torch control where supported.
- Implemented: draw, select, move, resize, label, and delete rectangular annotations; marks stay aligned when image display size changes.
- Annotation data is in-memory only. Retaking or leaving capture clears annotations; persistence and export are not implemented.
- The app is open to use without authentication.
- Landing-page copy must be plain and useful, with no invented product claims.

## Brand Commitments

- Product name: Annotarama.
- Use the original mark at `public/favicon.svg`.
- Loopr AI is a visual reference only; do not copy its logo, layout, or copy.

## Evidence on Hand

- Product requirements: `docs/OBJECTIVES.md`.
- Current logo: `public/favicon.svg`.
- No real customer imagery, testimonials, benchmarks, or usage statistics are available. Label any illustrative sample as a demo.

## Product Principles

- Make image capture and annotation easy to understand without specialist terminology.
- Keep the path from camera to marked image direct.
- Explain unsupported camera features clearly; never imply support the device lacks.
- Do not require an account to enter the app.
