---
name: Annotarama
description: Loopr AI–inspired interface system for a clear, confident product experience.
colors:
  primary: "#3c4fc9"
  primary-hover: "#303fa0"
  primary-light: "#ebedf9"
  surface-dark: "#12173c"
  indigo-light: "#7683d9"
  indigo-lighter: "#d8dbf4"
  indigo-dark: "#303fa0"
  indigo-darker: "#181f50"
  secondary: "#09123d"
  accent: "#7d93ff"
  frost: "#c7d2ff"
  ink: "#03040a"
  surface: "#ffffff"
  surface-muted: "#f2f2f2"
  border: "#03040a26"
  neutral: "#818184"
  neutral-light: "#b3b3b5"
  neutral-lighter: "#d9d9da"
  neutral-dark: "#4e4f53"
  neutral-darker: "#1c1d22"
  success: "#027a48"
  success-light: "#ecfdf3"
  error: "#b42318"
  error-light: "#fef3f2"
  sky: "#7ac7ff"
  sky-light: "#d0ebff"
typography:
  display:
    fontFamily: "Outfit, Arial, sans-serif"
    fontSize: "84px"
    fontWeight: 700
  headline:
    fontFamily: "Outfit, Arial, sans-serif"
    fontSize: "60px"
    fontWeight: 700
  heading-3:
    fontFamily: "Outfit, Arial, sans-serif"
    fontSize: "48px"
    fontWeight: 700
  heading-4:
    fontFamily: "Outfit, Arial, sans-serif"
    fontSize: "40px"
    fontWeight: 700
  heading-5:
    fontFamily: "Outfit, Arial, sans-serif"
    fontSize: "32px"
    fontWeight: 700
  heading-6:
    fontFamily: "Outfit, Arial, sans-serif"
    fontSize: "26px"
    fontWeight: 700
  body:
    fontFamily: "Outfit, Arial, sans-serif"
    fontSize: "16px"
    fontWeight: 400
  text-tiny:
    fontFamily: "Outfit, Arial, sans-serif"
    fontSize: "12px"
    fontWeight: 400
  text-small:
    fontFamily: "Outfit, Arial, sans-serif"
    fontSize: "16px"
    fontWeight: 400
  text-regular:
    fontFamily: "Outfit, Arial, sans-serif"
    fontSize: "18px"
    fontWeight: 400
  text-medium:
    fontFamily: "Outfit, Arial, sans-serif"
    fontSize: "20px"
    fontWeight: 400
  text-large:
    fontFamily: "Outfit, Arial, sans-serif"
    fontSize: "26px"
    fontWeight: 400
rounded:
  small: "16px"
  medium: "16px"
  large: "16px"
spacing:
  global: "64px"
  section-large: "112px"
  section-medium: "80px"
  section-small: "48px"
---

# Design System: Annotarama

## Overview

**Creative North Star: “Loopr AI — confident clarity for a modern product.”** The user selected Loopr AI as the north star. Preserve its observed blue-led palette and Outfit typography while keeping the interface crisp, legible, and focused on the work.

This is a visual reference, not a request to copy Loopr’s page layouts or product content. The current app is still a TanStack starter; palette and typography are established, while component patterns remain provisional until the product UI exists.

**Key Characteristics:**
- Loopr-inspired, blue-led identity.
- Outfit typography with restrained neutral surfaces.
- Clear semantic color roles; reuse tokens instead of raw values.

## Colors

The palette pairs a saturated indigo primary with deep navy support, vivid blue accents, neutral surfaces, and explicit success/error colors. Color roles and shades below are copied from the Loopr root tokens you supplied.

### Primary
- **Loopr Indigo**: primary actions and emphasis.
- **Deep Indigo**: primary hover state.
- **Pale Indigo**: low-emphasis brand surfaces.

### Secondary
- **Midnight Navy**: secondary emphasis and dark surfaces.
- **Signal Blue**: accent emphasis.
- **Frost Blue**: subtle supporting emphasis.
- **Sky Blue** and **Sky Light**: additional cool highlights.

### Status
- **Success** and **Success Light**: successful states.
- **Error** and **Error Light**: error states.

### Neutral
- **Ink**: primary text.
- **White**: default surface.
- **Soft Gray**: muted surface.
- **Ink-alpha border**: subtle separators and outlines.

**The Semantic Color Rule.** Use `primary`, `secondary`, `accent`, and surface tokens by role; do not scatter literal color values through components.

## Typography

**Display Font:** Outfit (Arial, sans-serif fallback)  
**Body Font:** Outfit (Arial, sans-serif fallback)

**Character:** Geometric, clean, and readable. Keep hierarchy clear and avoid introducing a second typeface without a product need.

### Hierarchy
- **Display** (700, 84px): use `text-heading-1` for large page headings where the layout supports it.
- **Headline** (700, 60px): use `text-heading-2` for section-level emphasis where appropriate.
- **Heading 3–6** (700, 48px / 40px / 32px / 26px): descending heading hierarchy.
- **Text** (400, 12px / 16px / 18px / 20px / 26px): tiny, small, regular, medium, and large text roles.

## Layout

Loopr's supplied tokens specify global page padding of 64px; section padding of 112px, 80px, or 48px; content max-widths from 320px to 1280px; and layout container widths of 768px, 1024px, and 1280px. Use these as the reference scale, adapting global padding for smaller viewports rather than assuming desktop spacing fits mobile. The starter route itself remains centered at 42rem with 2rem top spacing; that is starter-page behavior, not a global constraint.

## Shapes

Loopr's supplied root assigns 16px to small, medium, and large radii: there is no radius progression. Borders and dividers use 1px strokes. Preserve that uniform radius when adopting the source system; do not invent a graduated scale.

## Components

The Annotarama logo is `public/favicon.svg`: an icon-only open indigo loop with a diagonal pen nib on a transparent background, also used as the browser favicon. The header places this mark and wordmark in a single floating, translucent glass toolbar; no marketing navigation or extra copy. Borrow the Loopr palette and visual clarity, not its logo geometry or copy.

The landing page uses a pale-indigo hero, primary-blue heading, and one compact primary action (`h-11 px-4 gap-2 rounded-lg`, white text, visible focus). Visible copy is limited to the wordmark, one headline, and one Get started action. The enlarged Anatomy illustration introduces a phone first, then a machined bearing housing; the phone scans the part and matching boxes mark a damaged rim in both views. The sequence runs once and holds on the finished annotation; reduced-motion users see that state immediately. No playback controls. Geometry is generated from the Anatomy kit with `pnpm build:inspection`; no geometry engine is shipped to the browser. `/capture` is a placeholder with one concise in-progress message, not a working camera workflow. These are landing-page patterns, not a fully designed app component library.

## Do's and Don'ts

### Do:
- **Do** use the existing Tailwind utilities such as `bg-primary`, `text-secondary`, and `font-sans`.
- **Do** keep text and interactive states legible against their surfaces.
- **Do** preserve Loopr AI as visual inspiration without copying its logo, page composition, or content.

### Don't:
- **Don't** hard-code palette values in components when a theme utility exists.
- **Don't** present provisional component behavior as implemented UI; 16px radius is an observed source token, not an implemented component.
- **Don't** add a competing font or accent palette without a clear product need.
