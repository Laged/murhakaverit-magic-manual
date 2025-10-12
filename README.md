# Murhakaverit Magic Manual

A high-performance Next.js website featuring WebGL-accelerated blood droplet animations using PixiJS.

## Features

- 🎨 **WebGL Blood Droplet Animations** - Hardware-accelerated particle system
- 📱 **Mobile-Optimized** - Adaptive quality and performance monitoring
- ♿ **Accessible** - Progressive enhancement with graceful fallbacks
- 🎭 **Dark/Light Themes** - Seamless theme switching
- 🔧 **Developer Tools** - Built-in FPS monitoring in development mode

## Tech Stack

- **Next.js 15.5.4** - React framework with Turbopack
- **PixiJS 8.7.2** - WebGL 2D rendering library
- **React 19** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS 4** - Styling
- **Biome** - Linting and formatting

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

- `bun run dev` - Start development server with Turbopack
- `bun run build` - Build for production
- `bun run start` - Start production server
- `bun run lint` - Check code with Biome
- `bun run lint:fix` - Auto-fix lint issues
- `bun run format` - Format code with Biome
- `bun run type-check` - Run TypeScript compiler check
- `bun run analyze` - Analyze bundle size
- `bun run perf` - Build and start for performance testing

## Performance

This project uses WebGL rendering via PixiJS to achieve 60fps animations even on mobile devices. See [PIXI_IMPLEMENTATION.md](./PIXI_IMPLEMENTATION.md) for detailed performance documentation.

### Progressive Enhancement

The application automatically selects the best rendering method based on device capabilities:

1. **WebGL (PixiJS)** - For devices with WebGL support (preferred)
2. **CSS Animations** - Fallback for devices without WebGL
3. **Static Title** - For users with reduced motion preference

### Debug Mode

In development mode, a real-time FPS overlay appears in the top-right corner showing:
- Current FPS
- Average FPS
- Performance status (Good/Fair/Poor)

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
│   │   ├── DebugOverlay.tsx           # FPS monitor
│   │   └── DropletShape.tsx           # CSS fallback
│   └── GraniittiSauna/
│       └── index.tsx         # Sauna card component
└── hooks/
    └── useWebGLSupport.ts    # WebGL detection
```

## Documentation

- [PIXI_IMPLEMENTATION.md](./PIXI_IMPLEMENTATION.md) - PixiJS implementation details and performance metrics
- [PerformanceOptimizations.md](./PerformanceOptimizations.md) - Original optimization plan

## License

Private project.
