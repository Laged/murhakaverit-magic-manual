/**
 * Blood Animation Classes
 *
 * Animation systems for organic blood appearance effects
 */

// Use any for Graphics type since we're in .ts file
// Will be properly typed when used in .tsx files
type Graphics = any;

import {
  createDripStreaks,
  type DripStreak,
  drawDripShape,
  easeInOutSine,
  easeOutCubic,
  generateEdgeWithRipples,
  generateOrganicEdge,
  lerp,
  type Point,
  type Ripple,
  updateRipples,
} from "./bloodAnimationUtils";

// === TEXT DRIP ANIMATION CONSTANTS ===
export const TEXT_DRIP_DURATION = 1.2;
export const TEXT_NUM_DRIPS = 8;
export const TEXT_DRIP_SPEED_MIN = 0.7;
export const TEXT_DRIP_SPEED_MAX = 1.3;
export const TEXT_DRIP_WIDTH = 50;
export const TEXT_DRIP_EDGE_ROUGHNESS = 10;

// === TOP BAR ANIMATION CONSTANTS ===
export const TOP_BAR_ANIM_DURATION = 1.0;
export const TOP_BAR_FINAL_HEIGHT = 62;
export const TOP_BAR_EDGE_WAVE_FREQ = 0.05;
export const TOP_BAR_EDGE_WAVE_AMP = 8;
export const TOP_BAR_EDGE_DAMPENING = 0.1;
export const TOP_BAR_TILT_AMOUNT = 50; // pixels - left side drops lower than right (gravity effect)

// === BOTTOM BAR ANIMATION CONSTANTS ===
export const BOTTOM_BAR_INITIAL_HEIGHT = 0; // Start at 0, grows when droplets merge
export const BOTTOM_BAR_FIRST_HEIGHT = 20; // First target a bit higher
export const BOTTOM_BAR_FINAL_HEIGHT = 62;
export const BOTTOM_BAR_GROWTH_PER_DROPLET = 4; // Increased for faster growth
export const BOTTOM_BAR_RIPPLE_AMP = 5;
export const BOTTOM_BAR_RIPPLE_DECAY = 0.95;
export const BOTTOM_BAR_RIPPLE_DURATION = 0.5;

// === ANIMATION TIMING ===
export const ANIM_TOP_BAR_START = 0.0;
export const ANIM_TEXT_DRIP_START = 0.3;
export const ANIM_DROPLET_START = 1.0; // Start droplets after top bar completes (was 1.5)
export const ANIM_BOTTOM_PUDDLE_START = 2.0;

/**
 * TextDripMask - Manages animated mask for text reveal
 * Creates multiple vertical drip streaks that flow downward
 */
export class TextDripMask {
  private mask: Graphics;
  private drips: DripStreak[];
  private elapsedTime: number = 0;
  private duration: number;
  private textHeight: number;
  private textTop: number;
  private isMobile: boolean;

  constructor(
    mask: Graphics,
    textWidth: number,
    textHeight: number,
    textTop: number,
    isMobile: boolean = false,
  ) {
    this.mask = mask;
    this.textHeight = textHeight;
    this.textTop = textTop;
    this.isMobile = isMobile;
    this.duration = TEXT_DRIP_DURATION;

    // Create drip streaks - fewer on mobile
    const numDrips = isMobile ? 4 : TEXT_NUM_DRIPS;
    this.drips = createDripStreaks(
      numDrips,
      textWidth,
      TEXT_DRIP_SPEED_MIN,
      TEXT_DRIP_SPEED_MAX,
      TEXT_DRIP_WIDTH,
      TEXT_DRIP_EDGE_ROUGHNESS,
    );
  }

  /**
   * Update animation progress
   */
  update(dt: number): void {
    this.elapsedTime += dt;
    const progress = Math.min(this.elapsedTime / this.duration, 1);

    // Update each drip's progress with individual speeds
    this.drips.forEach((drip) => {
      // Each drip progresses at its own speed
      drip.currentProgress = Math.min(progress * drip.speed, 1);
    });
  }

  /**
   * Draw the mask
   */
  draw(): void {
    this.mask.clear();

    // Always show full text - mask is just for drip effect during animation
    // Draw a large rectangle to show all text
    this.mask.rect(-10000, -10000, 20000, 20000);
    this.mask.fill({ color: 0xffffff, alpha: 0 });
  }

  /**
   * Check if animation is complete
   */
  isComplete(): boolean {
    return this.elapsedTime >= this.duration;
  }

  /**
   * Get current progress (0-1)
   */
  getProgress(): number {
    return Math.min(this.elapsedTime / this.duration, 1);
  }

  /**
   * Reset animation
   */
  reset(): void {
    this.elapsedTime = 0;
    this.drips.forEach((drip) => {
      drip.currentProgress = 0;
    });
  }
}

/**
 * BarAnimation - Manages bar growth animations with organic edges
 * Handles both top and bottom bar animations
 */
export class BarAnimation {
  private bar: Graphics;
  private type: "top" | "bottom";
  private currentHeight: number;
  private targetHeight: number;
  private elapsedTime: number = 0;
  private duration: number;
  private width: number;
  private yPosition: number;
  private ripples: Ripple[] = [];
  private animTime: number = 0;
  private isMobile: boolean;
  private mergedDropletCount: number = 0;

  constructor(
    bar: Graphics,
    type: "top" | "bottom",
    width: number,
    yPosition: number,
    isMobile: boolean = false,
  ) {
    this.bar = bar;
    this.type = type;
    this.width = width;
    this.yPosition = yPosition;
    this.isMobile = isMobile;

    if (type === "top") {
      this.currentHeight = 0;
      this.targetHeight = TOP_BAR_FINAL_HEIGHT;
      this.duration = TOP_BAR_ANIM_DURATION;
    } else {
      this.currentHeight = BOTTOM_BAR_INITIAL_HEIGHT;
      this.targetHeight = BOTTOM_BAR_FIRST_HEIGHT;
      this.duration = 0; // Bottom bar grows dynamically
    }
  }

  /**
   * Update animation
   */
  update(dt: number): void {
    this.elapsedTime += dt;
    this.animTime += dt;

    if (this.type === "top") {
      this.updateTopBar(dt);
    } else {
      this.updateBottomBar(dt);
    }

    // Update ripples
    this.ripples = updateRipples(this.ripples, dt);
  }

  /**
   * Update top bar animation (bleed down)
   */
  private updateTopBar(dt: number): void {
    const progress = Math.min(this.elapsedTime / this.duration, 1);
    const eased = easeInOutSine(progress);

    // Smoothly grow height - slower lerp for smoother animation
    const targetH = this.targetHeight * eased;
    this.currentHeight = lerp(this.currentHeight, targetH, 0.15);
  }

  /**
   * Update bottom bar animation (puddle growth)
   */
  private updateBottomBar(_dt: number): void {
    // Target height based on merged droplets
    const dropletGrowth =
      this.mergedDropletCount * BOTTOM_BAR_GROWTH_PER_DROPLET;
    this.targetHeight = Math.max(
      BOTTOM_BAR_FIRST_HEIGHT,
      Math.min(
        BOTTOM_BAR_INITIAL_HEIGHT + dropletGrowth,
        BOTTOM_BAR_FINAL_HEIGHT,
      ),
    );
    // Smoothly interpolate to target - slower for less jumpiness
    const speed = this.mergedDropletCount === 0 ? 2.5 : 0.08;
    if (this.mergedDropletCount > 0) {
      this.currentHeight = lerp(this.currentHeight, this.targetHeight, speed);
    }
  }

  /**
   * Draw the bar
   */
  draw(): void {
    this.bar.clear();

    if (this.currentHeight < 1) return;

    const offset = 100; // Match existing bar offset

    if (this.type === "top") {
      this.drawTopBar(offset);
    } else {
      this.drawBottomBar(offset);
    }
  }

  /**
   * Draw top bar with wavy bottom edge
   */
  private drawTopBar(offset: number): void {
    // Top edge is straight
    this.bar.moveTo(0, 0);
    this.bar.lineTo(this.width, 0);

    // Bottom edge is organic/wavy with tilt (left drops lower than right)
    const dampening = Math.min(this.elapsedTime / this.duration, 1);
    const amplitude = this.isMobile
      ? TOP_BAR_EDGE_WAVE_AMP * 0.6
      : TOP_BAR_EDGE_WAVE_AMP;
    const effectiveAmplitude =
      amplitude * (1 - dampening * TOP_BAR_EDGE_DAMPENING);

    const tilt = this.isMobile
      ? TOP_BAR_TILT_AMOUNT * 0.6
      : TOP_BAR_TILT_AMOUNT;

    const bottomEdge = generateOrganicEdge(
      this.width,
      this.currentHeight,
      effectiveAmplitude,
      TOP_BAR_EDGE_WAVE_FREQ,
      this.animTime,
      2, // roughness
      50, // segments
    );

    // Draw bottom edge (right to left) with tilt applied
    for (let i = bottomEdge.length - 1; i >= 0; i--) {
      const point = bottomEdge[i];
      // Add tilt: left side (x=0) is lower, right side (x=width) is higher
      const tiltOffset = tilt * (1 - point.x / this.width);
      this.bar.lineTo(point.x, point.y + tiltOffset);
    }

    // Close path back to start
    this.bar.lineTo(0, 0);
    this.bar.fill({ color: 0xffffff }); // Will be tinted by filter
  }

  /**
   * Draw bottom bar with rippled top edge
   */
  private drawBottomBar(offset: number): void {
    // Bottom edge is straight (at y=0, since bar is positioned at screen bottom)
    this.bar.moveTo(0, 0);
    this.bar.lineTo(this.width, 0);

    // Top edge has ripples from droplet impacts
    const amplitude = this.isMobile
      ? BOTTOM_BAR_RIPPLE_AMP * 0.6
      : BOTTOM_BAR_RIPPLE_AMP;

    const topEdge = generateEdgeWithRipples(
      this.width,
      -this.currentHeight, // Draw upward from 0
      amplitude, // base amplitude
      0.03, // frequency
      this.animTime,
      1, // roughness
      this.ripples,
      50, // segments
    );

    // Draw top edge (right to left to close path)
    for (let i = topEdge.length - 1; i >= 0; i--) {
      const point = topEdge[i];
      this.bar.lineTo(point.x, point.y);
    }

    // Close path back to start
    this.bar.lineTo(0, 0);
    this.bar.fill({ color: 0xffffff }); // Will be tinted by filter
  }

  /**
   * Add ripple effect (for bottom bar droplet impacts)
   */
  addRipple(x: number, strength: number = BOTTOM_BAR_RIPPLE_AMP): void {
    if (this.type !== "bottom") return;

    this.ripples.push({
      x,
      amplitude: strength,
      phase: 0,
      decay: BOTTOM_BAR_RIPPLE_DECAY,
    });

    // Limit number of active ripples
    if (this.ripples.length > 5) {
      this.ripples.shift();
    }
  }

  /**
   * Notify bar of merged droplet (for bottom bar growth)
   */
  onDropletMerged(): void {
    if (this.type !== "bottom") return;
    this.mergedDropletCount++;
  }

  /**
   * Check if animation is complete
   */
  isComplete(): boolean {
    if (this.type === "top") {
      return this.elapsedTime >= this.duration;
    } else {
      // Bottom bar completes when at final height
      return Math.abs(this.currentHeight - BOTTOM_BAR_FINAL_HEIGHT) < 1;
    }
  }

  /**
   * Get current height
   */
  getHeight(): number {
    return this.currentHeight;
  }

  /**
   * Reset animation
   */
  reset(): void {
    this.elapsedTime = 0;
    this.animTime = 0;
    this.ripples = [];
    this.mergedDropletCount = 0;

    if (this.type === "top") {
      this.currentHeight = 0;
      this.targetHeight = TOP_BAR_FINAL_HEIGHT;
    } else {
      this.currentHeight = BOTTOM_BAR_INITIAL_HEIGHT;
      this.targetHeight = BOTTOM_BAR_INITIAL_HEIGHT;
    }
  }
}
