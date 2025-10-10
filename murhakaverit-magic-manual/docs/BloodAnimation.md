# Blood Animation Methodology

This project recreates the CSS "goo" illusion for animated blood droplets by adapting the guidance from two CSS-Tricks articles:

- **Gooey Effect** (https://css-tricks.com/gooey-effect/)
- **Shape Blobbing in CSS** (https://css-tricks.com/shape-blobbing-css/)

The notes below explain the practical recipe we follow, why each step matters, and which parameters to tune when iterating on the hero animation.

## 1. Core Idea

1. Render every element that should blend (the bar, puddle, `gooTitleWrap`, and droplet animations) inside a container that is filtered with a shared SVG filter.
2. The SVG filter softens edges with `feGaussianBlur` and then raises the contrast dramatically with `feColorMatrix`. This erases most of the blur while letting overlapping pixels merge into a single organic blob.
3. The original shapes keep animating with regular CSS transforms. As they move, the filtered compositing hides hard edges and gives the “liquid” look without requiring path morphing.

Example filter definition:

```
<svg aria-hidden="true" width="0" height="0">
  <defs>
    <filter id="hero-svg-goo" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
      <feColorMatrix in="blur" type="matrix"
        values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7" result="goo" />
      <feBlend in="SourceGraphic" in2="goo" />
    </filter>
  </defs>
</svg>
```

- `stdDeviation` controls how far the blur stretches; higher values give softer merges but require the shapes to be thicker.
- The `feColorMatrix` diagonal values stay at `1` so colour hue is preserved. The bottom row `18 -7` is the “contrast + threshold” trick borrowed directly from the CSS-Tricks example.
- `feBlend` re-adds the original image on top so we do not lose details entirely when the drop is alone.

## 2. Structuring the DOM

1. Wrap the top bar, puddle, red `gooTitleWrap`, and all droplets that need to blend in a container such as `.gooLayer` and apply the filter via `filter: url('#hero-svg-goo')`.
2. Keep both the top bar and the bottom puddle ≤ 2 rem tall. The filter fattens silhouettes slightly, so starting narrow preserves the razor edge once the goo spreads out.
3. Ensure every element inside the goo layer shares the same solid colour (`#880808`). Any hue mismatch will show up as halos once the contrast snap kicks in.
4. Add a puddle ellipse at the bottom of the goo layer so falling droplets have something to merge into. A subtle horizontal “breathing” animation suggests ripple movement without growing taller than 2 rem.
5. Render each droplet as an SVG (or even a simple div) and animate its `top`/`transform` values with CSS keyframes. The shapes just need to remain partially overlapping with the bar while they “form”.
6. Render the same glyphs twice: once in `.gooLayer` tinted blood-red (`.titleLayerGoo`) with a subtle blur, and once in `.content` as the crisp white overlay. Because the markup and font metrics are identical, the two layers line up perfectly while the red clone provides the gooey background.
7. Keep the crisp foreground title in `.content` (z-index 10). Droplets pass behind it while the red clone underneath blends smoothly with the filter.

## 3. Animating the Droplets

Following the “Shape Blobbing” guidelines we keep animation simple:

1. Start each droplet at a very small `scaleY` so it appears to grow out of the bar (`transform: scale(1, 0.2)`).
2. Reach full size early (≤ 20 % progress) so the drop is at maximum volume as soon as it clears the bar.
3. Use a single keyframe timeline to translate the droplet downward. Introduce a plateau around 35–55 % progress so the drop slows near the centred title before accelerating away.
4. At the end of the cycle translate the droplet well below the viewport, then reset via the keyframe loop.

Sample keyframes (large droplet):

```
@keyframes drop-motion-large {
  0%  { top: -1.5rem; }
  35% { top: 40vh; }
  55% { top: 45vh; }
  100% { top: 110vh; }
}
```

Key tuning knobs:

- **Phase length** controls how long the drop clings to the bar before falling. We keep ~35 % of the animation in the build-up, 20 % hovering around the title, then release.
- **Easing** still uses a gravity-flavoured curve (`cubic-bezier(0.6, 0, 1, 1)`) so the final drop feels aggressive.
- **Offsets** (`animation-delay`) create a staggered rain of droplets.

## 4. Managing Performance & Drawbacks

- SVG filters are GPU-heavy. Keep the filtered region as small as practical and avoid unnecessary child elements inside it.
- The goo filter removes fine detail, so it is best suited for solid fills. Outline strokes or gradients will smear.
- Animated elements inside the same filtered container must share the same colour or the combined blob reveals seams.

## 5. Summary Checklist

- [ ] Add the goo filter `<svg>` once near the root of the page.
- [ ] Wrap the bar, puddle, `gooTitleWrap`, and droplet SVGs in a container with `filter: url('#hero-svg-goo')`.
- [ ] Keep goo shapes ≤ 2 rem tall and centred.
- [ ] Animate droplet translation with an early scale-up and a mid-flight plateau near the title.
- [ ] Render a crisp overlay (no filter) for readable typography and sharp highlights.
- [ ] Tune `stdDeviation` and the colour matrix threshold together with droplet thickness.

Use this checklist whenever you refactor the hero. It keeps the minimalist structure while preserving the dramatic liquid effect.
