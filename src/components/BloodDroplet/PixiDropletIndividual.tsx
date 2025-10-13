"use client";

import type { Application, Graphics, Ticker } from "pixi.js";
import { useEffect, useRef } from "react";

/**
 * PHASE 5: Individual Droplet Reset
 *
 * Each droplet resets ITSELF when it completes animation.
 * No burst system - droplets are fully independent.
 * Goal: Simpler, more natural animation flow.
 */

// === ANIMATION CONFIGURATION ===
const NUM_DROPLETS = 6;
const ANIMATION_DURATION = 5.0; // seconds per loop
const TITLE_INTRO_DURATION = 1.2; // seconds

// === GOO EFFECT CONFIGURATION ===
// These control the "gooeyness" of the blood droplet merging effect
const BLUR_STRENGTH = 25; // Higher = more blur (original: 20, test had 16)
const BLUR_QUALITY = 10; // Higher = smoother blur (1-15)
const ALPHA_MULTIPLY = 20; // Alpha contrast multiply (original: 15)
const ALPHA_OFFSET = -5; // Alpha contrast offset (original: -5)

// === VISUAL DIMENSIONS ===
const BAR_HEIGHT = 62;
const DROPLET_BASE_WIDTH = 59;
const DROPLET_BASE_HEIGHT = 62;
const DROPLET_BASE_SIZE = 1.0; // Scale multiplier for all droplets

// === DROPLET BEHAVIOR ===
const DROPLET_MIN_SCALE = 0.5;
const DROPLET_MAX_SCALE = 1.0;
const DROPLET_MAX_DELAY = 1.25; // seconds
const DROPLET_MIN_OFFSET = 15; // percentage
const DROPLET_MAX_OFFSET = 75; // percentage

// === TEXT STYLING ===
const RED_LAYER_STROKE_WIDTH_MULTIPLIER = 0.03; // Larger stroke for red layer
const TIP_OFFSET_VARIATION = 10; // pixels (how much droplet shapes vary)

interface DropletState {
  graphic: Graphics;
  scale: number;
  elapsedTime: number;
  delay: number;
  offset: number;
  // Physics state
  y: number; // Current Y position
  velocity: number; // Current velocity (pixels per frame)
  phase: "spawn" | "freefall" | "impact" | "inText" | "exit" | "merge";
}

export default function PixiDropletIndividual() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    const mountNode = mountRef.current;

    let destroyed = false;
    let app: Application;
    let cleanup: (() => void) | null = null;

    const init = async () => {
      const PIXI = await import("pixi.js");
      if (destroyed) return;

      const {
        Application,
        Container,
        Graphics,
        Text,
        BlurFilter,
        ColorMatrixFilter,
      } = PIXI;

      app = new Application();
      await app.init({
        resizeTo: mountNode,
        autoDensity: true,
        antialias: true,
        background: "#101414",
      });

      mountNode.appendChild(app.canvas);

      // Goo container for filtered elements (red)
      const root = new Container();
      app.stage.addChild(root);

      // Crisp container for unfiltered white overlay (no filters)
      const crispContainer = new Container();
      app.stage.addChild(crispContainer);

      // Add filters
      const blurFilter = new BlurFilter({
        strength: BLUR_STRENGTH,
        quality: BLUR_QUALITY,
      });

      // Alpha blending filter for goo effect
      const alphaMatrix = new ColorMatrixFilter();
      alphaMatrix.matrix = [
        1,
        0,
        0,
        0,
        0, // Red channel (pass through)
        0,
        1,
        0,
        0,
        0, // Green channel (pass through)
        0,
        0,
        1,
        0,
        0, // Blue channel (pass through)
        0,
        0,
        0,
        ALPHA_MULTIPLY,
        ALPHA_OFFSET, // Alpha channel: multiply and offset
      ];

      // Color tint filter to convert white → #880808
      // #880808 = RGB(136, 8, 8) = RGB(0.533, 0.031, 0.031) in normalized form
      const colorTint = new ColorMatrixFilter();
      colorTint.matrix = [
        0.533,
        0,
        0,
        0,
        0, // Red: 136/255 = 0.533
        0,
        0.031,
        0,
        0,
        0, // Green: 8/255 = 0.031
        0,
        0,
        0.031,
        0,
        0, // Blue: 8/255 = 0.031
        0,
        0,
        0,
        1,
        0, // Alpha: keep unchanged
      ];

      root.filters = [blurFilter, alphaMatrix, colorTint];

      const topBar = new Graphics();
      root.addChild(topBar);

      const bottomBar = new Graphics();
      root.addChild(bottomBar);

      // Load Creepster font
      const loadWebFont = async (url: string) => {
        const existingLink = document.querySelector(`link[href="${url}"]`);
        if (!existingLink) {
          const link = document.createElement("link");
          link.href = url;
          link.rel = "stylesheet";
          document.head.appendChild(link);
        }
        // Wait for font to actually load
        if (document.fonts) {
          await document.fonts.load("900 48px Creepster");
          await new Promise((resolve) => setTimeout(resolve, 200));
        } else {
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      };
      await loadWebFont(
        "https://fonts.googleapis.com/css2?family=Creepster&display=swap",
      );

      // Calculate responsive font size: clamp(3rem, 30vw, 20rem)
      // CSS: clamp(3rem, 30vw, 20rem) = clamp(48px, 30vw, 320px)
      const vw = app.screen.width * 0.3;
      const fontSize = Math.min(Math.max(vw, 48), 320); // 3rem = 48px, 20rem = 320px

      // Calculate letter spacing for red layer (goo): clamp(0em, 0.5vw, 0.35em)
      const preferredSpacing = app.screen.width * 0.005; // 0.5vw
      const redLetterSpacing = Math.min(
        Math.max(0, preferredSpacing),
        fontSize * 0.35,
      );

      // Calculate letter spacing for white layer (crisp): clamp(0em, 0.5vw, 0.5em)
      const whiteLetterSpacing = Math.min(
        Math.max(0, preferredSpacing),
        fontSize * 0.5,
      );

      // Calculate stroke width
      const strokeWidth = Math.max(
        2,
        fontSize * RED_LAYER_STROKE_WIDTH_MULTIPLIER,
      );

      const devicePixelRatio = window.devicePixelRatio || 1;

      // Create title text (red layer - will be filtered)
      const titleText = new Text({
        text: "MURHA-\nKAVERIT",
        style: {
          fontFamily: "Creepster, cursive",
          fontSize,
          fill: 0xffffff, // White - will be tinted to #880808 by filter
          align: "center",
          lineHeight: 0.8 * fontSize,
          fontWeight: "900",
          letterSpacing: redLetterSpacing,
          stroke: { color: 0xffffff, width: strokeWidth },
          padding: strokeWidth * 2,
        },
      });
      titleText.roundPixels = true;
      titleText.resolution = devicePixelRatio;
      titleText.scale.set(0.88);
      titleText.alpha = 0;
      titleText.anchor.set(0.5);
      root.addChild(titleText);

      // Create crisp white text overlay (no filters)
      const crispTitleText = new Text({
        text: "murha-\nkaverit",
        style: {
          fontFamily: "Creepster, cursive",
          fontSize,
          fill: 0xffffff, // Pure white - no filter applied
          align: "center",
          lineHeight: 0.8 * fontSize,
          fontWeight: "400",
          letterSpacing: whiteLetterSpacing,
          stroke: { color: 0xffffff, width: strokeWidth },
          padding: strokeWidth * 2,
        },
      });
      crispTitleText.roundPixels = true;
      crispTitleText.resolution = devicePixelRatio;
      crispTitleText.scale.set(0.88);
      crispTitleText.alpha = 0;
      crispTitleText.anchor.set(0.5);
      // White text is rendered by CSS overlay, not PixiJS
      // crispContainer.addChild(crispTitleText);

      let titleIntroElapsed = 0;
      let titleIntroActive = true;

      // DEBUG: Create blue border to visualize text bounds (in crisp container to avoid filters)
      const debugBorder = new Graphics();
      crispContainer.addChild(debugBorder);

      // Detect mobile and adjust settings
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

      // Mobile: fewer droplets and adjusted blur for performance
      const mobileDropletCount = isMobile ? 4 : NUM_DROPLETS;

      // Adjust blur and alpha for mobile - less blur so droplets are visible
      if (isMobile) {
        blurFilter.strength = 15;
        alphaMatrix.matrix[14] = 10; // Reduce alpha multiply
        alphaMatrix.matrix[19] = -3; // Reduce alpha offset
      }

      // Create multiple droplets
      const droplets: DropletState[] = [];
      for (let i = 0; i < mobileDropletCount; i++) {
        const graphic = new Graphics();
        root.addChild(graphic);
        const scaleRange = DROPLET_MAX_SCALE - DROPLET_MIN_SCALE;
        droplets.push({
          graphic,
          scale: DROPLET_MIN_SCALE + Math.random() * scaleRange,
          elapsedTime: 0,
          delay: Math.random() * DROPLET_MAX_DELAY,
          offset: 0, // Will be set by resetDroplet based on text bounds
          y: 0,
          velocity: 0,
          phase: "spawn",
        });
      }

      const drawBar = (graphic: Graphics, width: number) => {
        graphic.clear();
        graphic.rect(0, 0, width, BAR_HEIGHT);
        graphic.fill({ color: 0xffffff }); // White - will be tinted to #880808 by filter
      };

      const drawDroplet = (graphic: Graphics, scale: number) => {
        const baseSize = DROPLET_BASE_SIZE;
        const w = DROPLET_BASE_WIDTH * scale * baseSize;
        const h = DROPLET_BASE_HEIGHT * scale * baseSize;

        // DRAMATIC variation
        const tipOffsetX = (Math.random() * 2 - 1) * TIP_OFFSET_VARIATION;
        const tipOffsetY = (Math.random() * 2 - 1) * TIP_OFFSET_VARIATION;

        graphic.clear();
        graphic.moveTo(tipOffsetX, tipOffsetY - h / 2);
        graphic.bezierCurveTo(
          -w * 0.3,
          -h * 0.2,
          -w * 0.45,
          h * 0.1,
          -w * 0.4,
          h * 0.35,
        );
        graphic.bezierCurveTo(
          -w * 0.25,
          h * 0.5,
          w * 0.25,
          h * 0.5,
          w * 0.4,
          h * 0.35,
        );
        graphic.bezierCurveTo(
          w * 0.45,
          h * 0.1,
          w * 0.3,
          -h * 0.2,
          tipOffsetX,
          tipOffsetY - h / 2,
        );
        graphic.fill({ color: 0xffffff, alpha: 1 });
      };

      // Reset individual droplet
      const resetDroplet = (state: DropletState, _dropletIndex: number) => {
        const scaleRange = DROPLET_MAX_SCALE - DROPLET_MIN_SCALE;
        state.scale = DROPLET_MIN_SCALE + Math.random() * scaleRange;
        state.elapsedTime = 0;
        state.delay = Math.random() * DROPLET_MAX_DELAY;

        // Calculate droplet position based on actual text bounds
        const textBounds = titleText.getBounds();
        const textLeft = textBounds.x;
        const textRight = textBounds.x + textBounds.width;
        const textWidth = textBounds.width;

        // Estimate character width to avoid rightmost chars
        // Creepster font is roughly 0.6x fontSize wide per character
        const charWidth = fontSize * 0.6;

        // Random position within text bounds
        // Left: 5% margin to avoid leftmost chars
        // Right: subtract charWidth to avoid rightmost chars (-, T)
        const leftMargin = textWidth * 0.05;
        const minX = textLeft + leftMargin;
        const maxX = textRight - charWidth;
        state.offset = minX + Math.random() * (maxX - minX);

        // KEY: clear() + redraw
        drawDroplet(state.graphic, state.scale);
      };

      const layout = () => {
        const { width, height } = app.screen;
        const offset = 100;
        drawBar(topBar, width + offset * 2);
        drawBar(bottomBar, width + offset * 2);
        topBar.position.set(-offset, 0);
        bottomBar.position.set(-100, height - BAR_HEIGHT);

        // Position text at center + 31px offset to match CSS padding-top: 62px
        // (62px / 2 = 31px because anchor is at 0.5)
        const textY = height / 2 + 31;
        titleText.x = width / 2;
        titleText.y = textY;
        crispTitleText.x = width / 2;
        crispTitleText.y = textY;

        // DEBUG: Draw blue border around text bounds
        const textBounds = titleText.getBounds();
        debugBorder.clear();
        debugBorder.rect(
          textBounds.x,
          textBounds.y,
          textBounds.width,
          textBounds.height,
        );
        debugBorder.stroke({ color: 0x0000ff, width: 3 }); // Blue, 3px wide
      };

      // Layout first, THEN initialize droplets (so text bounds are correct)
      layout();
      droplets.forEach((state, i) => {
        resetDroplet(state, i);
      });

      const tick = (ticker: Ticker) => {
        const dt = ticker.deltaTime / 60;
        const { width, height } = app.screen;

        // Animate title intro (both red and white text)
        if (titleIntroActive) {
          titleIntroElapsed += dt;
          const progress = Math.min(
            titleIntroElapsed / TITLE_INTRO_DURATION,
            1,
          );
          const eased = 1 - (1 - progress) ** 3;
          const scale = 0.88 + eased * 0.12;
          titleText.scale.set(scale);
          titleText.alpha = eased;
          crispTitleText.scale.set(scale);
          crispTitleText.alpha = eased;

          if (progress >= 1) {
            titleIntroActive = false;
            titleText.scale.set(1);
            titleText.alpha = 1;
            crispTitleText.scale.set(1);
            crispTitleText.alpha = 1;
          }
        }

        droplets.forEach((state, index) => {
          state.elapsedTime += dt;
          const elapsed = state.elapsedTime - state.delay;

          if (elapsed < 0) {
            state.graphic.alpha = 0;
            return;
          }

          // Calculate droplet dimensions (per-droplet size!)
          const baseSize = 1.5;
          const dropletHeight = DROPLET_BASE_HEIGHT * state.scale * baseSize;
          const halfHeight = dropletHeight / 2;

          // Get collision surfaces
          const topBarBottom = BAR_HEIGHT;
          const textBounds = titleText.getBounds();
          const textTop = textBounds.y;
          const textBottom = textBounds.y + textBounds.height;
          const bottomPuddleSurface = height - BAR_HEIGHT;

          // Calculate droplet edges (collision points)
          const dropletBottom = state.y + halfHeight;
          const dropletTop = state.y - halfHeight;

          // === VELOCITY-BASED PHYSICS WITH COLLISION DETECTION ===

          // Physics constants
          const GRAVITY = 0.8; // Acceleration in freefall (pixels/frame²)
          const MAX_VELOCITY = 12; // Terminal velocity
          const IMPACT_DECEL = 0.85; // Deceleration factor when hitting surface (85% dampening)
          const TEXT_FRICTION = 0.92; // Friction inside text (92% of velocity retained)
          const EXIT_ACCEL = 0.15; // Acceleration when exiting (gaining speed)

          const phase = (elapsed % ANIMATION_DURATION) / ANIMATION_DURATION;

          // Reset on new cycle
          if (phase < 0.01 && state.phase === "merge") {
            state.phase = "spawn";
            state.y = topBarBottom - halfHeight - 10;
            state.velocity = 0;
            resetDroplet(state, index);
          }

          // SPAWN PHASE: Emerge from top bar
          if (state.phase === "spawn") {
            const spawnProgress = Math.min(elapsed / 0.5, 1);
            state.y = topBarBottom - halfHeight - 10 + spawnProgress * 50;
            state.velocity = spawnProgress * 2; // Gentle initial velocity
            state.graphic.scale.set(Math.max(0.3, spawnProgress) * state.scale);
            state.graphic.alpha = 1;

            if (spawnProgress >= 1) {
              state.phase = "freefall";
            }
          }

          // COLLISION DETECTION
          const isBottomTouchingText =
            dropletBottom >= textTop && dropletBottom <= textTop + 5;
          const isInsideText =
            dropletBottom > textTop + 5 && dropletTop < textBottom - 5;
          const isTopExitingText =
            dropletTop >= textBottom - 5 && dropletTop <= textBottom + 5;
          const isBottomTouchingPuddle =
            dropletBottom >= bottomPuddleSurface - 5;

          // STATE TRANSITIONS based on collision
          if (state.phase === "freefall" && isBottomTouchingText) {
            state.phase = "impact";
          } else if (state.phase === "impact" && isInsideText) {
            state.phase = "inText";
          } else if (state.phase === "inText" && isTopExitingText) {
            state.phase = "exit";
          } else if (
            state.phase === "exit" &&
            !isInsideText &&
            dropletTop > textBottom
          ) {
            state.phase = "freefall";
          } else if (state.phase === "freefall" && isBottomTouchingPuddle) {
            state.phase = "merge";
          }

          // APPLY PHYSICS based on current phase
          if (state.phase === "freefall") {
            // Accelerate with gravity
            state.velocity = Math.min(state.velocity + GRAVITY, MAX_VELOCITY);
            state.graphic.scale.set(state.scale);
            state.graphic.alpha = 1;
          } else if (state.phase === "impact") {
            // Decelerate when hitting text
            state.velocity *= IMPACT_DECEL;
            state.graphic.scale.set(state.scale);
            state.graphic.alpha = 1;
          } else if (state.phase === "inText") {
            // Slow movement with friction
            state.velocity *= TEXT_FRICTION;
            // Gentle scale variation
            const textProgress =
              (dropletBottom - textTop) / (textBottom - textTop);
            const scaleVariation = 1 + Math.sin(textProgress * Math.PI) * 0.1;
            state.graphic.scale.set(state.scale * scaleVariation);
            state.graphic.alpha = 1;
          } else if (state.phase === "exit") {
            // Gradually accelerate when exiting
            state.velocity += EXIT_ACCEL;
            state.graphic.scale.set(state.scale);
            state.graphic.alpha = 1;
          } else if (state.phase === "merge") {
            // Merge into puddle
            state.velocity *= 0.8;
            const mergeProgress =
              (elapsed % ANIMATION_DURATION) / ANIMATION_DURATION;
            const mergeFade = Math.max(0, 1 - (mergeProgress - 0.88) / 0.12);
            state.graphic.alpha = mergeFade;
            state.graphic.scale.set(state.scale * (1 + (1 - mergeFade) * 0.5));
          }

          // Update position with velocity
          state.y += state.velocity * dt * 60; // Normalize by 60fps

          // Apply position
          state.graphic.x = state.offset;
          state.graphic.y = state.y;
        });
      };

      const resizeHandler = () => {
        layout();
      };

      app.ticker.add(tick);
      app.renderer.on("resize", resizeHandler);

      cleanup = () => {
        app.ticker.remove(tick);
        app.renderer.off("resize", resizeHandler);
        if (mountNode.contains(app.canvas)) {
          mountNode.removeChild(app.canvas);
        }
        app.destroy(true, { children: true });
      };
    };

    init();

    return () => {
      destroyed = true;
      if (cleanup) {
        cleanup();
      }
    };
  }, []);

  return <div ref={mountRef} className="w-full h-full pointer-events-none" />;
}
