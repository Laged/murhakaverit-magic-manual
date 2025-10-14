# Animated Blood Appearance Plan

**Goal:** Make the blood appearance animations more dramatic and "drippy" with smooth, gooey blood-flow effects using PixiJS.

---

## Current State Analysis

### Red Text Background Animation
**Location:** `PixiDropletIndividual.tsx:493-519` (title intro section)

**Current Approach:**
- Simple linear alpha fade + scale animation over 1.2 seconds
- Text starts at alpha=0, scale=0.88 and linearly interpolates to alpha=1, scale=1
- Cubic easing applied: `eased = 1 - (1 - progress)³`
- **Problem:** Text appears "instantly" with uniform fill - no blood-drip effect

```typescript
// Current implementation (L493-519)
titleIntroElapsed += dt;
const progress = Math.min(titleIntroElapsed / TITLE_INTRO_DURATION, 1);
const eased = 1 - (1 - progress) ** 3;
const scale = 0.88 + eased * 0.12;
titleText.scale.set(scale);
titleText.alpha = eased;
```

### Red Bars (Top/Bottom Pools)
**Location:** `PixiDropletSceneWrapper.tsx:298-307` (HTML prerender)

**Current Approach:**
- Static HTML/CSS bars with fixed height (62px) and solid color (#880808)
- PixiJS renders bars on top with same dimensions but they appear suddenly
- **Problem:** Two-phase appearance - HTML bars visible, then PixiJS bars pop in larger

```tsx
// Current HTML prerender (PixiDropletSceneWrapper.tsx:298-307)
<div className="absolute top-0 left-0 right-0 h-[62px]" 
     style={{ backgroundColor: "#880808" }} />
<div className="absolute bottom-0 left-0 right-0 h-[62px]" 
     style={{ backgroundColor: "#880808" }} />
```

### Droplet Physics System
**Location:** `PixiDropletIndividual.tsx:84-865`

**Key Features We Can Reuse:**
1. **Squash & Stretch:** Dynamic Y-scale changes based on velocity/phase
   - `FREEFALL_STRETCH_SCALE = 1.5` (elongate during fall)
   - `ENTRY_SQUASH_SCALE = 0.7` (compress on impact)
   - `EXIT_STRETCH_SCALE = 1.7` (stretch when exiting)
   - Smooth interpolation: `lerp(current, target, SCALE_LERP_SPEED)`

2. **Goo Effect Filters:**
   - `BlurFilter` (strength: 20, quality: 10)
   - `ColorMatrixFilter` for alpha multiply/offset (creates goo merging)
   - Color tint filter (#880808)

3. **Organic Shape Generation:**
   - Bezier curves with random variation (`TIP_OFFSET_VARIATION`)
   - Asymmetric bulges and neck lengths
   - Dynamic per-droplet shape

4. **Phase-Based Physics:**
   - Spawn → Freefall → InFluid → Merge
   - Friction curves with entry/middle/exit zones
   - Velocity-based animation

---

## Proposed Solution

### 1. Animated Text Background ("Blood Dripping" Effect)

**Concept:** Blood drips from top to bottom through the text with uneven, organic borders.

**Implementation Approach:**
Create a **mask animation** that reveals the red text from top to bottom with irregular edges.

#### Technical Details:

**A. Create Organic Drip Mask**
- Use PixiJS `Graphics` to draw multiple overlapping "drips" that flow downward
- Each drip uses the same bezier curve logic as droplets (organic shapes)
- Stagger drip animations with random delays for uneven appearance

**B. Mask Animation Phases:**
```
Phase 1 (0.0s - 0.3s): Top edge appears with irregular drips
Phase 2 (0.3s - 0.9s): Main fill flows downward with wavy vertical border
Phase 3 (0.9s - 1.2s): Bottom completes with final drips reaching bottom edge
```

**C. Key Parameters:**
```typescript
const TEXT_DRIP_DURATION = 1.2; // Match existing TITLE_INTRO_DURATION
const NUM_TEXT_DRIPS = 8; // Number of vertical drip streaks
const DRIP_SPEED_VARIATION = 0.3; // Random speed multiplier per drip
const DRIP_WIDTH = 50; // Base width of each drip streak
const DRIP_EDGE_ROUGHNESS = 20; // Pixel variation in drip edges
```

**D. Implementation Strategy:**
1. Create `Graphics` object as mask for `titleText`
2. Each frame, update mask by drawing organic vertical "drip streaks"
3. Use bezier curves with random offsets to create irregular drip edges
4. Apply same blur/goo filters to mask for organic merging
5. Reveal text progressively as mask expands downward

**E. Vertical Drip Shape Formula:**
```typescript
// Similar to droplet shape, but vertical and elongated
// Top: Irregular horizontal edge (bleeding from top pool)
// Middle: Vertical flow with wavy sides
// Bottom: Dripping tips that extend at different rates
```

---

### 2. Animated Red Bars (Top/Bottom Pools)

**Concept:** Bars grow/expand with organic edges to simulate blood pooling.

**Implementation Approach:**
Animate bar **height** and **edge deformation** to create organic growth.

#### Top Bar Animation:

**Concept:** Blood "bleeds down" from top of screen, pooling at top position.

**Phases:**
```
Phase 1 (0.0s - 0.4s): Initial bleed - thin stream appears
Phase 2 (0.4s - 0.8s): Pool forms - height grows with irregular bottom edge
Phase 3 (0.8s - 1.0s): Stabilize - reaches final height (62px)
```

**Technical Details:**
- Start with height=0, grow to height=62px
- Bottom edge uses wavy deformation (sine wave + noise)
- Apply same goo filters (blur + alpha matrix) for organic look
- Edge waviness dampens as pool stabilizes

```typescript
const TOP_BAR_DRIP_DURATION = 1.0;
const TOP_BAR_EDGE_WAVE_FREQUENCY = 0.05; // Horizontal wave frequency
const TOP_BAR_EDGE_WAVE_AMPLITUDE = 8; // Max pixel variation
const TOP_BAR_EDGE_DAMPENING = 0.7; // Reduce waviness as it stabilizes
```

#### Bottom Bar Animation:

**Concept:** First droplets merge into puddle, then puddle expands.

**Strategy:** Use existing droplet merge physics, but enhance puddle growth.

**Phases:**
```
Phase 1 (0.0s - 1.5s): Wait for first droplets to fall
Phase 2 (1.5s - 2.5s): Puddle forms as droplets merge
Phase 3 (2.5s - 3.0s): Puddle expands with ripple effect
```

**Technical Details:**
- Bottom bar starts at minimum height (e.g. 20px)
- Grows as droplets merge (track merged droplet count)
- Top edge has ripple deformation when droplets impact
- Ripples fade over time
- Final height: 62px

```typescript
const BOTTOM_BAR_INITIAL_HEIGHT = 20;
const BOTTOM_BAR_GROWTH_PER_DROPLET = 7; // Height added per merged droplet
const BOTTOM_BAR_RIPPLE_AMPLITUDE = 12; // Impact ripple strength
const BOTTOM_BAR_RIPPLE_DECAY = 0.95; // Ripple fade rate per frame
```

---

### 3. Synchronized Animation Timeline

**Goal:** Create cohesive "blood flow" narrative.

**Timeline:**
```
0.0s: Top bar starts bleeding down
0.3s: First text drips appear at top
0.5s: Top bar pool forms (height ~40px)
0.8s: Top bar stabilizes (height 62px)
0.8s: Text drips reach middle of text
1.0s: Top bar complete
1.2s: Text drips complete (full text visible)
1.5s: First droplets start falling from top pool
2.0s: First droplets hit bottom
2.5s: Bottom puddle forms
3.0s: Bottom puddle stabilizes (height 62px)
3.0s: Continuous droplet loop begins
```

**Key Insight:** Stagger animations to create visual flow narrative:
1. Top pool appears first (blood source)
2. Text fills as blood "drips through" letters
3. Droplets begin falling once pools are visible
4. Bottom pool grows as droplets accumulate

---

## Technical Implementation Plan

### New Components to Create:

#### 1. `OrganicEdge` Utility Function
```typescript
/**
 * Generates organic wavy edge for bars/masks
 * Returns array of {x, y} points for Graphics.poly()
 */
function generateOrganicEdge(
  width: number,
  baseY: number,
  amplitude: number,
  frequency: number,
  time: number, // For animation
  roughness: number // Random variation
): Point[]
```

#### 2. `TextDripMask` Animation System
```typescript
/**
 * Manages animated mask for text reveal
 * Creates multiple vertical drip streaks
 * Updates mask geometry each frame
 */
class TextDripMask {
  mask: Graphics;
  drips: DripStreak[];
  progress: number;
  
  update(dt: number): void;
  draw(): void;
}

interface DripStreak {
  xOffset: number;     // Horizontal position
  speed: number;       // Fall speed multiplier
  width: number;       // Streak width
  edgeVariation: number[]; // Random edge offsets
}
```

#### 3. Enhanced Bar Animation System
```typescript
/**
 * Manages top/bottom bar growth animations
 * Handles edge deformation and ripple effects
 */
class BarAnimation {
  bar: Graphics;
  currentHeight: number;
  targetHeight: number;
  edgePoints: Point[];
  ripples: Ripple[];
  
  update(dt: number): void;
  addRipple(x: number, strength: number): void;
  draw(): void;
}

interface Ripple {
  x: number;           // Impact position
  amplitude: number;   // Ripple strength
  phase: number;       // Animation phase (0-1)
}
```

---

## Constants to Add

```typescript
// === TEXT DRIP ANIMATION ===
const TEXT_DRIP_DURATION = 1.2;
const TEXT_NUM_DRIPS = 8;
const TEXT_DRIP_SPEED_MIN = 0.7;
const TEXT_DRIP_SPEED_MAX = 1.3;
const TEXT_DRIP_WIDTH = 50;
const TEXT_DRIP_EDGE_ROUGHNESS = 20;

// === TOP BAR ANIMATION ===
const TOP_BAR_ANIM_DURATION = 1.0;
const TOP_BAR_FINAL_HEIGHT = 62;
const TOP_BAR_EDGE_WAVE_FREQ = 0.05;
const TOP_BAR_EDGE_WAVE_AMP = 8;
const TOP_BAR_EDGE_DAMPENING = 0.7;

// === BOTTOM BAR ANIMATION ===
const BOTTOM_BAR_INITIAL_HEIGHT = 20;
const BOTTOM_BAR_FINAL_HEIGHT = 62;
const BOTTOM_BAR_GROWTH_PER_DROPLET = 7;
const BOTTOM_BAR_RIPPLE_AMP = 12;
const BOTTOM_BAR_RIPPLE_DECAY = 0.95;
const BOTTOM_BAR_RIPPLE_DURATION = 0.8;

// === ANIMATION TIMING ===
const ANIM_TOP_BAR_START = 0.0;
const ANIM_TEXT_DRIP_START = 0.3;
const ANIM_DROPLET_START = 1.5;
const ANIM_BOTTOM_PUDDLE_START = 2.0;
```

---

## Implementation Steps

### Step 1: Organic Edge Utility
- Create `generateOrganicEdge()` function
- Test with simple bar animation
- Tune parameters for "blood-like" appearance

### Step 2: Top Bar Animation
- Replace static top bar with animated Graphics
- Implement height growth + edge deformation
- Apply goo filters

### Step 3: Text Drip Mask
- Create TextDripMask class
- Generate vertical drip streaks
- Apply as mask to titleText
- Test reveal animation

### Step 4: Bottom Bar Animation
- Implement dynamic height based on merged droplets
- Add ripple system for droplet impacts
- Synchronize with existing droplet physics

### Step 5: Remove HTML Prerender Bars
- Delete static HTML bars from PixiDropletSceneWrapper
- Ensure PixiJS animations cover entire loading period

### Step 6: Polish & Timing
- Fine-tune animation speeds
- Adjust easing curves for organic feel
- Test on mobile (may need reduced complexity)

---

## Mobile Considerations

- Reduce number of drip streaks (8 → 4)
- Simplify edge deformation (fewer points in organic edge)
- May need to reduce blur strength (performance)
- Test on actual devices for frame rate

---

## Expected Result

**Visual Flow:**
1. Screen starts pure black
2. Top bar "bleeds down" with wavy bottom edge (0.0s - 1.0s)
3. Red text appears from top→bottom with irregular drip borders (0.3s - 1.2s)
4. Individual droplets start falling from stabilized top pool (1.5s+)
5. Bottom puddle grows organically as droplets merge (2.0s - 3.0s)
6. Continuous droplet animation loop begins (3.0s+)

**Technical Improvements:**
- Eliminate two-phase bar appearance (no more HTML prerender)
- Text appears with organic "blood dripping" effect
- All animations use consistent goo aesthetic
- Smooth, cohesive narrative of blood flow

**Code Organization:**
- Reuse existing droplet physics/filters
- Modular animation systems (easy to tune)
- Clear separation of concerns (edge generation, mask animation, bar growth)

---

## Next Actions

1. **Prototype organic edge generation** - prove the concept works
2. **Implement top bar animation** - simplest starting point
3. **Create text drip mask system** - most complex, save for when edge generation is working
4. **Add bottom bar growth** - build on existing droplet merge
5. **Polish timing and easing** - final tweaks for cohesive feel

---

## Notes

- All animations should feel "organic" not mechanical
- Reuse existing blur + alpha matrix filters for consistency
- Keep performance in mind (especially for mobile)
- Animation should be impressive but not distracting
- Total intro animation: ~3 seconds before steady-state loop

---

*This plan leverages the existing sophisticated droplet physics system and extends its organic, gooey aesthetic to the bar and text appearance animations.*
