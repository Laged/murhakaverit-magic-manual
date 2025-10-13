# Visual Finetuning Todo List

## Landing Page Animation Fixes

### 🔴 Priority Issues

- [x] **Issue #1: Droplets falling outside text bounds**
  - Problem: Droplets spawn and fall outside text area (yolo offsets)
  - Solution: Calculate droplet spawn X based on actual text top-left/top-right corners
  - Status: ✅ Complete
  - Changes: 
    - Use `titleText.getBounds()` to get actual text dimensions
    - Calculate minX/maxX based on text bounds with 5% margin
    - Changed from percentage-based to absolute pixel positioning
  - Commit: `fix: constrain droplets to text bounds`
  - Ready for review

- [ ] **Issue #2: Droplet physics not responsive to text position**
  - Problem: Slow-down/acceleration hardcoded, not responsive
  - Solution: Get red text top/bottom Y coordinates from PixiJS, use for physics calculation
  - Status: Not started
  - Commit: `fix: make droplet physics responsive to text position`

- [ ] **Issue #3: Gray background appears after PixiJS load**
  - Problem: Background should be all black, gray appears after PixiJS renders
  - Solution: Find and remove gray background CSS/styling
  - Status: Not started
  - Commit: `fix: remove gray background, keep pure black`

- [ ] **Issue #4: Red bars don't prerender on HTML/CSS**
  - Problem: Red bars appear suddenly after PixiJS loads instead of being visible immediately
  - Solution: Restore HTML/CSS red bar overlays that show before PixiJS loads
  - Status: Not started
  - Commit: `fix: prerender red bars in HTML before PixiJS load`

- [ ] **Issue #5: Red text background instant fill**
  - Problem: Red background appears instantly on all letters
  - Solution: Animate red "blood dripping" effect from top to bottom of letters
  - Status: Not started
  - Commit: `feat: add blood dripping animation to text background`

---

## Notes

- Each issue gets one focused commit
- Visual review required after each fix before proceeding
- Branch: visual-details (assumed)
- Review URL: http://localhost:3000/

---

Last updated: 2025-01-13
