# Visual Finetuning Todo List

## Landing Page Animation Fixes

### 🔴 Priority Issues

- [x] **Issue #1: Droplets falling outside text bounds**
  - Problem: Droplets spawn and fall outside text area (yolo offsets)
  - Solution: Calculate droplet spawn X based on actual text top-left/top-right corners
  - Status: ✅ Complete & Refined
  - Changes: 
    - Use `titleText.getBounds()` to get actual text dimensions
    - Left margin: 5% of text width to avoid leftmost chars
    - Right margin: subtract charWidth (fontSize * 0.6) to avoid rightmost chars (-, T)
    - Changed from percentage-based to absolute pixel positioning
  - Commits: 
    - `fix: constrain droplets to text bounds`
    - `refine: avoid droplets on rightmost characters`
    - `debug: add blue border to visualize text bounds`
    - `debug: move border to crisp container to avoid filters`
    - `refactor: remove mobile-specific offset hacks`
  - Status: ✅ Complete - works universally on all devices using text bounds

- [x] **Issue #2: Droplet physics not responsive to text position**
  - Problem: Slow-down/acceleration hardcoded, not responsive
  - Solution: Get red text top/bottom Y coordinates from PixiJS, use for physics calculation
  - Status: ✅ Complete
  - Changes:
    - Use `titleText.getBounds()` to get actual text Y coordinates
    - Replace hardcoded percentages (0.375, 0.6) with textBounds.y and height
    - Droplet slowdown/acceleration now responds to actual text position
  - Commit: `fix: make droplet physics responsive to text position`

- [x] **Issue #3: Gray background appears after PixiJS load**
  - Problem: Background should be all black, gray appears after PixiJS renders
  - Solution: Find and remove gray background CSS/styling
  - Status: ✅ Complete
  - Changes:
    - Changed PixiJS canvas background from `#101414` (dark gray) to `#000000` (pure black)
    - Now matches page `bg-black` class exactly
    - Seamless black background throughout animation
  - Commit: `fix: remove gray background, keep pure black`
  - Branch: `issue-3-gray-background`

- [x] **Issue #4: Red bars don't prerender on HTML/CSS**
  - Problem: Red bars appear suddenly after PixiJS loads instead of being visible immediately
  - Solution: Restore HTML/CSS red bar overlays that show before PixiJS loads
  - Status: ✅ Complete
  - Commit: `fix: prerender red bars in HTML before PixiJS load`

- [x] **Issue #5: Red text background instant fill**
  - Problem: Red background appears instantly on all letters
  - Solution: Animate red "blood dripping" effect from top to bottom of letters using a performant mask.
  - Status: ✅ Complete
  - Commit: `feat(perf): Optimize text reveal animation and document learnings`

---

## Notes

- Each issue gets one focused commit
- Visual review required after each fix before proceeding
- Branch: visual-details (assumed)
- Review URL: http://localhost:3000/

---

Last updated: 2025-01-13
