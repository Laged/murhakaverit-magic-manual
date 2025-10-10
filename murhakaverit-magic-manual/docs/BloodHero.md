# Blood Hero Architecture

This document explains how the hero scene is organised, how the SVG goo filter blends DOM elements with the animated blood droplets, and what to adjust when extending the effect.

## 1. Component Layout

HeroSVG mounts ContainerHeroSVG. Inside it we have:

- **GooFilterDefs** – the single `<svg>` filter definition.
- **.container** – the viewport wrapper.
  - **.gooLayer** – holds bar, droplets, puddle, and any goo-only children.
    - **.gooCenter** – absolute-centred stack used for `gooTitleWrap` and future goo elements.
  - **.bar** – a slim crisp top edge rendered outside the filter.
  - **.dropsCrisp** – optional masked overlays (e.g. crisp droplets) with an absolute **.crispCenter** helper.
  - **.content** – foreground layer (z-index 10) containing **.contentCenter**, which keeps the white title perfectly centred.
- **ContainerHeroSVG.BloodDroplet** – exported helper for consumers who want additional droplets.

## 2. Goo Layer Contents

Inside `.gooLayer` we render:

1. `.gooBar` – a 1.5 rem rectangle hugging the top edge.
2. `.gooPool` – a shallow ellipse just below the bar to provide volume without exceeding the slim lip.
3. `.gooPuddle` – a 2 rem ellipse at the bottom that breathes horizontally so falling drops merge naturally.
4. `BloodDropletSVG` instances with `variant="liquid"` – animated droplets that grow out of the bar, pause near the title, then accelerate downward.
5. A red `TitleHeroSVG` clone inside `.gooCenter` tinted with `.titleLayerGoo`, which mirrors the crisp glyphs exactly but adds a light blur so droplets can merge into the lettering without shifting its outline.

Every shape in this layer uses `#880808`, so the colour matrix merges them into one blob during the filter pass.

## 3. Blood Droplet Component

`BloodDropletSVG` accepts `size`, `delay`, `position`, and an optional `variant`:

- `variant="liquid"` uses the goo-forming keyframes and belongs in `.gooLayer`.
- `variant="shape"` keeps the crisp outline for overlays in `.dropsCrisp`.

Key CSS hooks include:

- `.dropLarge` / `.dropSmall` set width and animation duration (6 s vs 4 s).
- `@keyframes drop-motion-*` includes a 35–55 % plateau so droplets slow near the centred title before releasing.
- `@keyframes drop-form` / `drop-form-goo` now reach full scale by 20 % progress, ensuring drops hit maximum volume right after leaving the bar.

## 4. Foreground Layer

Above the goo layer we render:

1. `.bar` – the unfiltered top bar that masks any halo.
2. `.dropsCrisp` – optional crisp clones of droplets or overlays, masked so they only appear below the 1.5 rem lip.
3. `.content` / `.contentCenter` – the white title and decorative SVGs, centred horizontally and vertically so the text remains perfectly aligned while droplets travel behind it. The red `gooTitleWrap` beneath ensures a soft, gooey background surrounds the lettering.

Because `.content` sits at z-index 10, droplets visibly pass behind the text while it stays readable.

## 5. Prop Surface

`ContainerHeroSVG` exposes:

- `gooChildren` – rendered inside `.gooCenter` after the static goo shapes.
- `crispChildren` – rendered inside `.crispCenter` within `.dropsCrisp`.
- `children` – rendered inside `.content` (usually the centred title stack).
- `extraDroplets` – appended to `.dropsCrisp` for additional overlays.

## 6. Extending the Blend

To include additional elements:

1. Place readable text in `.contentCenter` so it stays above the goo.
2. Add a darker clone via `gooChildren` if you want it to participate in the goo effect.
3. Adjust the droplet plateau timings if new elements sit higher or lower than the main title.
4. Keep new goo shapes within the 2 rem height budget and the shared `#880808` colour.

## 7. Implementation Notes

- The goo filter values (`18 -7`) come from CSS-Tricks and balance smooth merging with retained volume.
- Keep `.gooLayer` minimal; anything rendered there incurs the expensive blur.
- The breathing puddle only scales on the X axis, so it respects the 2 rem height cap.
- When tweaking droplet speeds, preserve the plateau so the slowdown around the title stays noticeable.

Follow this layout whenever refining the hero. It balances readability (sharp overlays), drama (gooey merge), and future expansion without complicating the component tree.
