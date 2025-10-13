# Murhakaverit Magic Manual

A high-performance Next.js website featuring WebGL-accelerated blood droplet animations with graceful fallbacks for devices that cannot run the canvas version.

## Features

- 🎨 **WebGL Blood Droplet Animations** – PixiJS renderer with gooey blending and dynamic quality downgrades
- 📱 **Mobile-Optimized** – Responsive droplet counts, scale multipliers, and viewport-aware pausing
- ♿ **Accessible** – Reduced-motion static render and Safari-safe goo filter fallbacks
- 🎭 **Dark/Light Themes** – Scene-wide theme tokens for quick palette swaps
- 🔧 **Developer Hooks** – Optional FPS overlay and programmatic renderer controls

## Tech Stack

- **Next.js 15.5.4** – React framework with Turbopack
- **PixiJS 8.7.2** – WebGL 2D rendering library
- **React 19** – UI framework
- **TypeScript** – Type safety
- **Tailwind CSS 4** – Styling
- **Biome** – Linting and formatting

## Getting Started

### Prerequisites

- Node.js 20+ or Bun
- NixOS users: See `devenv.nix` for development environment setup

### Installation

```bash
bun install
```

### Development

```bash
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Available Scripts

- `bun run dev` – Start development server with Turbopack
- `bun run build` – Build for production
- `bun run start` – Start production server
- `bun run lint` – Check code with Biome
- `bun run lint:fix` – Auto-fix lint issues
- `bun run format` – Format code with Biome
- `bun run type-check` – Run TypeScript compiler check
- `bun run analyze` – Analyze bundle size
- `bun run perf` – Build and start for performance testing

## Performance & Rendering

The hero relies on progressive enhancement: PixiJS drives the primary effect, CSS animations handle no-WebGL devices, and a static render covers reduced-motion users. See `docs/hero-scene.md` for a full breakdown of the filters, randomisation logic, and rendering order.

### Debug Mode

`src/components/BloodDroplet/DebugOverlay.tsx` can be mounted during development to display live and average FPS readings.

## Browser Support

- ✅ Chrome 56+
- ✅ Firefox 51+
- ✅ Safari 11+
- ✅ Edge 79+
- ✅ iOS Safari 11+
- ✅ Chrome for Android

## Project Structure

```
src/
├── app/
│   ├── page.tsx              # Main entry point
│   └── globals.css           # Global styles
├── components/
│   ├── BloodDroplet/
│   │   ├── PixiDropletCanvas.tsx       # WebGL renderer wrapper
│   │   ├── PixiDropletRenderer.ts      # Core rendering logic
│   │   ├── DebugOverlay.tsx            # Optional FPS monitor
│   │   ├── CrispBloodDroplet.tsx       # Goo filter wrapper + theme tokens
│   │   └── DropletShape.tsx            # CSS fallback droplet
│   └── GraniittiSauna/
│       └── index.tsx         # Sauna card component
└── hooks/
    └── useWebGLSupport.ts    # WebGL detection
```

## Documentation

- `docs/hero-scene.md` – Architecture, rendering modes, and Pixi/CSS alignment
- `docs/mobile-responsiveness.md` – Breakpoints, droplet distribution, and fallback behaviour on mobile

## License

Private project.
