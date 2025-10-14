# Performance Optimization Learnings

This document summarizes the key learnings from optimizing the blood droplet animation.

## Initial Problem & Root Cause

The animation's frame rate dropped significantly over time, creating a laggy user experience. Performance profiling revealed that the primary bottlenecks were the `triangulate` and `buildPolygon` operations within the PixiJS rendering engine.

This was caused by the method used for the text reveal effect. A single, ever-growing `PIXI.Graphics` object was used as a mask for the title text. In every animation frame, new circle shapes were drawn onto this `Graphics` object as droplets passed through the text. This forced the renderer to re-calculate and re-triangulate an increasingly complex vector shape on every single frame, a computationally expensive task that saturated the GPU.

## Key Learning: The `RenderTexture` Solution

The correct and most impactful solution was to replace the dynamic `PIXI.Graphics` mask with a `PIXI.RenderTexture`.

1.  **The Old Way (Slow):** `mask.drawCircle(...)` on every frame.
2.  **The New Way (Fast):** Create a small, reusable `PIXI.Graphics` circle object called a "stamp". On every frame, render this simple stamp onto a `PIXI.RenderTexture` using `app.renderer.render({ container: stamp, target: renderTexture, clear: false })`. The `RenderTexture` is then used as the sprite mask.

This approach is significantly more performant because rendering a small, simple shape to a texture is a highly optimized GPU operation. It avoids the expensive re-triangulation of a complex vector shape and keeps the scene graph complexity constant.

### Failed Attempts

Early attempts to fix rendering issues by restructuring the scene graph failed because they misunderstood the rendering pipeline:

*   Moving the masked text object out of a container that had a `ColorMatrixFilter` applied to it fixed the masking but broke the text's color.
*   Applying the filter to a parent container and the mask to a child object is a known problematic pattern in PixiJS that resulted in the text becoming invisible.
*   These attempts highlighted the importance of understanding how filters and masks interact within the PixiJS scene graph.

## For the Future: Evaluating a Direct WebGL Implementation

While the animation is now highly performant using PixiJS, a future consideration for projects with even more extreme performance requirements could be a direct WebGL implementation.

*   **Potential Benefits:** Bypassing a framework like PixiJS offers complete control over the rendering pipeline. This allows for fine-tuned optimizations, such as custom shaders (GLSL) and buffer management, tailored specifically to the animation's needs. This could, in theory, eliminate every last bit of framework overhead.

*   **Performance Implications & Trade-offs:** For this specific project, the primary performance bottleneck was not the PixiJS framework itself, but an incorrect usage of one of its features. Now that the implementation is corrected, the animation is very efficient, and the remaining performance costs are dominated by standard browser DOM layout and styling. Migrating to raw WebGL would be a massive increase in code complexity for likely marginal or no perceptible performance gain in this context.

*   **Conclusion:** A direct WebGL implementation should be considered a premature optimization at this stage. It would only become a viable option if the animation's complexity were to increase by an order of magnitude (e.g., thousands of simultaneous, complex interacting objects) and PixiJS itself was proven to be the bottleneck.
