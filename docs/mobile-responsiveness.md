# Mobile Responsiveness Notes

The refactored homepage keeps responsiveness simple by leaning on the `BloodDroplet` primitives rather than large CSS variable matrices. Key behaviours to remember:

## 1. Typography & Layout
- The headline (`styles.titleGoo` / `styles.titleCrisp`) uses `clamp(3rem, 16vw, 13rem)` so the word stays centred and legible from 320 px upwards without custom breakpoints.
- `letter-spacing` is now `clamp(0em, 0.8vw, 0.35em)`, tightening automatically on phones and relaxing on wide monitors.
- Both title layers share identical markup and transform (`translate(-50%, -50%)`), guaranteeing alignment regardless of viewport.
- The backdrop container relies on Tailwind utility classes (`h-screen w-screen`). Safe-area padding can be added at the page level if future designs require it.

## 2. Droplet Distribution
- `BASE_OFFSETS` contains percentage anchors. Because positions are percentage-based, droplets stay inside the viewport across aspect ratios.
- `JITTER_RANGE` jitters those anchors by up to ±12 percentage points, then clamps the result between 5 % and 95 % so even in landscape the drops do not clip against the edges.
- `resolveScaleMultiplier` shrinks the entire scale range to ~60 % below 480 px, ~75 % below 768 px, ~90 % below 1024 px, and 100 % on wide screens. Final droplet sizes still vary randomly within that band.

To customise for specific breakpoints, derive the metadata before rendering:

```ts
const droplets = BASE_OFFSETS.map((base, index) => ({
  offset: getRandomOffset(base),
  scale: getRandomScale(resolveScaleMultiplier(window.innerWidth)),
  delay: index * 0.5,
}));
```

## 3. Animation Timing
- The hover section (30 % → 54 %) remains linear, so the perceived pause scales with the droplet height. Smaller droplets hover briefly, larger ones linger a little longer.
- Both freefall sections reuse the same cubic-bezier values, so the pace feels consistent regardless of screen height.
- The first droplet's `animationiteration` callback reshuffles offsets/scales every loop, keeping motion fresh even on long viewing sessions.

## 4. Accessibility & Performance
- Droplet SVGs remain `aria-hidden` because they are decorative.
- The goo filter is applied to a dedicated wrapper; avoid placing interactive elements inside it to prevent pointer-event issues on mobile.
- Randomisation happens on the server thanks to `export const dynamic = "force-dynamic";`. Static export would need an alternative (e.g. seeding in a client effect).

With these guardrails the scene behaves predictably on phones and tablets while still allowing art direction tweaks through a handful of constants.
