import type { Application, Container, Graphics, Ticker } from "pixi.js";

interface DropletConfig {
  x: number; // Position (0-1, percentage)
  speed: number; // Fall speed
  scale: number; // Size multiplier
  delay: number; // Initial delay in seconds
  phase: number; // Animation phase (0-1)
}

type QualityTier = "low" | "medium" | "high";

interface QualitySettings {
  blurStrength: number;
  blurQuality: number;
  dropletDetail: number; // Multiplier for bezier curve precision
}

const QUALITY_PRESETS: Record<QualityTier, QualitySettings> = {
  low: {
    blurStrength: 6,
    blurQuality: 2,
    dropletDetail: 0.8,
  },
  medium: {
    blurStrength: 8,
    blurQuality: 3,
    dropletDetail: 1.0,
  },
  high: {
    blurStrength: 10,
    blurQuality: 4,
    dropletDetail: 1.0,
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
  private droplets: Graphics[] = [];
  private configs: DropletConfig[] = [];
  private elapsedTime = 0;
  private quality: QualitySettings;
  // biome-ignore lint/suspicious/noExplicitAny: BlurFilter type is from dynamically imported PixiJS
  private blurFilter: any = null;
  private currentQualityTier: QualityTier;
  private fpsHistory: number[] = [];
  private lastFpsCheck = 0;
  private autoAdjustEnabled = true;

  constructor(app: Application, PIXI: PixiModule, qualityTier?: QualityTier) {
    this.app = app;
    this.PIXI = PIXI;
    this.currentQualityTier = qualityTier ?? this.detectQualityTier();
    this.quality = QUALITY_PRESETS[this.currentQualityTier];
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

  async init(dropletCount: number, scaleMultiplier: number) {
    // Create main container
    this.container = new this.PIXI.Container();
    this.app.stage.addChild(this.container);

    // Create goo container with blur filter
    this.gooContainer = new this.PIXI.Container();
    this.container.addChild(this.gooContainer);

    // Apply adaptive blur filter for goo effect
    this.blurFilter = new this.PIXI.BlurFilter({
      strength: this.quality.blurStrength,
      quality: this.quality.blurQuality,
    });
    this.gooContainer.filters = [this.blurFilter];

    // Add top bar
    const topBar = this.createBar(0);
    this.gooContainer.addChild(topBar);

    // Generate droplet configurations
    this.configs = this.generateDropletConfigs(dropletCount);

    // Create droplet graphics
    for (const config of this.configs) {
      const droplet = this.createDroplet(config.scale * scaleMultiplier);
      this.gooContainer.addChild(droplet);
      this.droplets.push(droplet);
    }

    // Add bottom bar
    const bottomBar = this.createBar(this.app.screen.height - 62);
    this.gooContainer.addChild(bottomBar);

    // Start animation loop
    this.app.ticker.add(this.animate.bind(this));

    // Setup resize handler
    this.setupResizeHandler();
  }

  private setupResizeHandler() {
    // PixiJS Application already handles canvas resize via resizeTo option
    // We just need to update our bar positions when screen size changes
    const onResize = () => {
      if (!this.gooContainer) return;

      // Update bottom bar position
      const bars = this.gooContainer.children.filter(
        (child) => child !== this.droplets[0]?.parent,
      );
      const bottomBar = bars[bars.length - 1] as Graphics;
      if (bottomBar) {
        bottomBar.clear();
        bottomBar.rect(
          -20,
          this.app.screen.height - 62,
          this.app.screen.width + 40,
          62,
        );
        bottomBar.fill({ color: 0x880808 });
      }
    };

    // Listen to PixiJS renderer resize
    this.app.renderer.on("resize", onResize);
  }

  private createBar(y: number): Graphics {
    const bar = new this.PIXI.Graphics();
    bar.rect(-20, y, this.app.screen.width + 40, 62);
    bar.fill({ color: 0x880808 });
    return bar;
  }

  private createDroplet(scale: number): Graphics {
    const droplet = new this.PIXI.Graphics();

    // Blood droplet shape matching SVG path precisely
    // Original path: m28.443,3.6945c2.45,11.902,6.93,17.65,12.688,25.359,1.9918,2.667,3.2188,5.8992,3.2188,9.4844,0,8.7667-7.1395,15.875-15.906,15.875-8.7667,0-15.844-7.1083-15.844-15.875,0-3.5378,1.0945-6.9015,3.125-9.4844,6.009-7.645,10.407-13.424,12.718-25.36z
    // ViewBox: 0 0 59 62
    const w = 59 * scale;
    const h = 62 * scale;

    // Starting point: m28.443,3.6945
    droplet.moveTo((28.443 / 59) * w, (3.6945 / 62) * h);

    // Right side curve: c2.45,11.902,6.93,17.65,12.688,25.359
    droplet.bezierCurveTo(
      ((28.443 + 2.45) / 59) * w,
      ((3.6945 + 11.902) / 62) * h,
      ((28.443 + 6.93) / 59) * w,
      ((3.6945 + 17.65) / 62) * h,
      ((28.443 + 12.688) / 59) * w,
      ((3.6945 + 25.359) / 62) * h,
    );

    // Bottom right arc segment: c1.9918,2.667,3.2188,5.8992,3.2188,9.4844
    const x1 = 28.443 + 12.688;
    const y1 = 3.6945 + 25.359;
    droplet.bezierCurveTo(
      ((x1 + 1.9918) / 59) * w,
      ((y1 + 2.667) / 62) * h,
      ((x1 + 3.2188) / 59) * w,
      ((y1 + 5.8992) / 62) * h,
      ((x1 + 3.2188) / 59) * w,
      ((y1 + 9.4844) / 62) * h,
    );

    // Bottom arc (approximated with arc): c0,8.7667,-7.1395,15.875,-15.906,15.875
    // This is actually an elliptical arc for the rounded bottom
    const bottomCenterX = ((28.443 + 0.344) / 59) * w;
    const bottomCenterY = ((38.5379 + 8.7667 / 2) / 62) * h;
    const radiusX = (15.906 / 59) * w;

    // Arc from right to left (PI to 0)
    // Note: Using circular arc as approximation (PixiJS arc doesn't support elliptical)
    droplet.arc(bottomCenterX, bottomCenterY, radiusX, 0, Math.PI, false);

    // Left side arc segment: c0,-3.5378,1.0945,-6.9015,3.125,-9.4844
    const x2 = 28.443 - 15.906;
    const y2 = 38.5379 + 8.7667;
    droplet.bezierCurveTo(
      ((x2 + 0) / 59) * w,
      ((y2 - 3.5378) / 62) * h,
      ((x2 + 1.0945) / 59) * w,
      ((y2 - 6.9015) / 62) * h,
      ((x2 + 3.125) / 59) * w,
      ((y2 - 9.4844) / 62) * h,
    );

    // Left side curve back to start: c6.009,-7.645,10.407,-13.424,12.718,-25.36
    const x3 = x2 + 3.125;
    const y3 = y2 - 9.4844;
    droplet.bezierCurveTo(
      ((x3 + 6.009) / 59) * w,
      ((y3 - 7.645) / 62) * h,
      ((x3 + 10.407) / 59) * w,
      ((y3 - 13.424) / 62) * h,
      ((x3 + 12.718) / 59) * w,
      ((y3 - 25.36) / 62) * h,
    );

    droplet.fill({ color: 0x880808 });

    return droplet;
  }

  private generateDropletConfigs(count: number): DropletConfig[] {
    const baseOffsets = [35, 40, 45, 50, 55, 60, 65];
    const configs: DropletConfig[] = [];

    for (let i = 0; i < count; i++) {
      configs.push({
        x: (baseOffsets[i] + (Math.random() * 2 - 1) * 5) / 100,
        speed: 0.3 + Math.random() * 0.2,
        scale: 0.5 + Math.random() * 1.0,
        delay: i * 0.25,
        phase: 0,
      });
    }

    return configs;
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

    this.droplets.forEach((droplet, i) => {
      const config = this.configs[i];

      // Apply initial delay
      if (this.elapsedTime < config.delay) {
        droplet.alpha = 0;
        return;
      }

      droplet.alpha = 1;

      // Update phase (0 to 1 over 9 seconds)
      config.phase = ((this.elapsedTime - config.delay) * config.speed) % 1;

      // Calculate Y position based on phase
      const screenHeight = this.app.screen.height;
      let y: number;

      if (config.phase < 0.1) {
        // Scale in at top
        const t = config.phase / 0.1;
        y = 31;
        droplet.scale.set(t * config.scale);
      } else if (config.phase < 0.2) {
        // Fall to 30%
        const t = (config.phase - 0.1) / 0.1;
        y = 31 + t * (screenHeight * 0.3 - 31);
        droplet.scale.set(config.scale);
      } else if (config.phase < 0.7) {
        // Slow section (30% to 55%)
        const t = (config.phase - 0.2) / 0.5;
        y = screenHeight * 0.3 + t * (screenHeight * 0.55 - screenHeight * 0.3);
      } else if (config.phase < 0.8) {
        // Fall to 100%
        const t = (config.phase - 0.7) / 0.1;
        y = screenHeight * 0.55 + t * (screenHeight - screenHeight * 0.55);
      } else {
        // Fade out
        const t = (config.phase - 0.8) / 0.2;
        y = screenHeight + t * 100;
      }

      droplet.x = config.x * this.app.screen.width;
      droplet.y = y;
    });
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

  updateDropletCount(count: number, scaleMultiplier: number) {
    // Recreate droplets with new count
    this.destroy();
    this.init(count, scaleMultiplier);
  }

  destroy() {
    this.app.ticker.remove(this.animate.bind(this));

    // Remove resize listener
    this.app.renderer.off("resize");

    if (this.container) {
      this.app.stage.removeChild(this.container);
      this.container.destroy({ children: true });
      this.container = null;
    }

    this.droplets = [];
    this.configs = [];
    this.elapsedTime = 0;
    this.fpsHistory = [];
  }
}
