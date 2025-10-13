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

      // Detect mobile and adjust settings
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

      // Mobile: larger droplets (don't scale down), less blur, tighter horizontal spacing
      const mobileMinScale = isMobile ? DROPLET_MIN_SCALE : DROPLET_MIN_SCALE;
      const mobileMaxScale = isMobile ? DROPLET_MAX_SCALE : DROPLET_MAX_SCALE;
      const mobileMinOffset = isMobile ? 5 : DROPLET_MIN_OFFSET;
      const mobileMaxOffset = isMobile ? 65 : DROPLET_MAX_OFFSET;
      const mobileDropletCount = isMobile ? 4 : NUM_DROPLETS;

      // Adjust blur and alpha for mobile - less blur so droplets are visible
      if (isMobile) {
        blurFilter.strength = 15; // Reduce from 25 to 10
        alphaMatrix.matrix[14] = 10; // Reduce alpha multiply from 15 to 10
        alphaMatrix.matrix[19] = -3; // Reduce alpha offset from -5 to -3
      }

      // Create multiple droplets
      const droplets: DropletState[] = [];
      for (let i = 0; i < mobileDropletCount; i++) {
        const graphic = new Graphics();
        root.addChild(graphic);
        const scaleRange = mobileMaxScale - mobileMinScale;
        const offsetRange = mobileMaxOffset - mobileMinOffset;
        droplets.push({
          graphic,
          scale: mobileMinScale + Math.random() * scaleRange,
          elapsedTime: 0,
          delay: Math.random() * DROPLET_MAX_DELAY,
          offset: mobileMinOffset + Math.random() * offsetRange,
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
        const scaleRange = mobileMaxScale - mobileMinScale;
        state.scale = mobileMinScale + Math.random() * scaleRange;
        state.elapsedTime = 0;
        state.delay = Math.random() * DROPLET_MAX_DELAY;

        // Calculate droplet position based on actual text bounds
        const textBounds = titleText.getBounds();
        const textLeft = textBounds.x;
        const textRight = textBounds.x + textBounds.width;
        const textWidth = textBounds.width;

        // Random position within text bounds (with small margin)
        const margin = textWidth * 0.05; // 5% margin on each side
        const minX = textLeft + margin;
        const maxX = textRight - margin;
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
      };

      // Initialize all droplets
      droplets.forEach((state, i) => {
        resetDroplet(state, i);
      });
      layout();

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

          const phase = (elapsed % ANIMATION_DURATION) / ANIMATION_DURATION;

          const baseSize = 1.5;
          const dropletHeight = DROPLET_BASE_HEIGHT * state.scale * baseSize;
          const halfHeight = dropletHeight / 2;
          const topBarBottom = BAR_HEIGHT;
          const textTop = height * 0.375 + BAR_HEIGHT;
          const textBottom = height * 0.6 + BAR_HEIGHT;
          const bottomPuddleSurface = height - BAR_HEIGHT - halfHeight / 8;

          let y: number;

          const easeOutQuad = (t: number) => 1 - (1 - t) ** 2;
          const easeInCubic = (t: number) => t ** 3;
          const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;
          const easeInQuart = (t: number) => t ** 4;
          const easeInOutCubic = (t: number) =>
            t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2;

          if (phase < 0.1) {
            const t = phase / 0.1;
            const easedT = easeInOutCubic(t);
            const startY = topBarBottom - halfHeight - 10;
            const endY = topBarBottom - halfHeight + 40;
            y = startY + easedT * (endY - startY);
            state.graphic.scale.set(Math.max(0.3, t) * state.scale);
            state.graphic.alpha = 1;
          } else if (phase < 0.35) {
            const t = (phase - 0.1) / 0.25;
            const easedT = easeInQuart(t);
            const startY = topBarBottom - halfHeight + 40;
            const endY = textTop - halfHeight;
            y = startY + easedT * (endY - startY);
            state.graphic.scale.set(state.scale);
            state.graphic.alpha = 1;
          } else if (phase < 0.45) {
            const t = (phase - 0.35) / 0.1;
            const easedT = easeOutCubic(t);
            const distance = (textBottom - textTop) * 0.15;
            y = textTop - halfHeight + easedT * distance;
            state.graphic.scale.set(state.scale * (1 + t * 0.15));
            state.graphic.alpha = 1;
          } else if (phase < 0.6) {
            const t = (phase - 0.45) / 0.15;
            const easedT = easeOutQuad(t);
            const startY = textTop - halfHeight + (textBottom - textTop) * 0.15;
            const distance = (textBottom - textTop) * 0.5;
            y = startY + easedT * distance;
            state.graphic.scale.set(state.scale * (1.15 - t * 0.15));
            state.graphic.alpha = 1;
          } else if (phase < 0.68) {
            const t = (phase - 0.6) / 0.08;
            const easedT = easeInCubic(t);
            const startY = textTop - halfHeight + (textBottom - textTop) * 0.65;
            const endY = textBottom - halfHeight + 50;
            y = startY + easedT * (endY - startY);
            state.graphic.alpha = 1;
          } else if (phase < 0.88) {
            const t = (phase - 0.68) / 0.2;
            const easedT = easeInQuart(t);
            const startY = textBottom - halfHeight + 50;
            const endY = bottomPuddleSurface - halfHeight;
            y = startY + easedT * (endY - startY);
            state.graphic.alpha = 1;
          } else {
            // Merge phase - fade out and reset when invisible
            const t = (phase - 0.88) / 0.12;
            const easedT = easeOutQuad(t);
            y = bottomPuddleSurface - halfHeight + easedT * 40;
            state.graphic.alpha = 1 - t;
            state.graphic.scale.set(state.scale * (1 + t * 0.5));

            // Reset THIS droplet when it completes
            if (state.graphic.alpha <= 0.01) {
              resetDroplet(state, index);
            }
          }

          state.graphic.x = state.offset; // Now using absolute X position
          state.graphic.y = y;
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
