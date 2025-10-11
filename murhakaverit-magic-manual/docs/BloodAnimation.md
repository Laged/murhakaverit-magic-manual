# Blood Animation Guide

The home page animation is composed from two building blocks:

1. **`BloodDroplet`** – responsible for the black backdrop, the twin crimson bars, the SVG goo filter definition, and for hosting both the gooey layer (`gooChildren`) and the crisp overlay (`crispChildren`).
2. **`DropletShape`** – an SVG teardrop animated with pure CSS. Instances are rendered in the goo layer so the filter blends them with the bars and the red title clone.

This document walks through how the effect is implemented today and what to tweak when iterating.

## 1. Goo Filter Setup

`BloodDroplet` inlines the filter once at the top of the component:

```tsx
<svg aria-hidden="true" className="absolute h-0 w-0">
  <defs>
    <filter id="goo" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur" />
      <feColorMatrix in="blur" type="matrix"
        values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -8" result="goo" />
      <feBlend in="SourceGraphic" in2="goo" />
    </filter>
  </defs>
</svg>
```

- The blur of `8` gives droplets enough thickness to merge without losing shape.
- The contrast row `20 -8` produces the crisp “snap” when blobs touch.
- Everything inside the goo layer is tinted `#880808`, so the filter can merge silhouettes cleanly. The crisp overlay reuses the same layout but is rendered outside the filter.

## 2. Layering Strategy

```
BloodDroplet
├─ crimson top bar (goo layer)
├─ gooChildren (drops + red title clone)
├─ crimson bottom bar (goo layer)
├─ crisp crimson top bar (outside filter)
└─ crispChildren (white title)
```

The two bars use the optional `barHeight` prop (default 62px) so their thickness matches every droplet’s base height. Keeping the red and white titles stacked in exactly the same position means the goo layer can blur into the lettering while the white text stays readable.

## 3. Droplet Animation

Each `DropletShape` renders the shared SVG path and injects the `fall` keyframes via a `<style jsx>` block. Key characteristics:

- Percentages: `0 → 16 → 30 → 48 → 54 → 76 → 100`. The droplet spends the first 30 % easing out of the top bar, hovers linearly across the title, then accelerates with matching gravity curves until it clears the bottom bar.
- Scaling: squashes slightly above the title (`scaleY(0.9)`) and stretches while accelerating (`scaleY(1.32)` at 100 %). These values are relative to the computed `height`, so they adapt when the `scale` prop changes.
- Duration: fixed at `6s`. You can vary `animationDuration` via inline style if future art direction needs slower/faster droplets.

Because each droplet accepts its own `scale`, `offset`, and `delay`, the page can easily support deterministic patterns or the randomised setup now used on the home route.

## 4. Random Placement

`src/app/page.tsx` generates droplet metadata on every request:

```ts
const BASE_OFFSETS = [20, 40, 60, 80];
const JITTER_RANGE = 12; // ± percentage points
const getRandomScale = () => Math.random() * 1.25 + 0.25;
```

Each base offset is jittered and clamped between 5 % and 95 % to avoid clipping at the edges. Scaling ranges from 0.25× to 1.5×. Because we export `dynamic = "force-dynamic"`, Next.js skips static rendering and generates a fresh pattern every page load.

To control the look:

- **More droplets** – extend `BASE_OFFSETS` with new anchors.
- **Different randomness** – tighten or widen `JITTER_RANGE`, or provide separate ranges for mobile/desktop.
- **Synchronous animation** – set `delay` to `0` or pass your own timing array instead of `index * 0.5`.

## 5. Extending the Scene

When adding new elements, follow these guardrails:

- Keep goo-layer shapes crimson so the filter blends them seamlessly.
- Respect the `barHeight` thickness if you add new bars or puddles; it aligns scaling with the drops.
- Duplicate any new goo shape in the crisp layer if the audience needs to read or focus on it.
- If new elements sit higher or lower than the title, adjust the 48 %/54 % keyframes so the hover lines up with the new interaction point.

This setup delivers the liquid effect with minimal DOM and no external animation dependencies. Future iterations should continue to centralise the logic inside the `BloodDroplet` module so the rest of the app stays unaware of filter details.
