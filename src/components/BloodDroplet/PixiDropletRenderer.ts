import type { Application, Container, Graphics, Text, Ticker } from "pixi.js";
import { DROPLET_DURATION } from "./dropletConfig";
import type { DropletSeed } from "./dropletTypes";

interface InternalDropletState {
  graphic: Graphics;
  delay: number;
  offset: number; // percentage 0-100
  scale: number;
  phase: number;
  phaseOffset: number;
}

type QualityTier = "low" | "medium" | "high";

interface QualitySettings {
  blurStrength: number;
  blurQuality: number;
}

const QUALITY_PRESETS: Record<QualityTier, QualitySettings> = {
  low: {
    blurStrength: 6,
    blurQuality: 2,
  },
  medium: {
    blurStrength: 8,
    blurQuality: 3,
  },
  high: {
    blurStrength: 10,
    blurQuality: 4,
  },
};

// biome-ignore lint/suspicious/noExplicitAny: PixiJS module type is complex and dynamically imported
type PixiModule = any;

export type { QualityTier };

export class PixiDropletRenderer {
  private app: Application;
  private PIXI: PixiModule;
  private container: Container | null = null;
  private gooContainer: Container | null = null;
  private dropletStates: InternalDropletState[] = [];
  private elapsedTime = 0;
  private quality: QualitySettings;
  // biome-ignore lint/suspicious/noExplicitAny: BlurFilter type is from dynamically imported PixiJS
  private blurFilter: any = null;
  private currentQualityTier: QualityTier;
  private fpsHistory: number[] = [];
  private lastFpsCheck = 0;
  private autoAdjustEnabled = true;
  private loopCallback?: () => void;
  private durationSeconds = DROPLET_DURATION;
  private topBar: Graphics | null = null;
  private bottomBar: Graphics | null = null;
  private titleText: Text | null = null;
  private titleIntroDuration = 1.2;
  private titleIntroElapsed = 0;
  private titleIntroActive = false;
  private animateFn: (ticker: Ticker) => void;
  private resizeHandler?: () => void;

  constructor(
    app: Application,
    PIXI: PixiModule,
    options?: { qualityTier?: QualityTier; onLoop?: () => void },
  ) {
    this.app = app;
    this.PIXI = PIXI;
    this.currentQualityTier = options?.qualityTier ?? this.detectQualityTier();
    this.quality = QUALITY_PRESETS[this.currentQualityTier];
    this.loopCallback = options?.onLoop;
    this.animateFn = this.animate.bind(this);
  }

  private detectQualityTier(): QualityTier {
    // Detect device capabilities
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const isLowEnd =
      isMobile &&
      (navigator.hardwareConcurrency ?? 4) <= 4 &&
      window.devicePixelRatio <= 2;

    if (isLowEnd) return "low";
    if (isMobile) return "medium";
    return "high";
  }

  async init(seeds: DropletSeed[]) {
    // Create main container
    const container = new this.PIXI.Container();
    this.container = container;
    this.app.stage.addChild(container);

    // Create goo container with blur filter restored
    const gooContainer = new this.PIXI.Container();
    this.gooContainer = gooContainer;
    container.addChild(gooContainer);

    // Apply blur + color matrix for goo effect (matches SVG filter)
    this.blurFilter = new this.PIXI.BlurFilter({
      strength: this.quality.blurStrength,
      quality: this.quality.blurQuality,
    });

    // Alpha blending filter for goo effect (alpha * 20 - 8)
    // Works on white shapes to create clean blending
    const alphaMatrix = new this.PIXI.ColorMatrixFilter();
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
      20,
      -8, // Alpha channel: multiply by 20, subtract 8
    ];

    // Color tint filter to convert white → #880808
    // #880808 = RGB(136, 8, 8) = RGB(0.533, 0.031, 0.031) in normalized form
    const colorTint = new this.PIXI.ColorMatrixFilter();
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

    // Apply filters: blur → alpha blending → color tint
    gooContainer.filters = [this.blurFilter, alphaMatrix, colorTint];

    // Add top bar
    const topBar = this.createBar(0);
    this.topBar = topBar;
    gooContainer.addChild(topBar);

    // Add bottom bar
    const bottomBar = this.createBar(this.app.screen.height - 62);
    this.bottomBar = bottomBar;
    gooContainer.addChild(bottomBar);

    // Add red title text (inside goo container so it gets blurred)
    await this.createTitleText();

    // Seed initial droplets
    this.applyDropletSeeds(seeds);

    // Start animation loop
    this.app.ticker.add(this.animateFn);

    // Setup resize handler
    this.setupResizeHandler();
  }

  private async createTitleText() {
    // Load Creepster font dynamically
    const fontUrl =
      "https://fonts.googleapis.com/css2?family=Creepster&display=swap";
    await this.loadWebFont(fontUrl);

    const fontSize = this.calculateTitleFontSize();
    const letterSpacing = this.calculateLetterSpacing(fontSize);
    const strokeWidth = this.calculateStrokeWidth(fontSize);

    const devicePixelRatio =
      typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;

    const titleText = new this.PIXI.Text({
      text: "murha-\nkaverit",
      style: {
        fontFamily: "Creepster, cursive",
        fontSize,
        fill: 0xffffff, // White - will be tinted to #880808 by filter
        align: "center",
        lineHeight: 0.8 * fontSize,
        fontWeight: "900",
        letterSpacing,
        stroke: { color: 0xffffff, width: strokeWidth },
        padding: strokeWidth * 2,
      },
    });

    titleText.roundPixels = true;
    titleText.resolution = devicePixelRatio;
    titleText.scale.set(0.88);
    titleText.alpha = 0;

    titleText.anchor.set(0.5);
    titleText.x = this.app.screen.width / 2;
    titleText.y = this.app.screen.height / 2;

    if (!this.gooContainer) {
      throw new Error("PixiDropletRenderer.gooContainer not initialized");
    }

    this.gooContainer.addChild(titleText);
    this.titleText = titleText;
    this.titleIntroElapsed = 0;
    this.titleIntroActive = true;
  }

  private calculateTitleFontSize(): number {
    // clamp(3rem, 30vw, 15rem)
    const vw = this.app.screen.width * 0.3;
    const min = 48; // 3rem ≈ 48px
    const max = 240; // 15rem ≈ 240px
    return Math.min(Math.max(vw, min), max);
  }

  private calculateLetterSpacing(fontSize: number): number {
    const preferred = this.app.screen.width * 0.005; // 0.5vw
    const max = fontSize * 0.35; // 0.35em
    return Math.min(Math.max(0, preferred), max);
  }

  private calculateStrokeWidth(fontSize: number): number {
    return Math.max(2, fontSize * 0.03);
  }

  private async loadWebFont(url: string) {
    // Create link element to load Google Font
    if (typeof document !== "undefined") {
      const existingLink = document.querySelector(`link[href="${url}"]`);
      if (existingLink) return;

      const link = document.createElement("link");
      link.href = url;
      link.rel = "stylesheet";
      document.head.appendChild(link);

      // Wait for font to load
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  private setupResizeHandler() {
    // PixiJS Application already handles canvas resize via resizeTo option
    // We just need to update our bar positions when screen size changes
    const onResize = () => {
      if (!this.gooContainer) return;

      if (this.bottomBar) {
        this.bottomBar.clear();
        this.bottomBar.rect(
          -20,
          this.app.screen.height - 62,
          this.app.screen.width + 40,
          62,
        );
        this.bottomBar.fill({ color: 0xffffff });
      }

      if (this.topBar) {
        this.topBar.clear();
        this.topBar.rect(-20, 0, this.app.screen.width + 40, 62);
        this.topBar.fill({ color: 0xffffff });
      }
    };

    // Listen to PixiJS renderer resize
    this.resizeHandler = onResize;
    this.app.renderer.on("resize", onResize);
  }

  private createBar(y: number): Graphics {
    const bar = new this.PIXI.Graphics();
    bar.rect(-20, y, this.app.screen.width + 40, 62);
    bar.fill({ color: 0xffffff }); // White - will be tinted to #880808 by filter
    return bar;
  }

  private drawDroplet(graphic: Graphics, scale: number) {
    graphic.clear();

    // Blood droplet shape matching SVG path precisely
    const w = 59 * scale;
    const h = 62 * scale;

    graphic.moveTo((28.443 / 59) * w, (3.6945 / 62) * h);

    graphic.bezierCurveTo(
      ((28.443 + 2.45) / 59) * w,
      ((3.6945 + 11.902) / 62) * h,
      ((28.443 + 6.93) / 59) * w,
      ((3.6945 + 17.65) / 62) * h,
      ((28.443 + 12.688) / 59) * w,
      ((3.6945 + 25.359) / 62) * h,
    );

    const x1 = 28.443 + 12.688;
    const y1 = 3.6945 + 25.359;
    graphic.bezierCurveTo(
      ((x1 + 1.9918) / 59) * w,
      ((y1 + 2.667) / 62) * h,
      ((x1 + 3.2188) / 59) * w,
      ((y1 + 5.8992) / 62) * h,
      ((x1 + 3.2188) / 59) * w,
      ((y1 + 9.4844) / 62) * h,
    );

    const bottomCenterX = ((28.443 + 0.344) / 59) * w;
    const bottomCenterY = ((38.5379 + 8.7667 / 2) / 62) * h;
    const radiusX = (15.906 / 59) * w;
    graphic.arc(bottomCenterX, bottomCenterY, radiusX, 0, Math.PI, false);

    const x2 = 28.443 - 15.906;
    const y2 = 38.5379 + 8.7667;
    graphic.bezierCurveTo(
      ((x2 + 0) / 59) * w,
      ((y2 - 3.5378) / 62) * h,
      ((x2 + 1.0945) / 59) * w,
      ((y2 - 6.9015) / 62) * h,
      ((x2 + 3.125) / 59) * w,
      ((y2 - 9.4844) / 62) * h,
    );

    const x3 = x2 + 3.125;
    const y3 = y2 - 9.4844;
    graphic.bezierCurveTo(
      ((x3 + 6.009) / 59) * w,
      ((y3 - 7.645) / 62) * h,
      ((x3 + 10.407) / 59) * w,
      ((y3 - 13.424) / 62) * h,
      ((x3 + 12.718) / 59) * w,
      ((y3 - 25.36) / 62) * h,
    );

    graphic.fill({ color: 0xffffff });
  }

  private createDroplet(scale: number): Graphics {
    const droplet = new this.PIXI.Graphics();
    this.drawDroplet(droplet, scale);
    return droplet;
  }

  private monitorFPS(ticker: Ticker) {
    const currentFPS = ticker.FPS;
    this.fpsHistory.push(currentFPS);

    // Keep only last 60 frames (1 second at 60fps)
    if (this.fpsHistory.length > 60) {
      this.fpsHistory.shift();
    }

    // Check every 2 seconds
    if (this.elapsedTime - this.lastFpsCheck < 2) return;
    this.lastFpsCheck = this.elapsedTime;

    // Calculate average FPS
    const avgFPS =
      this.fpsHistory.reduce((sum, fps) => sum + fps, 0) /
      this.fpsHistory.length;

    // Auto-downgrade quality if FPS is consistently low
    if (avgFPS < 30 && this.currentQualityTier === "high") {
      console.warn(
        `[PixiDropletRenderer] Low FPS detected (${avgFPS.toFixed(1)}), downgrading to medium quality`,
      );
      this.updateQuality("medium");
      this.currentQualityTier = "medium";
      this.fpsHistory = []; // Reset history
    } else if (avgFPS < 20 && this.currentQualityTier === "medium") {
      console.warn(
        `[PixiDropletRenderer] Very low FPS detected (${avgFPS.toFixed(1)}), downgrading to low quality`,
      );
      this.updateQuality("low");
      this.currentQualityTier = "low";
      this.fpsHistory = []; // Reset history
    }
  }

  setAutoAdjust(enabled: boolean) {
    this.autoAdjustEnabled = enabled;
  }

  getCurrentFPS(): number {
    return this.app.ticker.FPS;
  }

  getAverageFPS(): number {
    if (this.fpsHistory.length === 0) return 60;
    return (
      this.fpsHistory.reduce((sum, fps) => sum + fps, 0) /
      this.fpsHistory.length
    );
  }

  private animate(ticker: Ticker) {
    const delta = ticker.deltaTime / 60; // Convert to seconds
    this.elapsedTime += delta;

    // FPS monitoring and auto-adjustment
    if (this.autoAdjustEnabled) {
      this.monitorFPS(ticker);
    }

    const speed = 1 / this.durationSeconds;

    this.dropletStates.forEach((state, index) => {
      const droplet = state.graphic;
      const elapsed = this.elapsedTime - state.delay;

      if (elapsed < 0) {
        droplet.alpha = 0;
        return;
      }

      const previousPhase = state.phase;
      const rawPhase = elapsed * speed + state.phaseOffset;
      const normalizedPhase = ((rawPhase % 1) + 1) % 1;
      state.phase = normalizedPhase;

      if (index === 0 && previousPhase > normalizedPhase) {
        this.loopCallback?.();
      }

      droplet.alpha = 1;

      const screenHeight = this.app.screen.height;
      let y: number;

      if (state.phase < 0.1) {
        const t = state.phase / 0.1;
        y = 31;
        droplet.scale.set(t * state.scale);
      } else if (state.phase < 0.2) {
        const t = (state.phase - 0.1) / 0.1;
        y = 31 + t * (screenHeight * 0.4 - 31);
        droplet.scale.set(state.scale);
      } else if (state.phase < 0.7) {
        const t = (state.phase - 0.2) / 0.5;
        y = screenHeight * 0.4 + t * (screenHeight * 0.6 - screenHeight * 0.4);
      } else if (state.phase < 0.8) {
        const t = (state.phase - 0.7) / 0.1;
        y = screenHeight * 0.6 + t * (screenHeight - screenHeight * 0.6);
      } else {
        const t = (state.phase - 0.8) / 0.2;
        y = screenHeight + t * 100;
      }

      droplet.x = (state.offset / 100) * this.app.screen.width;
      droplet.y = y;
    });

    if (this.titleIntroActive && this.titleText) {
      this.titleIntroElapsed += delta;
      const progress = Math.min(
        this.titleIntroElapsed / this.titleIntroDuration,
        1,
      );
      const eased = 1 - (1 - progress) ** 3; // easeOutCubic
      const scale = 0.88 + eased * 0.12;
      this.titleText.scale.set(scale);
      this.titleText.alpha = eased;

      if (progress >= 1) {
        this.titleIntroActive = false;
        this.titleText.scale.set(1);
        this.titleText.alpha = 1;
      }
    }
  }

  updateTheme(_theme: "dark" | "light") {
    // Update colors if needed
    // For now, blood red stays the same in both themes
  }

  updateQuality(qualityTier: QualityTier) {
    this.quality = QUALITY_PRESETS[qualityTier];

    // Update blur filter
    if (this.blurFilter) {
      this.blurFilter.strength = this.quality.blurStrength;
      this.blurFilter.quality = this.quality.blurQuality;
    }
  }

  updateDroplets(seeds: DropletSeed[]) {
    this.applyDropletSeeds(seeds);
  }

  destroy() {
    this.app.ticker.remove(this.animateFn);

    // Remove resize listener
    if (this.resizeHandler) {
      this.app.renderer.off("resize", this.resizeHandler);
      this.resizeHandler = undefined;
    }

    if (this.container) {
      this.app.stage.removeChild(this.container);
      this.container.destroy({ children: true });
      this.container = null;
    }

    this.dropletStates = [];
    this.elapsedTime = 0;
    this.fpsHistory = [];
    this.gooContainer = null;
    this.topBar = null;
    this.bottomBar = null;
    this.titleText = null;
    this.titleIntroActive = false;
  }

  private applyDropletSeeds(seeds: DropletSeed[]) {
    const gooContainer = this.gooContainer;
    if (!gooContainer) return;
    const bottomBar = this.bottomBar;

    const ensureCountMatches = () => {
      if (this.dropletStates.length === seeds.length) return;

      for (const state of this.dropletStates) {
        gooContainer.removeChild(state.graphic);
        state.graphic.destroy();
      }
      this.dropletStates = [];

      seeds.forEach((seed) => {
        const droplet = this.createDroplet(seed.scale);
        droplet.alpha = 0;
        const insertIndex =
          bottomBar && gooContainer.children.includes(bottomBar)
            ? gooContainer.getChildIndex(bottomBar)
            : gooContainer.children.length;
        gooContainer.addChildAt(droplet, insertIndex);
        this.dropletStates.push({
          graphic: droplet,
          delay: seed.delay,
          offset: seed.offset,
          scale: seed.scale,
          phase: seed.phase,
          phaseOffset: seed.phase,
        });
      });
    };

    ensureCountMatches();

    this.dropletStates.forEach((state, index) => {
      const seed = seeds[index];
      state.delay = seed.delay;
      state.offset = seed.offset;
      state.scale = seed.scale;
      state.phase = seed.phase;
      state.phaseOffset = seed.phase;
      state.graphic.alpha = 0;
      this.drawDroplet(state.graphic, seed.scale);
    });

    this.elapsedTime = 0;
  }
}
