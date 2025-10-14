/**
 * Blood Animation Utilities
 *
 * Utility functions for creating organic, blood-like animations
 * Used for bar growth, text drip masks, and edge deformations
 */

export interface Point {
  x: number;
  y: number;
}

export interface DripStreak {
  xOffset: number; // Horizontal position
  speed: number; // Fall speed multiplier
  width: number; // Streak width
  edgeVariation: number[]; // Random edge offsets per segment
  currentProgress: number; // 0-1, how far down the drip has traveled
}

export interface Ripple {
  x: number; // Impact position
  amplitude: number; // Ripple strength
  phase: number; // Animation phase (0-1)
  decay: number; // Decay rate per frame
  radius: number; // Influence radius of the ripple
}

/**
 * Generates organic wavy edge for bars/masks
 * Returns array of points suitable for Graphics.poly() or manual drawing
 *
 * @param width - Total width of the edge
 * @param baseY - Base Y position
 * @param amplitude - Maximum vertical displacement
 * @param frequency - Wave frequency (lower = wider waves)
 * @param time - Animation time for moving waves
 * @param roughness - Random variation amount
 * @param segments - Number of points to generate (more = smoother)
 */
export function generateOrganicEdge(
  width: number,
  baseY: number,
  amplitude: number,
  frequency: number,
  time: number,
  roughness: number,
  segments: number = 50,
): Point[] {
  const points: Point[] = [];
  const step = width / segments;

  for (let i = 0; i <= segments; i++) {
    const x = i * step;

    // Primary sine wave (smooth wave motion)
    const wave1 = Math.sin(x * frequency + time) * amplitude;

    // Secondary wave (different frequency for complexity)
    const wave2 =
      Math.sin(x * frequency * 2.3 + time * 1.7) * (amplitude * 0.3);

    // Tertiary wave (high frequency detail)
    const wave3 =
      Math.sin(x * frequency * 5.1 - time * 0.8) * (amplitude * 0.15);

    // Random roughness (stable per position, varies with time)
    const seed = x * 0.01 + time * 0.1;
    const rough = Math.sin(seed * 13.37) * Math.cos(seed * 7.11) * roughness;

    const y = baseY + wave1 + wave2 + wave3 + rough;
    points.push({ x, y });
  }

  return points;
}

/**
 * Creates a set of vertical drip streaks for text masking
 * Each drip has randomized properties for organic appearance
 *
 * @param count - Number of drips
 * @param width - Total width to distribute drips across
 * @param minSpeed - Minimum speed multiplier
 * @param maxSpeed - Maximum speed multiplier
 * @param baseWidth - Base width of each drip
 * @param edgeRoughness - Roughness of drip edges
 */
export function createDripStreaks(
  count: number,
  width: number,
  minSpeed: number,
  maxSpeed: number,
  _baseWidth: number,
  edgeRoughness: number,
): DripStreak[] {
  const drips: DripStreak[] = [];
  const spacing = width / (count + 1);

  for (let i = 0; i < count; i++) {
    // Position with slight random offset
    const xOffset = spacing * (i + 1) + (Math.random() - 0.5) * spacing * 0.3;

    // Random speed within range
    const speed = minSpeed + Math.random() * (maxSpeed - minSpeed);

    // Width variation
    const widthVar = 0.1 + Math.random() * 0.6; // 0.7x to 1.3x base width
    const dripWidth = 0.1 * widthVar;

    // Generate edge variation points (10 segments per drip)
    const edgeVariation: number[] = [];
    for (let j = 0; j < 10; j++) {
      edgeVariation.push((Math.random() - 0.5) * edgeRoughness);
    }

    drips.push({
      xOffset,
      speed,
      width: dripWidth,
      edgeVariation,
      currentProgress: 0,
    });
  }
  console.log(drips);
  return drips;
}

/**
 * Draws a single organic drip shape using bezier curves
 * Similar to droplet shape but vertical and elongated
 *
 * @param graphics - PixiJS Graphics object to draw on
 * @param x - Center X position
 * @param topY - Top Y position
 * @param bottomY - Bottom Y position (current progress)
 * @param width - Drip width
 * @param edgeVariation - Array of random offsets for organic edges
 */
export function drawDripShape(
  graphics: import("pixi.js").Graphics, // Graphics type from PixiJS
  x: number,
  topY: number,
  bottomY: number,
  width: number,
  edgeVariation: number[],
): void {
  const height = bottomY - topY;
  const halfWidth = width / 2;

  // Skip if too small
  if (height < 5) return;

  // Top edge (irregular horizontal edge from pool)
  const topEdgeWave = edgeVariation[0] || 0;
  graphics.moveTo(x - halfWidth + edgeVariation[1], topY + topEdgeWave);

  // Draw top edge with slight curve
  graphics.lineTo(x + halfWidth + edgeVariation[2], topY + topEdgeWave);

  // Right side - flow downward with organic curves
  const segments = Math.min(edgeVariation.length - 3, Math.floor(height / 20));
  const segmentHeight = height / segments;

  for (let i = 0; i < segments; i++) {
    const segmentY = topY + segmentHeight * (i + 1);
    const edgeIdx = Math.min(3 + i, edgeVariation.length - 1);
    const xOffset = edgeVariation[edgeIdx];

    // Taper towards bottom (drip gets thinner)
    const taper = 1 - (i / segments) * 0.3; // Maintain 70% width at bottom
    const segmentWidth = halfWidth * taper;

    graphics.lineTo(x + segmentWidth + xOffset, segmentY);
  }

  // Bottom tip (pointy drip end)
  const tipOffset = edgeVariation[edgeVariation.length - 1] || 0;
  graphics.lineTo(x + tipOffset * 0.3, bottomY);

  // Left side - mirror back up
  for (let i = segments - 1; i >= 0; i--) {
    const segmentY = topY + segmentHeight * (i + 1);
    const edgeIdx = Math.min(3 + i, edgeVariation.length - 1);
    const xOffset = edgeVariation[edgeIdx];

    const taper = 1 - (i / segments) * 0.3;
    const segmentWidth = halfWidth * taper;

    graphics.lineTo(x - segmentWidth - xOffset, segmentY);
  }

  // Close path back to start
  graphics.lineTo(x - halfWidth + edgeVariation[1], topY + topEdgeWave);

  graphics.fill({ color: 0xffffff, alpha: 1 });
}

/**
 * Updates ripples - decay amplitude and advance phase
 * Returns filtered array with only active ripples
 */
export function updateRipples(ripples: Ripple[], dt: number): Ripple[] {
  return ripples
    .map((ripple) => ({
      ...ripple,
      // Phase does not advance for growth ripples, they just decay
      phase: ripple.phase + (ripple.radius > 200 ? 0 : dt),
      amplitude: ripple.amplitude * ripple.decay,
    }))
    .filter((ripple) => ripple.amplitude > 0.1);
}

/**
 * Generates organic edge with ripple distortions applied
 * Combines base organic edge with impact ripples
 */
export function generateEdgeWithRipples(
  width: number,
  baseY: number,
  amplitude: number,
  frequency: number,
  time: number,
  roughness: number,
  visualRipples: Ripple[],
  growthRipples: Ripple[],
  segments: number = 50,
): Point[] {
  const basePoints = generateOrganicEdge(
    width,
    baseY,
    amplitude,
    frequency,
    time,
    roughness,
    segments,
  );

  // Apply ripple distortions
  return basePoints.map((point) => {
    let yOffset = 0;

    // 1. Apply persistent growth ripples to the base height
    growthRipples.forEach((ripple) => {
      const dist = Math.abs(point.x - ripple.x);
      if (dist < ripple.radius) {
        // Growth ripples are a simple cosine mound
        const falloff = (1 + Math.cos((dist / ripple.radius) * Math.PI)) / 2;
        yOffset -= falloff * ripple.amplitude; // Subtract because we draw upwards
      }
    });

    // 2. Apply short-lived visual ripples on top
    visualRipples.forEach((ripple) => {
      const dist = Math.abs(point.x - ripple.x);
      if (dist < ripple.radius) {
        const falloff = (1 - dist / ripple.radius) ** 2;
        const wave =
          Math.sin(ripple.phase * Math.PI * 2) * falloff * ripple.amplitude;
        yOffset += wave;
      }
    });

    return {
      x: point.x,
      y: point.y + yOffset,
    };
  });
}

/**
 * Interpolates between current value and target with easing
 */
export function lerp(current: number, target: number, speed: number): number {
  return current + (target - current) * speed;
}

/**
 * Cubic ease-out function for smooth deceleration
 */
export function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3;
}

/**
 * Cubic ease-in function for smooth acceleration
 */
export function easeInCubic(t: number): number {
  return t * t * t;
}

/**
 * Sine ease-in-out for smooth organic motion
 */
export function easeInOutSine(t: number): number {
  return -(Math.cos(Math.PI * t) - 1) / 2;
}
