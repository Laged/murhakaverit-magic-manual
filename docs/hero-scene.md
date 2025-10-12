# Hero Scene Overview

The landing hero renders a gooey blood animation with progressive enhancement. `src/app/page.tsx:8` mounts `BloodDropletScene` first, followed by the Graniitti Sauna card, so every rendering path begins inside that scene component.

## Rendering Modes
- `BloodDropletScene` watches WebGL support via `useWebGLSupport` (`src/hooks/useWebGLSupport.ts:5`) and prefers-reduced-motion via a media query. The decision tree lives at `src/components/BloodDropletScene.tsx:194-301`.
- When reduced motion is requested, the component returns a static `CrispBloodDroplet` with the goo title faded (`src/components/BloodDropletScene.tsx:195-222`). No droplets are created in this branch.
- While WebGL capability is still being detected, a centered crisp title is rendered (`src/components/BloodDropletScene.tsx:233-243`).
- If WebGL is available, `PixiDropletCanvas` renders the droplets on a `<canvas>` and the crisp DOM title stays on top (`src/components/BloodDropletScene.tsx:244-263`). The Pixi canvas pauses whenever the hero leaves the viewport (`isPaused` at line 252 and the ticker control in `src/components/BloodDroplet/PixiDropletCanvas.tsx:86-94`).
- Without WebGL, the CSS fallback pushes `DropletShape` instances through `CrispBloodDroplet` (`src/components/BloodDropletScene.tsx:264-301`). The first droplet passes `onIteration` to reshuffle the pattern in sync with the CSS loop (`src/components/BloodDropletScene.tsx:270-279`).

## Droplet Layout & Randomisation
- Horizontal anchors sit at 35–65% with ±5% jitter, clamped between 30% and 70% (`src/components/BloodDropletScene.tsx:15-41`). The generator also assigns per-drop scale and delay (`src/components/BloodDropletScene.tsx:46-55`).
- Breakpoints expose three, four, five, or seven droplets and shrink the scale range to 60%, 75%, 90%, or 100% of the original respectively (`src/components/BloodDropletScene.tsx:66-115`).
- An IntersectionObserver pauses both Pixi and CSS animations when the hero is mostly off-screen (`src/components/BloodDropletScene.tsx:149-165`).

## Goo Container & Theming
- `CrispBloodDroplet` encapsulates the goo filter definition, red bars, and theme tokens (`src/components/BloodDroplet/CrispBloodDroplet.tsx:55-139`). It detects iOS Safari and swaps the SVG filter for a CSS filter stack when necessary (`src/components/BloodDroplet/CrispBloodDroplet.tsx:10-22,52-65`).
- The twin bars render slightly wider than the viewport and reuse the configurable `barHeight` so Pixi and CSS droplets line up (`src/components/BloodDroplet/CrispBloodDroplet.tsx:114-121`).
- Title styling, letter-spacing clamps, and shared font configuration live in `src/components/BloodDroplet/BloodDroplet.module.css:1-58`.

## CSS Fallback Animation
- Each `DropletShape` reuses the same SVG path, scales it, and exposes CSS custom properties to the keyframes (`src/components/BloodDroplet/DropletShape.tsx:7-57`).
- The `drop-fall` keyframes run for nine seconds: scale in over the top bar (0–10%), fall to 30vh (20%), hover around 55vh (70%), exit the frame (80%), then overshoot to 110vh (100%) using easing curves tuned per segment (`src/components/BloodDroplet/DropletShape.module.css:1-34`).
- Animation pausing uses `animationPlayState`, so the IntersectionObserver can freeze droplets instantly (`src/components/BloodDroplet/DropletShape.tsx:32-43`).

## Pixi Renderer
- `PixiDropletRenderer` builds the same scene graph inside Pixi: blur + alpha + tint filters match the SVG goo effect (`src/components/BloodDroplet/PixiDropletRenderer.ts:90-148`). The text starts white and is tinted red by the color matrix (`src/components/BloodDroplet/PixiDropletRenderer.ts:184-206`).
- Horizontal spread mirrors the CSS fallback but clamps between 35% and 60% with ±3% jitter to avoid the hyphen (`src/components/BloodDroplet/PixiDropletRenderer.ts:340-361,440-451`).
- The animation timeline performs the same beats in code: scale in, descend to 40%, linger through 60%, then drop out and reset (`src/components/BloodDroplet/PixiDropletRenderer.ts:457-478`). Droplet scale re-randomises every loop (`src/components/BloodDroplet/PixiDropletRenderer.ts:449-450`).
- Device capability drives blur quality presets (`src/components/BloodDroplet/PixiDropletRenderer.ts:65-76`), and the renderer can downgrade automatically if FPS drops too far (`src/components/BloodDroplet/PixiDropletRenderer.ts:363-399`).
- Updating droplet counts swaps the entire Pixi scene (`src/components/BloodDroplet/PixiDropletRenderer.ts:501-505`), so call sites should avoid thrashing the count each frame.

## Visibility & Motion Controls
- The hero passes `isPaused` down both rendering paths (`src/components/BloodDropletScene.tsx:227-278`), ensuring the Pixi ticker stops and CSS animations pause when the observer reports the scene as hidden.
- Reduced-motion users never load Canvas or SVG filters, and WebGL support is resolved before instantiating Pixi (`src/hooks/useWebGLSupport.ts:5-28`).
