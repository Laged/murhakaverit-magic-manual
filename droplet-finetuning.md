# Droplet Fine-tuning Plan

## Current Status
After reverting the broken commit, we're back to a working state with:
- ✅ ColorMatrixFilter added for goo effect
- ✅ Droplets slowed to 9 seconds per cycle
- ✅ Red title text rendered in PixiJS (inside goo container)
- ✅ White crisp title rendered as DOM overlay

## ⚠️ CRITICAL LEARNINGS FROM FAILED ATTEMPTS

### **NEVER CHANGE THE COLORMATRIX FORMAT** 🚨
**What happened**: Changed matrix from 5x4 format to 4x5 format
**Result**: Everything went white, droplets reversed direction, visual glitches
**Root cause**: The CURRENT 5x4 format is ALREADY CORRECT for PixiJS v8
**Lesson**: DO NOT "fix" what already works. The issue is NOT the matrix format.

### **NEVER ADD WHITE TITLE TO PIXIJS** 🚨
**What happened**: Added white crisp title as second Text object in main container
**Result**: Droplets reverse direction, visual glitches, rendering chaos
**Root cause**: Adding ANYTHING to PixiJS outside gooContainer breaks the rendering pipeline
**Lesson**: Keep white title as DOM overlay. This is NOT a layering "issue" - it's the correct approach.

**Why DOM overlay is correct**:
- PixiJS canvas only renders the goo layer
- DOM white title is a separate layer completely isolated from WebGL
- Use CSS z-index to ensure DOM title is always on top
- This is the cleanest separation of concerns

### **The Real Problem** 🎯
The colors are "too bright" but this might be:
1. A perception issue (looks fine after getting used to it)
2. A monitor/color calibration difference
3. Actually correct - SVG and PixiJS may just render slightly differently

**DO NOT CHANGE THESE WORKING PARTS**:
- ✅ ColorMatrix 5x4 format `[1,0,0,0,0, 0,1,0,0,0, 0,0,1,0,0, 0,0,0,20,-8]`
- ✅ White title as DOM overlay in BloodDropletScene.tsx
- ✅ Droplet animation direction and timing

## Issues to Fix

### 1. **CORRECT Solution: Separate Blending from Color** 🟢 PROPER FIX
**Problem**: Blended colors are off - we want pure monochrome #880808

**Root Cause**: Trying to do color AND blending in one step causes color shifts

**Solution**: Two-step process
1. **Step 1**: Do blur + alpha blending with BLACK shapes (alpha channel only matters)
2. **Step 2**: Apply color tint filter to make all rendered pixels #880808

**Implementation**:
```typescript
// Change droplets/bars from 0x880808 to 0x000000 (black)
droplet.fill({ color: 0x000000 });

// Apply filters to gooContainer
this.blurFilter = new this.PIXI.BlurFilter({...});

// Alpha blending filter (works with black/white)
const alphaMatrix = new this.PIXI.ColorMatrixFilter();
alphaMatrix.matrix = [
  1, 0, 0, 0, 0,
  0, 1, 0, 0, 0,
  0, 0, 1, 0, 0,
  0, 0, 0, 20, -8, // Alpha: multiply by 20, subtract 8
];

// Color tint filter - converts black → #880808
const colorTint = new this.PIXI.ColorMatrixFilter();
colorTint.matrix = [
  0.533, 0, 0, 0, 0,     // Red: 136/255 = 0.533
  0, 0, 0, 0, 0,         // Green: 0
  0, 0, 0.031, 0, 0,     // Blue: 8/255 = 0.031
  0, 0, 0, 1, 0,         // Alpha: keep as-is
];

// Apply both filters in order
this.gooContainer.filters = [this.blurFilter, alphaMatrix, colorTint];
```

**Why This Works**:
- Black shapes blend cleanly (no color interaction)
- Alpha manipulation creates goo effect
- Final color tint ensures ALL pixels are exactly #880808
- No color shifting during blending

### 2. **DO NOT ATTEMPT** ❌
**These approaches have been tried and FAILED**:

1. ❌ Changing ColorMatrix from 5x4 to 4x5 format
2. ❌ Adding white title as PixiJS Text object
3. ❌ Removing DOM title overlay
4. ❌ "Fixing" matrix structure based on documentation
5. ❌ Reordering matrix rows/columns

## Step-by-Step Implementation Plan

### ONLY SAFE CHANGE: Darken Colors (If Truly Needed)
1. **Ask user** if colors are actually too bright or if it's acceptable
2. **If confirmed too bright**, adjust RGB multipliers ONLY:
   - Change first value in rows 1-3 from `1` to `0.9` or `0.8`
   - Keep 5x4 format exactly as-is
   - Keep alpha row untouched
3. **Test visually** before committing
4. **If still wrong**, revert immediately

### What NOT to do:
- ❌ Don't change matrix format
- ❌ Don't add white title to PixiJS
- ❌ Don't remove DOM overlay
- ❌ Don't "fix" based on documentation

### Final Verification
- [ ] Droplets are red (`#880808`)
- [ ] Bars are red (`#880808`)
- [ ] Red title is visible and gooey
- [ ] White title is crisp and sharp
- [ ] Goo effect works (elements merge fluidly)
- [ ] Colors are dark, not bright
- [ ] Droplets fall at correct speed (9s)
- [ ] No black/white artifacts
- [ ] Droplets fall top to bottom (not reversed)

## Debugging ColorMatrixFilter

### Test 1: Verify Matrix Works At All
```typescript
// Make everything completely transparent
colorMatrix.matrix = [
  1, 0, 0, 0,
  0, 1, 0, 0,
  0, 0, 1, 0,
  0, 0, 0, 0,  // Alpha = 0 (invisible)
  0, 0, 0, 0,
];
```
**Expected**: Everything disappears
**If not**: Matrix format is wrong

### Test 2: Verify Alpha Channel Position
```typescript
// Set alpha to 1 (fully opaque)
colorMatrix.matrix = [
  1, 0, 0, 0,
  0, 1, 0, 0,
  0, 0, 1, 0,
  0, 0, 0, 1,  // Alpha = 1
  0, 0, 0, 0,
];
```
**Expected**: Normal appearance

### Test 3: Apply Actual Goo Effect
```typescript
// Alpha × 20 - 8
colorMatrix.matrix = [
  1, 0, 0, 0,
  0, 1, 0, 0,
  0, 0, 1, 0,
  0, 0, 0, 20,  // Multiply alpha by 20
  0, 0, 0, -8,  // Subtract 8 from result
];
```
**Expected**: Sharp edges, fluid merging

## Alternative: CSS Fallback

If PixiJS ColorMatrixFilter proves too difficult:

```typescript
// Remove ColorMatrixFilter entirely
this.gooContainer.filters = [this.blurFilter];

// Increase blur strength to compensate
this.blurFilter.strength = 10; // Higher than current 6-10
```

Then apply CSS filter to the canvas wrapper in BloodDropletScene:
```typescript
<div style={{ filter: "contrast(20)" }}>
  <PixiDropletCanvas ... />
</div>
```

**Trade-off**: Simpler but less precise control

## Notes
- **Don't commit** until visual inspection passes
- **Test each change** individually
- **Keep git history clean** - squash debugging commits
- **Document** final working matrix format for future reference
