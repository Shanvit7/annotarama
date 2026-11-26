# Agent instructions

## Code style

- Use arrow functions for new or modified React components, helpers, and callbacks; prefer `const`, never `var`; use template literals for interpolation and strict equality (`===`/`!==`). Do not rewrite untouched scaffold only to change syntax style.
- Use the configured `@/` alias for project-local imports under `src/`; avoid relative imports between handwritten app modules. Leave generated imports (such as `src/routeTree.gen.ts`) and Node-executed test imports relative when required. Keep TypeScript imports extensionless and follow this repo's Biome formatting.
- Style React UI with Tailwind utilities directly in `className`; do not add one-off component or page selectors to `src/styles.css`.
- Keep `src/styles.css` for Tailwind setup, `@theme` tokens, global resets, and behavior Tailwind cannot express cleanly (such as keyframes and reduced-motion handling).
- Do not use CSS `px` units for dimensions. Prefer Tailwind spacing/size utilities (`h-32`, `px-4`, `mx-8`); when an arbitrary value is necessary, use `rem`, `em`, or a fluid unit.
- Do not use inline `style` props for static presentation. Reuse existing theme tokens; do not introduce duplicate styling systems.

## Component architecture

- Follow `.agents/skills/atomic-design-fundamentals/SKILL.md`: treat design tokens as quarks, reusable controls as atoms, and compose components upward; routes should use reusable components instead of embedding them.

## Naming

- Use kebab-case for JavaScript/TypeScript filenames and directories; Biome enforces this with `style/useFilenamingConvention`.
- Keep JavaScript/TypeScript identifiers syntactically valid: camelCase for variables, functions, and properties; PascalCase for React components and types. Hyphens are not valid in unquoted identifiers.
- Preserve framework-required filename exceptions such as TanStack Router's `src/routes/__root.tsx`.

## Workflow

- Read the relevant code, `PRODUCT.md`, `docs/OBJECTIVES.md`, and this file before making changes; keep edits small and run the relevant checks.
- Treat documented objectives as the scope contract: do not invent or add capabilities based on assumptions. Flag gaps or conflicts and ask before expanding scope, unless the user explicitly approves the expansion.
- Do not commit changes unless user explicitly asks.
