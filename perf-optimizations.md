# Performance Optimizations for Blood Droplet Animation

The current blood droplet animation has performance issues, especially on larger screens. The FPS drops significantly, leading to a laggy user experience.

## Problem Analysis

The primary performance bottlenecks are:

1.  **Inefficient Mask Drawing:** The current implementation draws circles directly onto a `PIXI.Graphics` object every frame for each droplet inside the text area. `PIXI.Graphics` objects are not optimized for frequent modifications, as each change can trigger a re-triangulation of the entire shape. This is the most likely cause of the performance issues.

2.  **`getBounds()` Calls (Fixed):** Previously, `getBounds()` was called on every frame for each droplet, which was a major performance hit. This has been addressed by caching the bounds in the `layout` function.

## Proposed Solutions

### 1. Use a Render Texture for the Mask

Instead of a `Graphics` object as a mask, we can use a `PIXI.Sprite` whose texture is a `PIXI.RenderTexture`.

**Implementation Steps:**

1.  **Create a `PIXI.RenderTexture`:** This texture will be the same size as the text area.
2.  **Create a "stamp" graphic:** This will be a small `PIXI.Graphics` object with a single circle, representing the area to be revealed by a droplet.
3.  **Create a `PIXI.Sprite` for the mask:** This sprite will use the render texture.
4.  **Apply the sprite as a mask:** `titleText.mask = maskSprite;`
5.  **In the animation loop (`tick` function):**
    *   For each droplet in the text area, set the position of the "stamp" graphic.
    *   Use `app.renderer.render(stamp, { renderTexture: myRenderTexture, clear: false });` to draw the stamp onto the render texture. The `clear: false` option is important, as it ensures that we are adding to the texture, not replacing it.

This approach is much more performant because rendering a small graphic to a texture is a highly optimized operation in WebGL.

### 2. Shader-based Masking (Advanced)

For the ultimate performance, a custom `PIXI.Filter` (a shader) could be written.

**Implementation Steps:**

1.  **Create a custom fragment shader:** This shader would take the droplet positions, sizes, and the text's texture as input.
2.  **In the shader:** For each pixel, calculate its distance from the droplets. If the distance is within a certain threshold, make the pixel transparent, revealing the red text underneath.
3.  **Pass droplet data as uniforms:** The droplet positions and sizes would be passed to the shader as an array of uniforms.

This method moves the masking logic entirely to the GPU, making it extremely fast. However, it's also significantly more complex to implement.

## Next Steps

I will proceed with implementing **Solution 1: Use a Render Texture for the Mask**. This should provide a significant performance boost and resolve the current lag issues.
