# Ego Browser checks

Run `pnpm dev` in another terminal, then run `pnpm test:ego`. Requires Ego Browser; this suite is local-only because it drives its browser task spaces and synthetic media. Scripts run sequentially and stop on the first failure.

| Check | Coverage |
| --- | --- |
| `check-ascii-backdrop.mjs` | Animated and reduced-motion canvas drawing, viewport resizing |
| `check-live-camera.mjs` | Synthetic camera, switching, torch, capture/retake, permission errors, responsive layouts |
| `check-annotation-ui.mjs` | Capture-to-annotation workflow, labels, touch, zoom, responsive layouts, deletion and same-tab restore |

Each successful run uses and closes its own uniquely named task space, leaving other Ego Browser work untouched. A failed run leaves its isolated space open for diagnosis. Screenshots are written to `/tmp`.

Run one check directly when debugging:

```sh
ego-browser nodejs < scripts/ego-browser/check-live-camera.mjs
```

Checks default to `http://localhost:3000`. Set `globalThis.egoCheckBaseUrl` in the Ego Browser Node session to target another local server.
