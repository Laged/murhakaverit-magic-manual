# Blood Scene Architecture

This document captures the structure of the new homepage scene after the hero refactor. Only two modules remain in play: `BloodDroplet` for layout/filtering and `DropletShape` for the animated SVG drops.

## 1. Component Graph

```
page.tsx ("/")
└─ BloodDroplet
   ├─ gooChildren
   │  ├─ <DropletShape ... /> × n
   │  └─ <div className={styles.titleGoo}>murhakaverit</div>
   └─ crispChildren
      └─ <div className={styles.titleCrisp}>murhakaverit</div>
```

- The page keeps a small config surface (`BASE_OFFSETS`, `JITTER_RANGE`, clamp bounds) and produces an array of `{ offset, scale, delay }`. This keeps layout logic near the route while rendering details stay encapsulated in `BloodDroplet`.
- Both titles share the same markup and font settings, so they remain perfectly aligned; only their colour and blur differ.

## 2. BloodDroplet Responsibilities

`src/components/BloodDroplet/index.tsx`:

- Inlines the goo filter once with `id="goo"` and expands its bounds (`width/height = 200%`) so off-screen blur is preserved.
- Renders a filtered layer (`filter: url('#goo')`) containing the crimson top bar, all `gooChildren`, and the bottom bar.
- Adds a crisp copy of the top bar outside the filter to keep a clean lip.
- Renders `crispChildren` at z-index 10 so foreground content stays readable while droplets pass behind it.

`barHeight` defaults to 62px to match the base SVG height. If the droplet asset changes, update this prop and the animation will continue to line up with the bars.

## 3. DropletShape Responsibilities

`src/components/BloodDroplet/DropletShape.tsx` implements a single `fall` keyframe timeline.

- **Scalable path** – the `top` math references the computed `DROPLET_HEIGHT`, so the `scale` prop automatically rescales the motion.
- **Mirrored easing** – both freefall sections (top reservoir → title, title → bottom bar) share the same gravity-flavoured cubic-bezier curves, creating a symmetrical feel.
- **Hover band** – only the 30 % → 48 % and 48 % → 54 % ranges are linear, producing the visible slow-down over the text.
- **Delay friendly** – the inline style applies `animationDelay`, making staggered rain patterns trivial.

## 4. Configuration Points

Page-level constants (`src/app/page.tsx`):

- `BASE_OFFSETS`: canonical horizontal anchors. Add/remove entries to change the drop count.
- `JITTER_RANGE`: how far a droplet may wander left/right (± percentage points) before clamping to 5–95 %.
- `getRandomScale`: current distribution (`0.25–1.5×`). Swap for deterministic arrays if you need strict art direction.

Component props:

- `BloodDroplet.barHeight` – keeps the goo bars in sync with the SVG asset.
- `DropletShape.scale` – adapts droplet size for breakpoints (can be fed with media-query logic).
- `DropletShape.delay` – controls tempo; use smaller increments for a denser drizzle.

## 5. Extensibility

- Place new goo-only elements inside `gooChildren` and tint them `#880808` so the filter blends them seamlessly.
- For crisp overlays (logos, CTAs), render them via `crispChildren` or wrap `BloodDroplet` with additional positioned layers.
- If future scenes reuse the goo background, `BloodDroplet` can be mounted as a standalone background component—the filter is scoped and does not affect siblings.

Documenting this structure keeps the refactor self-explanatory and prevents the larger, deprecated hero tree from creeping back into the codebase.
