---
name: react-scan
description: Use React Scan in this TanStack Start app to spot unnecessary React renders during development and validate performance changes.
---

# React Scan (Annotarama)

This repo uses the `react-scan` dev dependency through an opt-in development-only module script in `src/routes/__root.tsx`. With `VITE_REACT_SCAN=true`, the script loads `src/react-scan.ts` from `<head>` before the app entry, keeping React Scan out of production bundles and letting it hook React before rendering. Vite prebundles this separate head-script dependency to avoid late optimizer reloads.

## Use it

1. Run `VITE_REACT_SCAN=true pnpm dev` and open `http://localhost:3000`. Normal development leaves instrumentation disabled so it cannot affect runtime error diagnosis.
2. Reproduce the interaction you want to inspect. React Scan highlights components that render.
3. Investigate why a component rendered before adding memoization. For timing comparisons, use React DevTools Profiler and compare the same interaction before and after.
4. Run `pnpm run react:doctor` for static React diagnostics.

Do not add React Scan to production or add one-off capture scripts. A highlight is a clue, not proof that a render is costly; prefer measured improvements over blanket memoization.
