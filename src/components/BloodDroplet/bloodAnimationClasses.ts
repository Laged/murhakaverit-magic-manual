/**
 * Blood Animation Classes
 *
 * Animation systems for organic blood appearance effects
 */

// Use any for Graphics type since we're in .ts file
// Will be properly typed when used in .tsx files
type Graphics = import("pixi.js").Graphics;

import {
  easeInOutSine,
  easeOutCubic,
  generateEdgeWithRipples,
  generateOrganicEdge,
  lerp,
  type Ripple,
  updateRipples,
} from "./bloodAnimationUtils";

// === TOP BAR ANIMATION CONSTANTS ===
export const TOP_BAR_ANIM_DURATION = 1.0;
export const TOP_BAR_FINAL_HEIGHT = 62;
export const TOP_BAR_EDGE_WAVE_FREQ = 0.05;
export const TOP_BAR_EDGE_WAVE_AMP = 4;
export const TOP_BAR_EDGE_DAMPENING = 0.1;
export const TOP_BAR_TILT_AMOUNT = 50; // pixels - left side drops lower than right (gravity effect)

// === BOTTOM BAR ANIMATION CONSTANTS ===
export const BOTTOM_BAR_BASE_HEIGHT = 40; // New: Base height for the puddle
export const BOTTOM_BAR_FINAL_HEIGHT = 80;
export const BOTTOM_BAR_RIPPLE_AMP = 8; // Increased ripple strength
export const BOTTOM_BAR_ORGANIC_NOISE = 1.5; // Controls base waviness
export const BOTTOM_BAR_RIPPLE_DECAY = 0.96; // Slower decay
export const BOTTOM_BAR_RIPPLE_DURATION = 0.8; // Longer ripple
export const BOTTOM_BAR_GROWTH_RIPPLE_AMP = 5; // Reduced for subtlety
export const BOTTOM_BAR_GROWTH_RIPPLE_DECAY = 0.99; // Very slow decay for persistent growth
export const BOTTOM_BAR_GROWTH_RIPPLE_RADIUS = 300; // Wider radius for a gentle swell

// === ANIMATION TIMING ===
export const ANIM_TOP_BAR_START = 0.0;
export const ANIM_DROPLET_START = 1.0; // Start droplets after top bar completes (was 1.5)
export const ANIM_BOTTOM_PUDDLE_START = 2.0;

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
  private ripples: Ripple[] = [];
  private growthRipples: Ripple[] = []; // For localized growth
  private exitRipples: Ripple[] = []; // For top bar droplet exits
  private initialGrowthActive: boolean = false;
  private initialGrowthTimer: number = 0;
  private animTime: number = 0;
  private isMobile: boolean;
  private mergedDropletCount: number = 0;

  constructor(
    bar: Graphics,
    type: "top" | "bottom",
    width: number,
    isMobile: boolean = false,
  ) {
    this.bar = bar;
    this.type = type;
    this.width = width;
    this.isMobile = isMobile;

    if (type === "top") {
      this.currentHeight = 0;
      this.targetHeight = TOP_BAR_FINAL_HEIGHT;
      this.duration = TOP_BAR_ANIM_DURATION;
    } else {
      this.currentHeight = 0;
      this.targetHeight = 0;
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

    // Update all ripple types
    this.ripples = updateRipples(this.ripples, dt);
    this.growthRipples = updateRipples(this.growthRipples, dt);
    this.exitRipples = updateRipples(this.exitRipples, dt);
  }

  /**
   * Update top bar animation (bleed down)
   */
  private updateTopBar(_dt: number): void {
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
    let baseTarget = 0;

    // Trigger initial growth on first droplet merge
    if (
      this.mergedDropletCount > 0 &&
      !this.initialGrowthActive &&
      this.initialGrowthTimer === 0
    ) {
      this.initialGrowthActive = true;
    }

    // Animate the base height from 0 to BOTTOM_BAR_BASE_HEIGHT
    if (this.initialGrowthActive) {
      this.initialGrowthTimer += _dt;
      const duration = 1.5; // seconds
      const progress = Math.min(this.initialGrowthTimer / duration, 1.0);
      baseTarget = easeOutCubic(progress) * BOTTOM_BAR_BASE_HEIGHT;
      if (progress >= 1.0) {
        this.initialGrowthActive = false; // Animation complete
      }
    } else if (this.mergedDropletCount > 0) {
      // After initial animation, base is fixed at BOTTOM_BAR_BASE_HEIGHT
      baseTarget = BOTTOM_BAR_BASE_HEIGHT;
    }

    // Add subtle growth from ripples on top of the base
    let totalGrowthAmplitude = 0;
    for (const ripple of this.growthRipples) {
      totalGrowthAmplitude += ripple.amplitude;
    }
    const growthContribution = totalGrowthAmplitude / 10;

    // Combine base height with ripple growth, capped at the final max height
    this.targetHeight = Math.min(
      baseTarget + growthContribution,
      BOTTOM_BAR_FINAL_HEIGHT,
    );

    // Smoothly interpolate to the target height.
    this.currentHeight = lerp(this.currentHeight, this.targetHeight, 0.08);
  }

  /**
   * Draw the bar
   */
  draw(): void {
    this.bar.clear();

    if (this.type === "top" && this.currentHeight < 1) return;
    // For bottom bar, we draw even if height is 0 to show initial ripples
    if (
      this.type === "bottom" &&
      this.currentHeight < 0.1 &&
      this.ripples.length === 0 &&
      this.growthRipples.length === 0
    )
      return;

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
  private drawTopBar(_offset: number): void {
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

    // Apply exit ripples to the bottom edge
    const finalEdge = bottomEdge.map((point) => {
      let yOffset = 0;
      this.exitRipples.forEach((ripple) => {
        const dist = Math.abs(point.x - ripple.x);
        if (dist < ripple.radius) {
          const falloff = (1 - dist / ripple.radius) ** 2;
          // Note: strength is negative to pull the surface upwards
          const wave =
            Math.sin(ripple.phase * Math.PI * 2) * falloff * ripple.amplitude;
          yOffset += wave;
        }
      });
      return { x: point.x, y: point.y + yOffset };
    });

    // Draw bottom edge (right to left) with tilt applied
    for (let i = finalEdge.length - 1; i >= 0; i--) {
      const point = finalEdge[i];
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
  private drawBottomBar(_offset: number): void {
    const verticalOffset = 0; // Extra padding for the blur filter

    // First, draw the main wavy bar.
    const heightFactor = Math.min(
      this.currentHeight / (BOTTOM_BAR_FINAL_HEIGHT / 2),
      1.0,
    );
    const organicAmplitude =
      (this.isMobile
        ? BOTTOM_BAR_ORGANIC_NOISE * 0.6
        : BOTTOM_BAR_ORGANIC_NOISE) * heightFactor;

    const topEdge = generateEdgeWithRipples(
      this.width,
      -this.currentHeight, // Draw upward from 0
      organicAmplitude, // base amplitude
      0.03, // frequency
      this.animTime,
      1, // roughness
      this.ripples, // Visual ripples
      this.growthRipples, // Growth ripples
      50, // segments
    );

    // Path for the main bar (bottom edge at y=0)
    this.bar.moveTo(this.width, 0);
    for (let i = topEdge.length - 1; i >= 0; i--) {
      const point = topEdge[i];
      this.bar.lineTo(point.x, point.y);
    }
    this.bar.lineTo(0, 0);
    this.bar.closePath();
    this.bar.fill({ color: 0xffffff });

    // Now, draw a simple rectangle below y=0 to act as blur padding.
    // This extends off-screen.
    this.bar.rect(0, 0, this.width, verticalOffset);
    this.bar.fill({ color: 0xffffff });
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
      radius: 120, // Visual ripples are more focused
    });

    // Limit number of active ripples
    if (this.ripples.length > 5) {
      this.ripples.shift();
    }
  }

  /**
   * Add an exit ripple effect to the top bar
   */
  addExitRipple(x: number, strength: number): void {
    if (this.type !== "top") return;

    this.exitRipples.push({
      x,
      amplitude: strength,
      phase: 0,
      decay: 0.9, // Faster decay for exit ripples
      radius: 100, // Smaller radius for exit ripples
    });

    if (this.exitRipples.length > 5) {
      this.exitRipples.shift();
    }
  }

  /**
   * Notify bar of merged droplet (for bottom bar growth)
   */
  onDropletMerged(x: number, scale: number): void {
    if (this.type !== "bottom") return;
    this.mergedDropletCount++;

    // Make larger droplets create bigger growth ripples
    const amplitude = BOTTOM_BAR_GROWTH_RIPPLE_AMP * scale;

    // Add a new growth ripple at the impact location
    this.growthRipples.push({
      x,
      amplitude,
      phase: 0,
      decay: BOTTOM_BAR_GROWTH_RIPPLE_DECAY,
      radius: BOTTOM_BAR_GROWTH_RIPPLE_RADIUS,
    });
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
    this.growthRipples = [];
    this.exitRipples = [];
    this.mergedDropletCount = 0;
    this.initialGrowthActive = false;
    this.initialGrowthTimer = 0;

    if (this.type === "top") {
      this.currentHeight = 0;
      this.targetHeight = TOP_BAR_FINAL_HEIGHT;
    } else {
      this.currentHeight = 0;
      this.targetHeight = 0;
    }
  }
}
