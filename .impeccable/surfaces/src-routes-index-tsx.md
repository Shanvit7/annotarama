---
version: 1
slug: "src-routes-index-tsx"
primary_target: "src/routes/index.tsx"
related_targets: []
---

# Surface brief — `/`

- **Mode:** Persuade
- **Audience and job:** People capturing and marking images, primarily manufacturing-floor workers. Explain the product in plain language.
- **Offer and action:** Capture a photo, mark a part, add a short label. One **Get started** link opens `/capture`; the app is open and requires no sign-in.
- **Proof and content:** An original Anatomy inspection illustration shows image capture and annotation. No testimonials, stats, or fabricated claims. Get started opens the implemented camera-capture flow.
- **Constraints:** Keep existing Annotarama/Loopr-inspired palette, Outfit, and original logo. Mobile-first behavior. No additional landing-page actions or invented functionality.
- **Memorable moment:** An Anatomy phone captures a part; matching annotations identify its damaged rim in the photo and magnified view, then hold on the finished state.
- **Status:** Camera workflow and tab-local annotation persistence are implemented. Image-quality thresholds remain experimental; export is not implemented.

## Direction contract

**THESIS:** Let a phone scan explain Annotarama: phone first, machine part second, matching inspection marks last. Refuse feature-card stacks and unsupported claims.

**OWN-WORLD:** Use existing indigo, navy, white, Outfit, and original Annotarama mark. One custom isometric inspection figure carries the page; a crisp boundary on the damaged rim in both views shows the central action. No stock or borrowed assets.

**STORY:** Visitor sees what the app is for, understands capture → mark → label through the illustration, then opens the camera workflow without signing in.

**FIRST VIEWPORT:** The Annotarama wordmark anchors a responsive split hero. A concise headline and Get started action sit beside the custom Anatomy illustration; on mobile, copy and action precede the illustration.

**FORM:** Minimal app-first single surface, not a marketing-site scaffold. Use a floating translucent glass toolbar with only the Annotarama mark and wordmark, then a spacious split hero with oversized Anatomy artwork; keep the user's Loopr palette, plain copy, and one action. No copied nav, added panels, or extra actions.

**FINISH:** unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
