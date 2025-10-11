# Animation Layout & Phases

The landing page is now entirely driven by the `BloodDroplet` stack. The component exposes three visual anchors that every droplet animation references:

1. **Top reservoir** – a crisp rectangle rendered outside the goo filter. Droplets are spawned above this bar and only become visible once they clear its lip.
2. **Centred title** – the red `titleGoo` clone and the white `titleCrisp` overlay occupy the middle of the viewport. Their shared `clamp(3rem, 16vw, 13rem)` font size defines how long droplets hover before breaking away.
3. **Bottom spill** – the lower bar rendered inside the filter provides the puddle that droplets stretch into on their final descent.

Because both the top and bottom bars come from `BloodDroplet`, the same `barHeight` is used as the reference thickness for every droplet keyframe. No additional layout variables are required.

## Phase Breakdown (`DropletShape`)

Each droplet is an absolute-positioned SVG that follows the `fall` keyframe defined in `src/components/BloodDroplet/DropletShape.tsx`. The table below lists the exact percentages and transformations used today:

| %    | `top` / `scaleY`                                         | Purpose |
| ---- | -------------------------------------------------------- | ------- |
| 0    | `top: -height`, `scaleY(0.96)`                           | Droplet appears above the bar and begins to swell slowly. |
| 16   | `top: -0.6 × height`, `scaleY(1.03)`                     | Stays near the reservoir while the gooey swell finishes. |
| 30   | `top: -0.12 × height`, `scaleY(1.06)`                    | Final slow crawl just before crossing the bar lip. |
| 48   | `top: 50% - height / 2`, `scaleY(0.9)`                   | Centre of the title; velocity is still linear for the “hover”. |
| 54   | `top: 50% + 0.1 × height`, `scaleY(0.95)`                | Releases from the lettering and hands off to the gravity easing. |
| 76   | `top: 100% + 0.3 × height`, `scaleY(1.22)`               | Mid-air stretch as the droplet accelerates. |
| 100  | `top: 100% + 0.6 × height`, `scaleY(1.32)`               | Exits below the viewport, ready to loop. |

Every transition except the hover section uses a cubic-bezier easing that starts gently and finishes aggressively. Matching curves are applied to the 0→48 % and 54→100 % segments, so the fall from the top pool and the drop from the title read with the same gravity profile.

When the first droplet finishes an animation loop it triggers the optional `onIteration` callback. The homepage (`BloodDropletScene`) listens to that event to regenerate offsets and scales, so each cycle uses a fresh pattern without waiting for manual interaction.

## Debugging Tips

- Because the animation relies on absolute `top` values, debugging is easiest with the browser DevTools “element box model” overlay—inspect a droplet and scrub the animation to see exact positions.
- To adjust the pause length, shift the 30 % or 54 % keyframes. Moving them closer together shortens the hover; spreading them apart slows the hand-off to the freefall.
- When experimenting, remember that the droplet height already includes its `scale` prop. For example, a scale of `0.5` halves the computed `height` used for all `top` calculations above.

These notes track the code as of this refactor. If you add new stages to the motion, update the table so we always have human-readable anchors for the easing tweaks.
