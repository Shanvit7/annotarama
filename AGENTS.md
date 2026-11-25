# Agent instructions

## Code style

- Use arrow functions for new or modified React components, helpers, and callbacks; prefer `const`, never `var`; use template literals for interpolation and strict equality (`===`/`!==`). Do not rewrite untouched scaffold only to change syntax style.
- Keep TypeScript imports extensionless; use existing project aliases when configured. Follow this repo's Biome formatting rather than copying another repo's quote style.
- Style React UI with Tailwind utilities directly in `className`; do not add one-off component or page selectors to `src/styles.css`.
- Keep `src/styles.css` for Tailwind setup, `@theme` tokens, global resets, and behavior Tailwind cannot express cleanly (such as keyframes and reduced-motion handling).
- Do not use CSS `px` units for dimensions. Prefer Tailwind spacing/size utilities (`h-32`, `px-4`, `mx-8`); when an arbitrary value is necessary, use `rem`, `em`, or a fluid unit.
- Do not use inline `style` props for static presentation. Reuse existing theme tokens; do not introduce duplicate styling systems.

## Component architecture

- Follow `.agents/skills/atomic-design-fundamentals/SKILL.md`: treat design tokens as quarks, reusable controls as atoms, and compose components upward; routes should use reusable components instead of embedding them.

## Workflow

- Read the relevant code, `PRODUCT.md`, and this file before making changes; keep edits small and run the relevant checks.
- Do not commit changes unless user explicitly asks.
