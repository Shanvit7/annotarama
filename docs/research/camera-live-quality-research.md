# Camera handling and live image quality research

Research date: 2026-11-25 (updated after browser package search)

## Scope

Annotarama is a React 19 + TanStack Start browser app. `PRODUCT.md`, `docs/OBJECTIVES.md`, and the frontend assignment require device-camera preview/capture, permission and unsupported-device handling, a visible image-quality indicator, quality thresholds/feedback, capture review/retake, and annotation. No upload flow is specified. User direction for the proposed UX: live camera cues should cover actual resolution, blur/focus, and exposure; no AI models. Low-quality captures remain usable.

## Findings

- Browser `navigator.mediaDevices.getUserMedia()` is the native source for live camera streams and permission failures. It requires a secure context and can reject for denied permission, missing devices, or device/busy/constraint errors. App should map failures to actionable UI and a retry path rather than hide the browser error. [MDN: getUserMedia](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia)
- `MediaStreamTrack.getSettings()` exposes the active track settings, including dimensions when provided; `getCapabilities()` and `applyConstraints()` expose only capabilities supported by that track/browser. Torch must be feature-detected and its state must reflect successful constraint application. [MDN: getSettings](https://developer.mozilla.org/en-US/docs/Web/API/MediaStreamTrack/getSettings), [getCapabilities](https://developer.mozilla.org/en-US/docs/Web/API/MediaStreamTrack/getCapabilities), [applyConstraints](https://developer.mozilla.org/en-US/docs/Web/API/MediaStreamTrack/applyConstraints)
- `react-webcam@7.2.0` offers a React preview/screenshot wrapper and `onUserMediaError`; its `screenshotQuality` is an encoding-quality setting, not a live image-quality assessment. NPM metadata lists its latest release as modified 2023-10-25. It does not satisfy the live-quality requirement by itself. [NPM](https://www.npmjs.com/package/react-webcam), [README](https://github.com/mozmorris/react-webcam)
- `react-camera-pro@1.4.0` includes camera switching and user-facing camera error messages, but its declared peer dependencies require React `^18.3.1` and `styled-components@^5.1.34`; latest metadata was modified 2024-05-30. It does not provide live image-quality analysis and is a poor fit for this React 19 app. [NPM](https://www.npmjs.com/package/react-camera-pro), [README](https://github.com/purple-technology/react-camera-pro)
- `react-record-webcam@2.0.1` (published 2026-04-16) supports React 18/19, typed errors, permission state, device hot-plug, screenshots, and recording presets. Its `high`/`hd` presets only select stream resolution and recording bitrates (up to 3840×2160); no blur, focus, or exposure feedback. Recording lifecycle is unnecessary here. [NPM](https://www.npmjs.com/package/react-record-webcam), [README](https://github.com/samuelweckstrom/react-record-webcam)
- `react-webcam@7.2.0` has `screenshotQuality`, which controls JPEG encoding quality; it is not a camera-feed sharpness/exposure assessment. [NPM](https://www.npmjs.com/package/react-webcam), [README](https://github.com/mozmorris/react-webcam)
- Commercial capture SDKs with similar cues exist, but are domain-specific: SmartCapture Web SDK documents live identity-document feedback states including `FixGlare` and `FixBlur`; it ships as password-protected `.tgz` packages/custom HTML elements and processes identity/face data through its service. Not a generic React package or suitable fit for Annotarama manufacturing images. [Web docs](https://smartcapture-docs.idscan.cloud/docs/web/intro/), [Document Camera](https://smartcapture-docs.idscan.cloud/docs/web/document-camera/), [demo repo/EULA](https://github.com/gbgplc/smartcapture-websdk-demo)
- Genius Scan SDK Web offers real-time document edge detection and positioning guidance, but its blur-detection docs list React Native/mobile integrations, not Web. Web SDK is commercial and document-focused. [Web SDK](https://geniusscansdk.com/sdk-web/), [Blur Detection availability](https://geniusscansdk.com/docs/v6/document-scanning/blur-detection/)
- `@techstark/opencv-js@5.0.0-release.1` (2026-06-24) offers general CV primitives, not a validated quality assessor; blur/exposure heuristics would still need selection and tuning. Its README notes browser-bundler setup and potentially lagging TypeScript declarations. [NPM](https://www.npmjs.com/package/@techstark/opencv-js), [OpenCV.js docs](https://docs.opencv.org/5.0.0/)
- `@mediapipe/tasks-vision@1.2.3` (2026-11-11) provides detection/classification tasks, not sharpness or exposure assessment. It only helps if a specific framing target is defined and requires model/WASM loading. [NPM](https://www.npmjs.com/package/@mediapipe/tasks-vision)
- No open-source, general-purpose React/web package found that gives live blur/focus and exposure cues out of the box. Commercial document-capture SDKs offer some matching feedback, but target IDs/documents and carry licensing/privacy trade-offs.

## Recommendation

Keep native `getUserMedia()` and current resolution/file-size metadata. `react-record-webcam` does not add the requested cues, and switching camera libraries would not solve blur/exposure.

If Annotarama needs baseline live cues without AI, use a small sampled frame plus local image processing (native Canvas or OpenCV.js). OpenCV.js offers primitives such as Laplacian sharpness and brightness/histogram analysis, but thresholds remain app-specific; its npm package is 14,731,296 bytes unpacked and needs WASM initialization. Prefer Canvas unless a prototype shows OpenCV materially helps. Treat cues as advice, not a capture gate; validate thresholds on representative housing/part imagery. [NPM](https://www.npmjs.com/package/@techstark/opencv-js), [README](https://github.com/TechStark/opencv-js)

## UX constraints from the assignment

- Camera-only capture; no image upload was requested.
- Quality indicator and below-threshold feedback belong in the live preview per user direction.
- Capture remains available at every quality state; low quality prompts a retake but does not discard or block the image.
- Assignment separately asks to display image resolution and file size. Those are capture metadata, so show them on the captured-image review even though quality assessment itself remains live-only.
- Preserve review/retake before annotation; permission denial, missing camera, busy/unreadable camera, and unsupported torch need clear recovery guidance.
- `docs/OBJECTIVES.md` orders its workflow as camera → capture/review/retake → quality check → annotation. The assignment requires an indicator/threshold feedback but does not name a required timing. User explicitly selected live-only quality checks; show required resolution/file-size metadata on review without running a second quality assessment. No upload path is specified. Treat this as the confirmed UX interpretation; do not silently alter the objectives file.

## Current quality requirement and package check

User clarified that quality cues include resolution/pixelation **and** blur/focus and exposure. No AI model requested; low-quality captures remain usable.

- Native `getUserMedia()` plus `MediaStreamTrack.getSettings()` already provides negotiated dimensions; captured `Blob.size` provides exact file size. `src/hooks/use-camera.ts` exposes stream resolution; `src/components/organisms/camera-capture.tsx` displays it live and shows captured dimensions/file size after capture. [MDN: getSettings](https://developer.mozilla.org/en-US/docs/Web/API/MediaStreamTrack/getSettings), [MDN: videoWidth](https://developer.mozilla.org/en-US/docs/Web/API/HTMLVideoElement/videoWidth)
- Browser search found no open-source, general-purpose React package with ready-made live blur/focus/exposure cues. `react-record-webcam` quality presets are resolution/bitrate only; `react-webcam` `screenshotQuality` is JPEG encoding quality only.
- Closest browser SDK: SmartCapture Web SDK documents `FixGlare`/`FixBlur` states and live ID-document feedback, but is a licensed, password-protected custom-element SDK for identity/face capture with service processing; not a fit for Annotarama's general manufacturing images.
- Genius Scan SDK Web offers document edge/framing guidance and on-device processing. Its blur-detection availability list excludes Web (it does include React Native), so it does not meet this React web app's blur requirement.
- No package was added. Recommended baseline: sample downscaled frames locally with Canvas (or OpenCV.js if justified) for blur/exposure cues. These metrics still need thresholds and representative-image validation; keep cues advisory, not capture-blocking.
