export interface DropletSeed {
  id: string;
  offset: number; // percentage 0-100
  scale: number; // multiplier applied to base droplet size
  delay: number; // seconds before animation becomes visible
  phase: number; // starting position within the animation loop (0-1)
}
