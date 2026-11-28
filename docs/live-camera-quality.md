# Live camera quality

Live camera checks are advisory: they never disable the shutter, capture automatically, enable the torch, or upload frames. Captured-photo review retains the last live reading from before the shutter as an estimate, beside the actual still-image resolution and file size; it is not a measurement of the saved photo. Camera controls sit inside the preview; very short screens scroll the preview/quality region instead of collapsing the viewfinder. The live preview shows a four-corner center framing guide; it is a visual composition aid and does not control autofocus.

## Pipeline and experimental defaults

`useCamera` owns the stream. `useLiveImageQuality` is enabled only while preview status is `live`; its hook cancels sampling when capture completes or the camera stops. `CameraCapture` snapshots the latest reading when the shutter is pressed. `CapturedPhotoSummary` pairs that advisory live reading with the captured image's actual canvas dimensions and encoded file size. Its compact metric grid uses the Animata widget's grouped-stat pattern without fabricated percentages. On desktop and short-landscape layouts, the photo sits left of a right-side inspector, with photo details above annotations. On narrow portrait screens, the inspector follows the photo, with annotations before photo details. Sampling observes the existing video, not another camera stream.

- Native video frame callbacks, with a 200 ms minimum sample interval; timer fallback when unsupported. A watchdog removes stale results after a gap greater than 400 ms. Frozen fallback frames cannot recover until video media time advances.
- One reusable canvas, `willReadFrequently: true`; preserve intrinsic aspect ratio, cap longest analysis side at 320, never upscale. Canvas and two independent grayscale buffers resize only when needed.
- Luma: rounded `0.299R + 0.587G + 0.114B`. Dark pixels: luma ≤15; bright pixels: ≥240.
- Focus: population variance of the four-neighbor Laplacian over interior pixels, without clamping responses. Good >150, warning 60–150, poor <60. Too few samples: unknown.
- Lighting: mean luma good 60–195; warning 40–<60 or >195–220; poor <40 or >220. Dark/bright fractions good <0.10, warning 0.10–0.25, poor >0.25. Worst check wins. Both directions failing produces mixed-lighting advice.
- Stability: grayscale mean absolute difference. Good <3, warning 3–8, poor >8; first frame and sample gaps outside 100–400 ms are unknown.
- Smooth raw measurements with EMA alpha 0.35. Require three consecutive candidate statuses before showing each check; lighting direction settles with lighting severity. Missing measurements become unknown immediately. Overall severity: poor, then warning, then unknown, then good.
- Camera/track changes, intrinsic dimension changes, orientation changes, interruptions and visibility changes reset history. Hidden documents suspend both timers and callbacks. Pixel extraction failures show unavailable without affecting capture.
- Publish only changed statuses or resolution metadata. Only the stable main message is an ARIA live region, not each sample. Guidance priority: poor before warning, then stability, lighting, focus. Torch is suggested only when supported and off.

Resolution explicitly means **preview resolution**, not still-photo resolution. Captured-photo details use actual canvas dimensions and encoded blob size, but reuse live focus, lighting, and stability estimates from just before capture. These are not a still-photo quality score. Focus estimates sharpness, not autofocus. Stability measures scene changes, not camera shake, gyroscope readings or motion blur. Exposure changes and moving subjects can trigger stability warnings. Near-black/white fractions are not proof of sensor clipping. Blank surfaces can appear blurry; noise can appear sharp; naturally dark/white subjects can trigger lighting warnings.

## Verification

Using the existing Node test runner, without additional dependencies (Node 22.15+ with native TypeScript support, or Node 24+):

```sh
node --test src/lib/image-quality.test.mjs src/hooks/use-camera.test.mjs
pnpm check
pnpm typecheck
pnpm build
pnpm exec react-doctor --verbose --scope full
```

The metric/sampler suite covers luma conversion, aspect ratio, synthetic sharp/blurred edges, uniform/invalid frames, threshold boundaries, mixed lighting, first-frame unknown, MAD, EMA, status transitions, deduplicated publishing, readiness, throttling, stream/dimension/orientation resets, hidden/resume, stale/frozen frames, extraction failure/recovery, timer fallback, cleanup and double setup/cleanup resembling Strict Mode. It tests the sampler lifecycle directly, not React's internal scheduler.

With `pnpm dev` running and Ego Browser installed:

```sh
pnpm test:ego

# Or run checks individually:
ego-browser nodejs < scripts/ego-browser/check-live-camera.mjs
ego-browser nodejs < scripts/ego-browser/check-annotation-ui.mjs
ego-browser nodejs < scripts/ego-browser/check-ascii-backdrop.mjs
```

The browser checks use deterministic canvas-backed media and mocked capabilities/errors, without requesting a real device. They cover camera switching, torch, capture/retake, permission errors, responsive layouts, photo metadata, labels, annotations, and same-tab restore. Successful runs close their isolated task spaces; failures leave the space open for diagnosis. Screenshots are saved under `/tmp`. Real permission prompts are not exercised by these mocks. See `scripts/ego-browser/README.md` for coverage and setup.

### Results and limits

- 17 Node tests passed; typecheck, production build and Biome checks passed. Repository-wide Biome check reports six existing informational notices in `.impeccable` evidence HTML, not errors.
- Browser smoke checks passed at all five sizes. Minimum viewfinder height remains 10rem; short layouts allow vertical scrolling. The automation host delivered the dark canvas fixture at irregular, sometimes roughly one-second intervals; unavailable/warmup is therefore expected. Stable dark/torch guidance is verified in unit tests, not claimed as a full end-to-end camera calibration.
- Desktop Chromium synthetic profile: 320×240 analysis of a 640×480 striped canvas, 20 warmup iterations plus 100 measured iterations, including downsampling/readback, grayscale, metrics, MAD and filtering. Median 1.1 ms, p95 13.6 ms on this machine. Balanced fixture mean luma 153, zero dark/bright fractions, Laplacian variance 1832.15. This is a local synthetic measurement, not mobile performance, battery consumption, native camera latency, or a preview-FPS guarantee. No worker is justified by this limited measurement.
- Full React Doctor: 91/100, two maintainability warnings for control-flow complexity in camera capture and preview controls; no correctness diagnostics.
- **Not calibrated on labeled physical-device photos.** Thresholds remain the handoff's starting values, not validated photo-quality guarantees. Android Chrome, iOS Safari, desktop physical webcams, camera switching, real torch behavior, low-light/glare, low-texture scenes, portrait/landscape changes, mobile overhead and battery usage still need device testing. Use the exact preprocessing above when calibrating, and record false positives before changing thresholds.
