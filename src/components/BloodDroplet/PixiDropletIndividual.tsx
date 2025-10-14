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
//const ANIMATION_DURATION = 5.0; // seconds per loop
const TITLE_INTRO_DURATION = 1.2; // seconds

// === GOO EFFECT CONFIGURATION ===
// These control the "gooeyness" of the blood droplet merging effect
const BLUR_STRENGTH = 20; // Higher = more blur (original: 20, test had 16)
const BLUR_QUALITY = 10; // Higher = smoother blur (1-15)
const ALPHA_MULTIPLY = 20; // Alpha contrast multiply (original: 15)
const ALPHA_OFFSET = -5; // Alpha contrast offset (original: -5)

// === VISUAL DIMENSIONS ===
const BAR_HEIGHT = 62;
const DROPLET_BASE_WIDTH = 59;
const DROPLET_BASE_HEIGHT = 62;
const DROPLET_BASE_SIZE = 1.0; // Scale multiplier for all droplets

// === DROPLET BEHAVIOR ===
const DROPLET_MIN_SCALE = 0.7;
const DROPLET_MAX_SCALE = 1.0;
const DROPLET_MAX_DELAY = 1.25; // seconds
const _DROPLET_MIN_OFFSET = 15; // percentage (unused, legacy)
const _DROPLET_MAX_OFFSET = 75; // percentage (unused, legacy)

// === TEXT STYLING ===
const RED_LAYER_STROKE_WIDTH_MULTIPLIER = 0.03; // Larger stroke for red layer
const TIP_OFFSET_VARIATION = 10; // pixels (how much droplet shapes vary)

// === PHYSICS CONSTANTS (TUNE THESE!) ===
const GRAVITY = 0.8; // Acceleration in freefall (pixels/frame²)
const MAX_VELOCITY = 12; // Terminal velocity (max fall speed)
const MIN_VELOCITY = 1; // Minimum velocity - ensures droplets always fall
const DEBUG_SHOW_BOUNDING_BOXES = true; // Show droplet bounding boxes for debugging

// === FLUID PHYSICS - FRICTION CURVES (TUNE THESE!) ===
// Entry zone (0.0 - 0.1): High impact friction when entering fluid
const ENTRY_FRICTION = 0.5; // Strong impact deceleration (50% velocity retained)
const ENTRY_ZONE_END = 0.1; // First 10% of fluid

// Middle zone (0.1 - 0.9): Linear steady movement through fluid
const MIDDLE_FRICTION = 1.02; // Moderate friction (102% = slight acceleration)

// Exit zone (0.9 - 1.0): Hanging/dripping effect when leaving fluid
const EXIT_FRICTION = 0.5; // Strong hanging friction (50% velocity retained)
const EXIT_ZONE_START = 0.9; // Last 10% of fluid

// === BOTTOM BAR PUDDLE FRICTION (DRAMATIC SPLASH!) ===
const BOTTOM_ENTRY_FRICTION = 0.3; // VERY strong impact (30% velocity retained - dramatic splash!)
const BOTTOM_ENTRY_ZONE_END = 0.15; // First 15% of puddle (longer impact zone)
const BOTTOM_MIDDLE_FRICTION = 0.85; // Slow sinking through puddle
const BOTTOM_EXIT_FRICTION = 0.7; // Deep in puddle, slowing down further
const BOTTOM_EXIT_ZONE_START = 0.6; // Last 40% of puddle

// === DROPLET SQUASH & STRETCH (TUNE THESE!) ===
const FREEFALL_STRETCH_SCALE = 1.3; // Y-scale during freefall (1.3 = 30% taller)
const EXIT_STRETCH_SCALE = 1.2; // Y-scale during exit from fluid (1.2 = 20% taller)
const ENTRY_SQUASH_SCALE = 0.7; // Y-scale on entry/impact (0.7 = 30% shorter/compressed)
const SCALE_LERP_SPEED = 0.15; // How fast to interpolate scale changes (0.15 = 15% per frame)

// === MOBILE DEVICE SCALING (TUNE THESE!) ===
const MOBILE_DROPLET_SCALE = 0.5; // Scale down droplet min size on mobile
const MOBILE_DROPLET_WIDTH_SCALE = 0.7; // Width scaling for mobile droplets
const MOBILE_DROPLET_HEIGHT_SCALE = 1.0; // Height scaling for mobile droplets
const MOBILE_PHYSICS_SCALE = 0.5; // Overall physics size calculation scale
const MOBILE_GRAVITY_SCALE = 0.5; // Reduce gravity on mobile
const MOBILE_SPAWN_VELOCITY_SCALE = 0.1; // Slower spawn velocity on mobile
const MOBILE_FLUID_VELOCITY_SCALE = 0.3; // Slower movement through fluids on mobile
const MOBILE_MERGE_VELOCITY_SCALE = 0.1; // Slower merge on mobile

interface DropletState {
  graphic: Graphics;
  debugBox: Graphics; // Visual bounding box for debugging
  scale: number;
  elapsedTime: number;
  delay: number;
  offset: number;
  // Physics state
  y: number; // Current Y position
  velocity: number; // Current velocity (pixels per frame)
  phase: "spawn" | "freefall" | "inTopBar" | "inText" | "inBottomBar" | "merge";
  // Animation state
  currentYScale: number; // Current Y-scale for smooth interpolation
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
        blurFilter.strength = 20;
        alphaMatrix.matrix[14] = 10; // Reduce alpha multiply
        alphaMatrix.matrix[19] = -3; // Reduce alpha offset
      }

      // Create multiple droplets
      const droplets: DropletState[] = [];
      for (let i = 0; i < mobileDropletCount; i++) {
        const graphic = new Graphics();
        root.addChild(graphic);

        // Create debug bounding box (added to crisp container to avoid filters)
        const debugBox = new Graphics();
        crispContainer.addChild(debugBox);

        const scaleRange = DROPLET_MAX_SCALE - DROPLET_MIN_SCALE;
        const minScale = isMobile
          ? DROPLET_MIN_SCALE * MOBILE_DROPLET_SCALE
          : DROPLET_MIN_SCALE;
        droplets.push({
          graphic,
          debugBox,
          scale: minScale + Math.random() * scaleRange,
          elapsedTime: 0,
          delay: Math.random() * DROPLET_MAX_DELAY,
          offset: 0, // Will be set by resetDroplet based on text bounds
          y: 0,
          velocity: 0,
          phase: "spawn",
          currentYScale: 1.0, // Start at normal scale
        });
      }

      const drawBar = (graphic: Graphics, width: number) => {
        graphic.clear();
        graphic.rect(0, 0, width, BAR_HEIGHT);
        graphic.fill({ color: 0xffffff }); // White - will be tinted to #880808 by filter
      };

      const drawDroplet = (graphic: Graphics, scale: number) => {
        const baseSize = isMobile
          ? DROPLET_BASE_SIZE * MOBILE_DROPLET_WIDTH_SCALE
          : DROPLET_BASE_SIZE;
        const baseW = isMobile
          ? DROPLET_BASE_WIDTH * MOBILE_DROPLET_WIDTH_SCALE
          : DROPLET_BASE_WIDTH;
        const baseH = isMobile
          ? DROPLET_BASE_HEIGHT * MOBILE_DROPLET_HEIGHT_SCALE
          : DROPLET_BASE_HEIGHT;
        const w = baseW * scale * baseSize;
        const h = baseH * scale * baseSize;

        // Organic variation
        const tipOffsetX = (Math.random() * 2 - 1) * TIP_OFFSET_VARIATION * 0.7;
        const tipOffsetY = (Math.random() * 2 - 1) * TIP_OFFSET_VARIATION * 0.7;
        const neckLength = 2.6 + Math.random() * 0.2; // even longer, thinner neck
        const bellyBulge = 0.65 + Math.random() * 0.15; // wider belly
        const bellyDrop = 0.15 + Math.random() * 0.05; // pushes the belly lower
        const asym = (Math.random() * 2 - 1) * 0.12; // small asymmetry

        graphic.clear();

        // Tip of droplet (thin neck start)
        graphic.moveTo(tipOffsetX, tipOffsetY - h * 0.5 * neckLength);

        // Left side — narrow neck, aggressive outward curve
        graphic.bezierCurveTo(
          -w * 0.01, // control1 x — keep neck razor-thin
          -h * 0.1, // control1 y — slightly below tip
          -w * 1.0 * bellyBulge, // control2 x — push far outward
          h * (0.3 + bellyDrop), // control2 y — push curvature lower
          -w * 0.6 * bellyBulge, // end x — lower left point of belly
          h * (0.6 + bellyDrop), // end y
        );

        // Bottom curve — deep, round, wide belly
        graphic.bezierCurveTo(
          -w * 0.4 * bellyBulge, // control1 x
          h * (0.9 + bellyDrop), // control1 y — deeper belly base
          w * 0.4 * bellyBulge, // control2 x
          h * (0.9 + bellyDrop), // control2 y
          w * 0.6 * bellyBulge, // end x
          h * (0.6 + bellyDrop), // end y
        );

        // Right side — mirror up, with small organic offset
        graphic.bezierCurveTo(
          w * 1.0 * bellyBulge, // control1 x — mirror the left bulge
          h * (0.3 + bellyDrop), // control1 y
          w * (0.015 + asym), // control2 x — narrow neck
          -h * 0.1, // control2 y
          tipOffsetX,
          tipOffsetY - h * 0.5 * neckLength,
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

        // Reset physics state to prevent flicker
        const dropletHeight =
          DROPLET_BASE_HEIGHT * state.scale * DROPLET_BASE_SIZE * 1.5;
        const halfHeight = dropletHeight / 2;
        state.y = BAR_HEIGHT - halfHeight - 10;
        state.velocity = 0;
        state.phase = "spawn";

        // Reset graphics state
        state.graphic.alpha = 0; // Start invisible
        state.graphic.scale.set(0.3 * state.scale); // Start small

        // KEY: clear() + redraw with new scale
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
        if (DEBUG_SHOW_BOUNDING_BOXES) {
          const textBounds = titleText.getBounds();
          debugBorder.clear();
          debugBorder.rect(
            textBounds.x,
            textBounds.y,
            textBounds.width,
            textBounds.height,
          );
          debugBorder.stroke({ color: 0x0000ff, width: 3 }); // Blue, 3px wide
        }
      };

      // Layout first, THEN initialize droplets (so text bounds are correct)
      layout();
      droplets.forEach((state, i) => {
        resetDroplet(state, i);
      });

      const tick = (ticker: Ticker) => {
        const dt = ticker.deltaTime / 60;
        const { height } = app.screen;

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
          const physBaseSize = isMobile
            ? DROPLET_BASE_SIZE * MOBILE_PHYSICS_SCALE
            : DROPLET_BASE_SIZE;
          const physBaseH = isMobile
            ? DROPLET_BASE_HEIGHT * MOBILE_DROPLET_HEIGHT_SCALE
            : DROPLET_BASE_HEIGHT;
          const dropletHeight = physBaseH * state.scale * physBaseSize;
          const halfHeight = dropletHeight / 2;

          // Get collision surfaces
          const topBarBottom = BAR_HEIGHT;
          const textBounds = titleText.getBounds();
          const textTop = textBounds.y;
          const textBottom = textBounds.y + textBounds.height - dropletHeight;
          const bottomPuddleSurface = height - BAR_HEIGHT;

          // Calculate droplet edges (collision points)
          const dropletBottom = state.y + halfHeight;
          const dropletTop = state.y - halfHeight;

          // === VELOCITY-BASED PHYSICS WITH COLLISION DETECTION ===
          // (Physics constants are at top of file for easy tuning)

          // Phase tracking removed - now using state-based physics

          // Reset on new cycle - check if we've completed and faded out
          if (state.phase === "merge" && state.graphic.alpha <= 0.05) {
            resetDroplet(state, index);
            return; // Skip this frame to prevent flicker
          }

          // Helper: Smooth interpolation (lerp)
          const lerp = (current: number, target: number, speed: number) => {
            return current + (target - current) * speed;
          };

          // SPAWN PHASE: Emerge from top bar
          if (state.phase === "spawn") {
            const velocityScale = isMobile ? MOBILE_SPAWN_VELOCITY_SCALE : 1.0;
            const spawnProgress = Math.min(elapsed / 0.5, 1.0);
            const spawnThreshold = 0.9;
            state.y = topBarBottom - halfHeight - 10 + spawnProgress * 50;
            state.velocity = spawnProgress * 2 * velocityScale;
            // Spawn starts squashed, gradually returns to normal
            const spawnScale = Math.max(0.5, spawnProgress);
            const targetYScale =
              ENTRY_SQUASH_SCALE + (1.0 - ENTRY_SQUASH_SCALE) * spawnProgress;
            state.currentYScale = lerp(
              state.currentYScale,
              targetYScale,
              SCALE_LERP_SPEED,
            );
            state.graphic.scale.set(
              spawnScale * state.scale,
              spawnScale * state.scale * state.currentYScale,
            );
            state.graphic.alpha = 1;

            if (spawnProgress >= spawnThreshold) {
              state.phase = "freefall";
            }
          }

          // COLLISION DETECTION - check which fluid zone droplet is in
          const dropletInsideTopBar =
            dropletBottom >= 0 && dropletTop <= topBarBottom;
          const dropletInsideText =
            dropletBottom >= textTop && dropletTop <= textBottom;
          const dropletInsideBottomBar =
            dropletBottom >= bottomPuddleSurface && dropletTop <= height;

          // STATE TRANSITIONS based on fluid zones
          if (state.phase === "spawn") {
            // Handled in spawn section above
          } else if (state.phase === "freefall") {
            // Check what fluid zone we're entering
            if (dropletInsideBottomBar) {
              state.phase = "inBottomBar";
            } else if (dropletInsideText) {
              state.phase = "inText";
            } else if (dropletInsideTopBar) {
              state.phase = "inTopBar";
            }
          } else if (state.phase === "inTopBar") {
            // Check if we've exited the top bar
            if (!dropletInsideTopBar && dropletTop > topBarBottom) {
              state.phase = "freefall";
            }
          } else if (state.phase === "inText") {
            // Check if we've exited the text
            if (!dropletInsideText && dropletTop > textBottom) {
              state.phase = "freefall";
            }
          } else if (state.phase === "inBottomBar") {
            // Transition to merge when deep enough
            if (dropletBottom > bottomPuddleSurface + 40) {
              state.phase = "merge";
            }
          } else if (state.phase === "merge") {
            // Stay in merge until reset
          }

          // APPLY PHYSICS based on current phase
          if (state.phase === "freefall") {
            // Accelerate with gravity
            const gravityScale = isMobile ? MOBILE_GRAVITY_SCALE : 1;
            state.velocity = Math.min(
              state.velocity + GRAVITY * gravityScale,
              MAX_VELOCITY,
            );
            // Stretch droplet during freefall (elongate Y) - smoothly interpolate
            state.currentYScale = lerp(
              state.currentYScale,
              FREEFALL_STRETCH_SCALE,
              SCALE_LERP_SPEED,
            );
            state.graphic.scale.set(
              state.scale,
              state.scale * state.currentYScale,
            );
            state.graphic.alpha = 1;
          } else if (
            state.phase === "inTopBar" ||
            state.phase === "inText" ||
            state.phase === "inBottomBar"
          ) {
            // FLUID PHYSICS - Dynamic friction based on position in fluid

            // Calculate progress through fluid (0.0 = entry, 1.0 = exit)
            let fluidTop: number, fluidBottom: number, fluidProgress: number;
            if (state.phase === "inTopBar") {
              fluidTop = 0;
              fluidBottom = topBarBottom;
            } else if (state.phase === "inText") {
              fluidTop = textTop;
              fluidBottom = textBottom;
            } else {
              // inBottomBar
              fluidTop = bottomPuddleSurface;
              fluidBottom = height;
            }
            fluidProgress =
              (dropletBottom - fluidTop) / (fluidBottom - fluidTop);
            fluidProgress = Math.max(0, Math.min(1, fluidProgress)); // Clamp 0-1

            // Apply friction curve based on zone
            let frictionFactor: number;

            // Bottom bar (puddle) has special dramatic splash friction
            if (state.phase === "inBottomBar") {
              if (fluidProgress < BOTTOM_ENTRY_ZONE_END) {
                // DRAMATIC SPLASH - Very strong impact friction
                frictionFactor = BOTTOM_ENTRY_FRICTION;
              } else if (fluidProgress < BOTTOM_EXIT_ZONE_START) {
                // Slow sinking through puddle
                frictionFactor = BOTTOM_MIDDLE_FRICTION;
              } else {
                // Deep in puddle, getting even slower
                const exitProgress =
                  (fluidProgress - BOTTOM_EXIT_ZONE_START) /
                  (1.0 - BOTTOM_EXIT_ZONE_START);
                frictionFactor =
                  BOTTOM_MIDDLE_FRICTION +
                  (BOTTOM_EXIT_FRICTION - BOTTOM_MIDDLE_FRICTION) *
                    exitProgress;
              }
            } else {
              // Top bar and text use standard friction curves
              if (fluidProgress < ENTRY_ZONE_END) {
                // Entry zone: High impact friction
                frictionFactor = ENTRY_FRICTION;
              } else if (fluidProgress < EXIT_ZONE_START) {
                // Middle zone: Linear steady movement
                frictionFactor = MIDDLE_FRICTION;
              } else {
                // Exit zone: Hanging/dripping effect
                const exitProgress =
                  (fluidProgress - EXIT_ZONE_START) / (1.0 - EXIT_ZONE_START);
                frictionFactor =
                  MIDDLE_FRICTION +
                  (EXIT_FRICTION - MIDDLE_FRICTION) * exitProgress;
              }
            }

            const fluidVelocityScale = isMobile
              ? MOBILE_FLUID_VELOCITY_SCALE
              : 1;
            state.velocity *= frictionFactor;
            state.velocity = Math.min(
              state.velocity + GRAVITY * fluidVelocityScale,
              MAX_VELOCITY,
            );

            // SQUASH & STRETCH based on fluid zone
            let targetYScale = 1.0;

            // Determine which zone we're in (works for both standard and bottom bar)
            const entryZoneEnd =
              state.phase === "inBottomBar"
                ? BOTTOM_ENTRY_ZONE_END
                : ENTRY_ZONE_END;
            const exitZoneStart =
              state.phase === "inBottomBar"
                ? BOTTOM_EXIT_ZONE_START
                : EXIT_ZONE_START;

            if (fluidProgress < entryZoneEnd) {
              // ENTRY ZONE: Squash dramatically on impact
              targetYScale = ENTRY_SQUASH_SCALE;
            } else if (fluidProgress >= exitZoneStart) {
              // EXIT ZONE: Stretch as droplet exits/hangs
              const exitProgress =
                (fluidProgress - exitZoneStart) / (1.0 - exitZoneStart);
              targetYScale = 1.0 + (EXIT_STRETCH_SCALE - 1.0) * exitProgress;
            } else {
              // MIDDLE ZONE: Normal scale with gentle variation for text
              if (state.phase === "inText") {
                targetYScale = 1 + Math.sin(fluidProgress * Math.PI) * 0.1;
              }
            }

            // Smoothly interpolate to target Y-scale
            state.currentYScale = lerp(
              state.currentYScale,
              targetYScale,
              SCALE_LERP_SPEED,
            );
            state.graphic.scale.set(
              state.scale,
              state.scale * state.currentYScale,
            );
            state.graphic.alpha = 1;
          } else if (state.phase === "merge") {
            // Merge into puddle - slow down but keep minimum velocity
            const mergeVelocityScale = isMobile
              ? MOBILE_MERGE_VELOCITY_SCALE
              : 0.7;
            state.velocity *= mergeVelocityScale;
            state.velocity = Math.max(state.velocity, MIN_VELOCITY);
            const mergeProgress = (dropletBottom - bottomPuddleSurface) / 40;
            const mergeFade = Math.max(0, 1 - mergeProgress);
            state.graphic.alpha = mergeFade;
            // Merge: gradually squash and widen as it spreads into puddle
            const mergeXScale = 1 + mergeProgress * 0.3;
            const targetMergeYScale = 1 - mergeProgress * 0.3; // Squash vertically as it spreads
            state.currentYScale = lerp(
              state.currentYScale,
              targetMergeYScale,
              SCALE_LERP_SPEED,
            );
            state.graphic.scale.set(
              state.scale * mergeXScale,
              state.scale * state.currentYScale,
            );
          }

          // Update position with velocity (always - MIN_VELOCITY ensures movement)
          state.y += state.velocity * dt * 60; // Normalize by 60fps

          // Apply position
          state.graphic.x = state.offset;
          state.graphic.y = state.y;

          // Draw debug bounding box
          if (DEBUG_SHOW_BOUNDING_BOXES) {
            const debugBaseW = isMobile
              ? DROPLET_BASE_WIDTH * MOBILE_PHYSICS_SCALE
              : DROPLET_BASE_WIDTH;
            const debugBaseH = isMobile
              ? DROPLET_BASE_HEIGHT * MOBILE_DROPLET_HEIGHT_SCALE
              : DROPLET_BASE_HEIGHT;

            state.debugBox.clear();

            // Color code by phase for easy visual debugging
            let phaseColor = 0xffffff;
            switch (state.phase) {
              case "freefall":
                phaseColor = 0x00ff00; // Green
                break;
              case "inTopBar":
                phaseColor = 0xffff00; // Yellow
                break;
              case "inText":
                phaseColor = 0x0000ff; // Blue
                break;
              case "inBottomBar":
                phaseColor = 0xff00ff; // Magenta
                break;
              case "merge":
                phaseColor = 0xff0000; // Red
                break;
              default:
                phaseColor = 0xffffff; // White
                break;
            }

            state.debugBox.rect(
              state.offset - debugBaseW / 2,
              state.y - debugBaseH / 2,
              debugBaseW,
              debugBaseH,
            );
            state.debugBox.stroke({ color: phaseColor, width: 2 });
            state.debugBox.alpha = state.graphic.alpha;
          } else {
            state.debugBox.clear();
          }
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
