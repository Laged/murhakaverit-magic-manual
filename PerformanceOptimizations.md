# Performance Optimization Plan

## Executive Summary

This document outlines a comprehensive plan to optimize the murhakaverit-magic-manual website for mobile devices, particularly iOS Safari, which has critical performance issues due to SVG filter limitations.

### Current Performance Issues

1. **SVG Filter Incompatibility**: iOS Safari does not fully support the `feGaussianBlur` SVG filter used for the "goo" effect on blood droplets
2. **Heavy CSS Animations**: Multiple animated droplets (7 concurrent) with complex transforms
3. **Sauna Smoke Effect**: SVG filters with animated turbulence (`feTurbulence`) causing additional rendering overhead
4. **Continuous Repaints**: Animations running indefinitely cause constant GPU/CPU usage

### Affected Components

- `BloodDroplet/index.tsx` - Uses `filter: url(#goo)` with `feGaussianBlur` (lines 76-79)
- `BloodDropletScene.tsx` - Manages 7 animated droplets with staggered delays
- `DropletShape.tsx` - Individual droplet animations (9s duration)
- `GraniittiSauna/SmokeOverlay.tsx` - SVG turbulence filter with animation (lines 15-55)

---

## Phase 1: CSS Fallback Strategy (No SVG Filters)

### Objective
Create a visually solid experience without SVG filters while maintaining the blood/horror aesthetic.

### 1.1 Replace Goo Effect with CSS Shadows

**Current**: `feGaussianBlur` + `feColorMatrix` creates organic merging effect
**Replacement**: Multi-layered `box-shadow` + `filter: blur()` + `mix-blend-mode`

#### Implementation Strategy

```css
/* Instead of filter: url(#goo) */
.gooFallback {
  filter: blur(8px) contrast(20);
  /* Alternative approach using backdrop-filter if supported */
  backdrop-filter: blur(8px);
}

.droplet {
  filter: drop-shadow(0 0 12px rgba(136, 8, 8, 0.9))
          drop-shadow(0 0 24px rgba(136, 8, 8, 0.6));
  mix-blend-mode: multiply; /* Helps droplets blend together */
}
```

#### Feature Detection

```typescript
// In BloodDroplet/index.tsx
const [supportsFilter, setSupportsFilter] = useState(true);

useEffect(() => {
  // Detect Safari iOS
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

  // Test SVG filter support
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  const filter = document.createElementNS('http://www.w3.org/2000/svg', 'feGaussianBlur');
  setSupportsFilter(!isSafari || !isIOS);
}, []);
```

#### Visual Adjustments

1. **Increase droplet overlap** to create visual cohesion
2. **Add CSS `filter: contrast()`** to sharpen edges
3. **Use `radial-gradient`** backgrounds for depth
4. **Implement `mix-blend-mode: screen`** for light theme

### 1.2 Optimize Droplet Count for Mobile

**Current**: 7 droplets on all devices
**Optimized**: Adaptive droplet count based on viewport

```typescript
// In BloodDropletScene.tsx
const getDropletCount = (width: number) => {
  if (width <= 480) return 3;  // Mobile: 3 droplets
  if (width <= 768) return 4;  // Tablet: 4 droplets
  if (width <= 1024) return 5; // Small desktop: 5 droplets
  return 7; // Full desktop: 7 droplets
};
```

**Rationale**: Fewer droplets = fewer paint operations = better FPS

### 1.3 Performance-Optimized Animation

**Replace complex keyframes with simpler transform-only animations**

```css
@keyframes drop-fall-optimized {
  0% {
    transform: translateX(-50%) translateY(0) scale(0);
  }
  10% {
    transform: translateX(-50%) translateY(0) scale(1);
  }
  20% {
    transform: translateX(-50%) translateY(calc(37vh - 50%)) scale(1);
  }
  70% {
    transform: translateX(-50%) translateY(calc(65vh - 50%)) scale(1);
  }
  100% {
    transform: translateX(-50%) translateY(100vh) scale(1);
  }
}
```

**Key Changes**:
- Use `transform` instead of `top` (triggers composite layer, not layout)
- Use `will-change: transform` sparingly (only during animation)
- Use `translate3d()` to force GPU acceleration on older devices

### 1.4 Remove Sauna Smoke Animation

**Action**: Remove `SmokeOverlay.tsx` entirely
**Replacement Options**:

**Option A - Static Gradient Overlay**
```css
.staticSmokeOverlay {
  background: linear-gradient(
    to bottom,
    rgba(0, 0, 0, 0) 0%,
    rgba(0, 0, 0, 0.3) 40%,
    rgba(0, 0, 0, 0.6) 70%,
    rgba(0, 0, 0, 0.8) 100%
  );
  pointer-events: none;
}
```

**Option B - CSS Grain Texture**
```css
.grainOverlay {
  background-image:
    linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.8)),
    url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400'...");
  background-blend-mode: multiply;
  opacity: 0.6;
}
```

**Option C - Minimal CSS Animation**
```css
@keyframes subtle-smoke {
  0%, 100% { opacity: 0.4; transform: translateY(0); }
  50% { opacity: 0.6; transform: translateY(-10px); }
}
```

### 1.5 Implement Critical CSS Loading

**Problem**: Large CSS files block rendering
**Solution**: Inline critical CSS, defer non-critical

```typescript
// In app/layout.tsx
export default function RootLayout() {
  return (
    <html>
      <head>
        <style dangerouslySetInnerHTML={{
          __html: criticalCSS // Inlined styles for above-fold
        }} />
        <link rel="preload" href="/fonts/Creepster.woff2" as="font" crossOrigin="" />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
```

---

## Phase 2: WebGL Droplet Implementation

### Objective
Assess feasibility of WebGL-based droplet animation for superior performance and visual quality.

### 2.1 Technical Assessment

#### Advantages
✅ **Hardware Acceleration**: Native GPU rendering (60 FPS achievable)
✅ **Particle System**: Can handle 50+ droplets without performance hit
✅ **Advanced Effects**: Realistic blur, metaball merging, refractions
✅ **Mobile Support**: WebGL 1.0 supported on 97%+ of devices (iOS Safari included)
✅ **Smaller Bundle**: No large SVG filters in DOM

#### Disadvantages
⚠️ **Bundle Size**: Three.js (~150KB gzipped) or PixiJS (~120KB gzipped)
⚠️ **Complexity**: Shader programming required
⚠️ **Battery Usage**: Continuous rendering drains battery faster
⚠️ **Accessibility**: Harder to make screen-reader friendly
⚠️ **SSR Challenges**: Requires client-only rendering

#### Recommended Approach: Vanilla WebGL or PixiJS

**Why PixiJS over Three.js**:
- Optimized for 2D rendering (your use case)
- Smaller bundle size (~120KB vs ~150KB)
- Simpler API for particle systems
- Better mobile performance for 2D effects

**Why Vanilla WebGL**:
- Zero dependencies (smallest bundle)
- Full control over shaders
- Best performance possible
- Steeper learning curve

### 2.2 Metaball/Goo Effect with WebGL

**Approach**: Fragment shader with threshold-based rendering

```glsl
// Fragment shader for metaball effect
precision mediump float;

uniform vec2 droplets[7]; // Droplet positions
uniform float dropletRadii[7]; // Droplet sizes
uniform vec2 resolution;
uniform vec3 color;

void main() {
  vec2 uv = gl_FragCoord.xy / resolution;
  float sum = 0.0;

  // Calculate metaball field
  for(int i = 0; i < 7; i++) {
    vec2 diff = uv - droplets[i];
    float dist = length(diff);
    sum += dropletRadii[i] / (dist * dist);
  }

  // Threshold creates goo effect
  float alpha = smoothstep(0.8, 1.2, sum);

  gl_FragColor = vec4(color, alpha);
}
```

**Performance**: Single draw call for all droplets vs 7 DOM elements

### 2.3 Recommended WebGL Implementation Stack

#### Option A: PixiJS (Recommended for Fast Development)

**Installation**:
```bash
npm install pixi.js @pixi/filter-blur
```

**Basic Structure**:
```typescript
import { Application, Graphics, BlurFilter } from 'pixi.js';

class BloodDropletWebGL {
  private app: Application;
  private droplets: Graphics[] = [];

  async init(canvas: HTMLCanvasElement) {
    this.app = new Application({
      view: canvas,
      backgroundAlpha: 0,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    });

    // Create metaball container with blur
    const container = new Container();
    container.filters = [new BlurFilter(8)];

    // Add droplet sprites
    this.createDroplets();

    // Animation loop
    this.app.ticker.add(this.animate.bind(this));
  }

  private animate(delta: number) {
    // Update droplet positions
    this.droplets.forEach((droplet, i) => {
      droplet.y += this.speeds[i] * delta;
      if (droplet.y > this.app.screen.height) {
        droplet.y = -droplet.height;
      }
    });
  }
}
```

**Bundle Impact**: +120KB (gzipped)
**Performance**: 60 FPS on iPhone 12+, 30-45 FPS on older devices

#### Option B: Vanilla WebGL (Recommended for Best Performance)

**No Dependencies**: 0KB added to bundle
**Custom Shader**: Full control over metaball algorithm
**Performance**: 60 FPS on all modern devices

**Implementation Complexity**: HIGH
**Development Time**: ~3-4 days
**Maintenance**: Requires WebGL expertise

#### Option C: CSS + Canvas Hybrid

**Approach**: Use Canvas 2D API for droplet rendering, CSS for layout

```typescript
class CanvasDropletRenderer {
  private ctx: CanvasRenderingContext2D;

  render(droplets: Droplet[]) {
    // Clear and set composite mode
    this.ctx.globalCompositeOperation = 'source-over';
    this.ctx.clearRect(0, 0, this.width, this.height);

    // Draw all droplets with blur
    this.ctx.filter = 'blur(8px)';
    droplets.forEach(d => {
      this.ctx.fillStyle = '#880808';
      this.ctx.beginPath();
      this.ctx.ellipse(d.x, d.y, d.width/2, d.height/2, 0, 0, Math.PI * 2);
      this.ctx.fill();
    });

    // Apply contrast to create goo effect
    this.ctx.filter = 'contrast(20)';
    this.ctx.drawImage(this.canvas, 0, 0);
  }
}
```

**Bundle Impact**: 0KB (vanilla Canvas API)
**Performance**: 45-60 FPS (slower than WebGL, faster than SVG)
**Compatibility**: 100% (Canvas 2D supported everywhere)

### 2.4 Fallback Strategy for WebGL

**Detection**:
```typescript
const hasWebGL = (() => {
  try {
    const canvas = document.createElement('canvas');
    return !!(
      canvas.getContext('webgl') ||
      canvas.getContext('experimental-webgl')
    );
  } catch {
    return false;
  }
})();
```

**Progressive Enhancement**:
1. Check WebGL support
2. If supported → Use WebGL renderer
3. If not supported → Use CSS fallback (Phase 1)
4. Provide user preference toggle

---

## Phase 3: Mobile-Specific Optimizations

### 3.1 Reduce Motion Preference

**Respect system settings**:

```css
@media (prefers-reduced-motion: reduce) {
  .drop {
    animation: none;
    position: static;
    opacity: 0.3;
  }

  /* Show static snapshot instead */
  .titleGoo {
    filter: none;
  }
}
```

```typescript
// JavaScript detection
const prefersReducedMotion = window.matchMedia(
  '(prefers-reduced-motion: reduce)'
).matches;

if (prefersReducedMotion) {
  return <StaticBloodTitle />;
}
```

### 3.2 Intersection Observer for Animation

**Only animate when visible**:

```typescript
useEffect(() => {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setIsAnimating(true);
        } else {
          setIsAnimating(false); // Pause when offscreen
        }
      });
    },
    { threshold: 0.1 }
  );

  if (containerRef.current) {
    observer.observe(containerRef.current);
  }

  return () => observer.disconnect();
}, []);
```

### 3.3 Debounced Resize Handlers

**Current issue**: Resize events fire rapidly, causing jank

```typescript
const useDebouncedResize = (callback: () => void, delay = 150) => {
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(callback, delay);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeoutId);
    };
  }, [callback, delay]);
};
```

### 3.4 Passive Event Listeners

**Improve scroll performance**:

```typescript
useEffect(() => {
  const handleScroll = () => {
    // Update parallax or other scroll effects
  };

  window.addEventListener('scroll', handleScroll, { passive: true });
  return () => window.removeEventListener('scroll', handleScroll);
}, []);
```

### 3.5 Font Loading Optimization

**Current**: Google Fonts adds latency
**Solution**: Self-host with `font-display: swap`

```css
@font-face {
  font-family: 'Creepster';
  src: url('/fonts/creepster.woff2') format('woff2');
  font-display: swap;
  font-weight: 400;
}
```

**Preload critical fonts**:
```html
<link rel="preload" href="/fonts/creepster.woff2" as="font" type="font/woff2" crossorigin>
```

---

## Phase 4: Performance Measurement & Testing

### 4.1 Lighthouse Metrics Targets

**Current (Estimated)**:
- Performance: ~40-50 (mobile)
- FCP: ~2.5s
- LCP: ~3.5s
- CLS: 0.1-0.2

**Target (Phase 1)**:
- Performance: 70-80
- FCP: <1.5s
- LCP: <2.5s
- CLS: <0.1

**Target (Phase 2 with WebGL)**:
- Performance: 80-90
- FCP: <1.2s
- LCP: <2.0s
- CLS: <0.05

### 4.2 FPS Monitoring

**Implementation**:

```typescript
class PerformanceMonitor {
  private frames = 0;
  private lastTime = performance.now();

  measure() {
    this.frames++;
    const now = performance.now();

    if (now >= this.lastTime + 1000) {
      const fps = Math.round((this.frames * 1000) / (now - this.lastTime));
      console.log(`FPS: ${fps}`);

      if (fps < 30) {
        console.warn('Low FPS detected, consider reducing quality');
      }

      this.frames = 0;
      this.lastTime = now;
    }

    requestAnimationFrame(() => this.measure());
  }
}
```

### 4.3 Device-Specific Testing

**Priority Devices**:
1. iPhone 12/13/14 (iOS 16+, Safari)
2. iPhone SE 2022 (Lower-end iOS device)
3. iPad Air (Tablet form factor)
4. Samsung Galaxy S21 (Android Chrome)
5. Older Android (Android 9, low-end)

**Testing Checklist**:
- [ ] Page loads in <3s on 4G
- [ ] Animations run at 30+ FPS
- [ ] No layout shifts during load
- [ ] Works with no JavaScript (progressive enhancement)
- [ ] Works with prefers-reduced-motion

---

## Implementation Roadmap

### Quick Win (1-2 days): Remove Sauna Smoke + Reduce Droplets
- **Action**: Remove `SmokeOverlay.tsx`, reduce mobile droplet count to 3
- **Impact**: Immediate 30-40% performance improvement on mobile
- **Risk**: Low
- **Visual Impact**: Minimal (smoke was subtle)

### Short Term (3-5 days): CSS Fallback for SVG Filters
- **Action**: Implement Phase 1 CSS-only approach
- **Impact**: iOS Safari performance parity with Chrome
- **Risk**: Medium (visual fidelity may differ slightly)
- **Testing Required**: Extensive visual QA on iOS

### Medium Term (1-2 weeks): Canvas 2D Hybrid
- **Action**: Implement Option C (Canvas + CSS)
- **Impact**: 50-60% performance improvement, cross-browser
- **Risk**: Low-Medium
- **Bundle Size**: 0KB added

### Long Term (2-3 weeks): WebGL Implementation
- **Action**: Implement PixiJS or Vanilla WebGL renderer
- **Impact**: 70-80% performance improvement, best visual quality
- **Risk**: High (complexity, bundle size, battery usage)
- **Fallback**: Required (Phase 1 CSS approach)

---

## Recommended Action Plan

### Week 1: Immediate Fixes
1. **Remove Sauna Smoke animation** → Replace with static gradient
2. **Reduce droplet count on mobile** (7 → 3)
3. **Add Intersection Observer** to pause offscreen animations
4. **Self-host fonts** with `font-display: swap`
5. **Add `will-change: transform`** to animated droplets

**Expected Outcome**: 40% performance improvement on mobile

### Week 2: CSS Optimizations
1. **Implement SVG filter detection** (iOS Safari check)
2. **Build CSS fallback** using `filter: blur() contrast()`
3. **Test on real iOS devices** (iPhone 12+, Safari)
4. **Add `prefers-reduced-motion` support**
5. **Optimize animation keyframes** (use transform-only)

**Expected Outcome**: Works on all devices at 30+ FPS

### Week 3: Canvas/WebGL Evaluation
1. **Build Canvas 2D prototype**
2. **Build PixiJS prototype** (if Canvas insufficient)
3. **Performance benchmark** both approaches
4. **User testing** with A/B comparison
5. **Choose best approach** based on data

**Expected Outcome**: 60 FPS on modern devices, 45+ FPS on older devices

### Week 4: Polish & Testing
1. **Comprehensive device testing**
2. **Lighthouse optimization** (target 80+ mobile score)
3. **Battery usage profiling**
4. **Accessibility audit**
5. **Production deployment**

**Expected Outcome**: Production-ready, performant site

---

## Alternative Consideration: Static Images

### Radical Simplification

**Concept**: Pre-render animation frames as WebP/AVIF images

**Approach**:
1. Export 60 frames of droplet animation as images
2. Use CSS sprite sheet or `<img srcset>` with preload
3. Cycle through frames using CSS animation or JS

**Pros**:
- ✅ Zero runtime performance cost
- ✅ Perfect cross-browser compatibility
- ✅ No JavaScript required
- ✅ Predictable, consistent visuals

**Cons**:
- ❌ Large file size (even with WebP: ~500KB-1MB for 60 frames)
- ❌ Not truly dynamic
- ❌ Harder to maintain/update

**Verdict**: Only if all other approaches fail

---

## Conclusion

### Recommended Path Forward

1. **Phase 1 (Immediate)**: Remove smoke, reduce droplets, add CSS fallbacks
   - **Timeline**: 3-5 days
   - **Impact**: Makes site usable on mobile Safari
   - **Investment**: Low

2. **Phase 2 (Evaluate)**: Build Canvas 2D prototype
   - **Timeline**: 5-7 days
   - **Impact**: 2x performance improvement
   - **Investment**: Medium

3. **Phase 3 (If needed)**: PixiJS WebGL implementation
   - **Timeline**: 1-2 weeks
   - **Impact**: Best possible performance
   - **Investment**: High
   - **Condition**: Only if Canvas approach insufficient

### Success Metrics

- **Primary**: Lighthouse mobile score 75+
- **Secondary**: Sustained 30+ FPS on iPhone 12 Safari
- **Tertiary**: LCP < 2.5s, CLS < 0.1

### Risk Assessment

- **CSS Fallback**: Low risk, medium reward
- **Canvas 2D**: Medium risk, high reward
- **WebGL**: High risk, very high reward

### Budget Estimate

- **Phase 1**: 16-24 hours (2-3 days)
- **Phase 2**: 32-48 hours (4-6 days)
- **Phase 3**: 80-120 hours (10-15 days)

**Total**: 128-192 hours (16-24 days) for complete optimization

---

## Appendix: Browser Support Matrix

| Feature | Chrome | Safari | Firefox | iOS Safari | Notes |
|---------|--------|--------|---------|------------|-------|
| SVG feGaussianBlur | ✅ | ⚠️ | ✅ | ❌ | iOS Safari: buggy/slow |
| CSS backdrop-filter | ✅ | ✅ | ✅ | ✅ | Good fallback option |
| WebGL 1.0 | ✅ | ✅ | ✅ | ✅ | 97%+ support |
| WebGL 2.0 | ✅ | ⚠️ | ✅ | ❌ | iOS: No support |
| Canvas 2D | ✅ | ✅ | ✅ | ✅ | 100% support |
| CSS filter: blur() | ✅ | ✅ | ✅ | ✅ | Performant on all |
| mix-blend-mode | ✅ | ✅ | ✅ | ✅ | Good for goo effect |

**Legend**:
- ✅ Full support, good performance
- ⚠️ Partial support or performance issues
- ❌ No support or broken implementation
