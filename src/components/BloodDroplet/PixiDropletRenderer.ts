import type { Application, Container, Graphics, Ticker } from "pixi.js";

interface DropletConfig {
  x: number; // Position (0-1, percentage)
  speed: number; // Fall speed
  scale: number; // Size multiplier
  delay: number; // Initial delay in seconds
  phase: number; // Animation phase (0-1)
}

// biome-ignore lint/suspicious/noExplicitAny: PixiJS module type is complex and dynamically imported
type PixiModule = any;

export class PixiDropletRenderer {
  private app: Application;
  private PIXI: PixiModule;
  private container: Container | null = null;
  private gooContainer: Container | null = null;
  private droplets: Graphics[] = [];
  private configs: DropletConfig[] = [];
  private elapsedTime = 0;

  constructor(app: Application, PIXI: PixiModule) {
    this.app = app;
    this.PIXI = PIXI;
  }

  async init(dropletCount: number, scaleMultiplier: number) {
    // Create main container
    this.container = new this.PIXI.Container();
    this.app.stage.addChild(this.container);

    // Create goo container with blur filter
    this.gooContainer = new this.PIXI.Container();
    this.container.addChild(this.gooContainer);

    // Apply blur filter for goo effect
    const blurFilter = new this.PIXI.BlurFilter({
      strength: 8,
      quality: 4,
    });
    this.gooContainer.filters = [blurFilter];

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
  }

  private createBar(y: number): Graphics {
    const bar = new this.PIXI.Graphics();
    bar.rect(-20, y, this.app.screen.width + 40, 62);
    bar.fill({ color: 0x880808 });
    return bar;
  }

  private createDroplet(scale: number): Graphics {
    const droplet = new this.PIXI.Graphics();

    // Blood droplet shape (approximate SVG path)
    const width = 59 * scale;
    const height = 62 * scale;

    droplet.moveTo(width * 0.48, height * 0.06);
    droplet.bezierCurveTo(
      width * 0.52,
      height * 0.25,
      width * 0.62,
      height * 0.35,
      width * 0.72,
      height * 0.47,
    );
    droplet.bezierCurveTo(
      width * 0.77,
      height * 0.52,
      width * 0.78,
      height * 0.62,
      width * 0.78,
      height * 0.72,
    );
    droplet.arc(width * 0.48, height * 0.72, width * 0.3, 0, Math.PI);
    droplet.bezierCurveTo(
      width * 0.22,
      height * 0.62,
      width * 0.23,
      height * 0.52,
      width * 0.28,
      height * 0.47,
    );
    droplet.bezierCurveTo(
      width * 0.38,
      height * 0.35,
      width * 0.48,
      height * 0.25,
      width * 0.48,
      height * 0.06,
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

  private animate(ticker: Ticker) {
    const delta = ticker.deltaTime / 60; // Convert to seconds
    this.elapsedTime += delta;

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

  updateDropletCount(count: number, scaleMultiplier: number) {
    // Recreate droplets with new count
    this.destroy();
    this.init(count, scaleMultiplier);
  }

  destroy() {
    this.app.ticker.remove(this.animate.bind(this));

    if (this.container) {
      this.app.stage.removeChild(this.container);
      this.container.destroy({ children: true });
      this.container = null;
    }

    this.droplets = [];
    this.configs = [];
    this.elapsedTime = 0;
  }
}
