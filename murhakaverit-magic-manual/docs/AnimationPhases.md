# Animation Phases

Each droplet loop is tiled into three phases so the motion never “blinks” when the CSS animation restarts. Large drops run for 6 s, small drops for 4 s, but both share the same timeline proportions and easing. All animations use `animation-fill-mode: both`, so the final frame holds until the next loop begins.

| Phase | Time Slice (large drop) | What Happens | Keyframes |
| --- | --- | --- | --- |
| 1. Formation | 0% → 20% | The droplet emerges from the 1.5 rem top bar. Scale jumps from 25 % to 85 % by 10 %, then reaches 100 % by 20 %. Opacity fades in between 0–6 % so the reset is invisible. | `drop-form`, `drop-form-goo`, early portion of `drop-motion-large` |
| 2. Merge + Drift | 20% → 55% | At full size, the droplet eases through the `gooTitleWrap`. Motion slows between 35–55 % so the gooey halo around the text can merge smoothly while the crisp title (z-index 10) stays readable above it. | mid portion of `drop-motion-large` |
| 3. Release | 55% → 100% | Gravity takes over, pulling the droplet toward the bottom puddle. Opacity fades to 0 between 90–100 % just as the droplet slips below the viewport, preventing any blink when the loop restarts. | tail portion of `drop-motion-large` |

Small droplets follow the same phase percentages, joining the stream slightly later (8 %) to clear the bar cleanly.

The bottom puddle breathes horizontally (`puddle-breathe`) to hint at impact ripples. During Phase 2 the red title clone (`.titleLayerGoo`) sits directly beneath the crisp lettering, so droplets can merge into the same glyph outlines without disturbing the white text on top.
