# Mobile Responsiveness Notes

The homepage relies on a handful of responsive constants rather than breakpoint-heavy styles. Update these values if the scene needs to shift for new devices.

## 1. Typography & Layout
- Both title layers share the same transform so they stay aligned on all screens (`src/components/BloodDroplet/BloodDroplet.module.css:9-58`). Font size clamps to `clamp(3rem, 30vw, 15rem)` and letter spacing tightens to `clamp(0em, 0.5vw, 0.35em)` for the goo layer and `clamp(0em, 0.8vw, 0.35em)` for the crisp layer.
- `BloodDropletScene` pins the hero to `95vh` with `w-screen` (`src/components/BloodDropletScene.tsx:229-231`). Adjust this height if the viewport should expose content beneath the fold on mobile.
- The red bars in `CrispBloodDroplet` extend 20px past each edge, ensuring the blur remains filled even on tall notched devices (`src/components/BloodDroplet/CrispBloodDroplet.tsx:114-121`).

## 2. Droplet Distribution
- Horizontal anchors sit at 35–65% with ±5% jitter and are clamped to 30–70% (`src/components/BloodDropletScene.tsx:15-41`). That range keeps droplets centred over “murha-” while accommodating narrow screens.
- Breakpoint logic caps the droplet count at 3 / 4 / 5 / 7 for ≤480 px, ≤768 px, ≤1024 px, and larger viewports (`src/components/BloodDropletScene.tsx:66-71`). The responsive scale multiplier mirrors those thresholds at 0.6 / 0.75 / 0.9 / 1 (`src/components/BloodDropletScene.tsx:73-78`).
- Droplet metadata regenerates on hydration and whenever width watchers fire (`src/components/BloodDropletScene.tsx:98-147`). `DELAY_INCREMENT` is 0.25 s, so new droplets slot naturally into the stagger (`src/components/BloodDropletScene.tsx:20,48-55`).

## 3. Animation Timing
- CSS droplets animate for nine seconds total, scaling in over the top bar, pushing to 30vh, hovering near 55vh, then exiting at 110vh (`src/components/BloodDroplet/DropletShape.module.css:11-34`).
- Pixi droplets follow the same timeline in code, re-randomising their x-position and scale only when a loop completes (`src/components/BloodDroplet/PixiDropletRenderer.ts:440-478`).
- IntersectionObserver pauses both renderers when the hero is below the fold, which prevents background tabs from wasting battery (`src/components/BloodDropletScene.tsx:149-165`).

## 4. Accessibility & Fallbacks
- Users with reduced motion receive a static render with the red title at 50% opacity (`src/components/BloodDropletScene.tsx:195-222`).
- iOS Safari skips the SVG goo filter in favour of a CSS drop-shadow stack (`src/components/BloodDroplet/CrispBloodDroplet.tsx:10-22,52-65`), so layout stays identical even when GPU filters are unavailable.
- WebGL detection runs once per mount before Pixi is imported, avoiding unnecessary bundle weight on devices that will fall back to CSS (`src/hooks/useWebGLSupport.ts:5-28`).

Keep these constants in sync with the animation code; changing base offsets or keyframe percentages in one layer without updating the other leads to visible desyncs on phones, where the tighter viewport makes discrepancies obvious.
