"use client";

import type { Application } from "pixi.js";
import { useEffect, useRef, useState } from "react";
import { PixiDropletRenderer } from "./PixiDropletRenderer";

interface PixiDropletCanvasProps {
  theme: "dark" | "light";
  dropletCount: number;
  scaleMultiplier: number;
  isPaused?: boolean;
}

export default function PixiDropletCanvas({
  theme,
  dropletCount,
  scaleMultiplier,
  isPaused = false,
}: PixiDropletCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const appRef = useRef<Application | null>(null);
  const rendererRef = useRef<PixiDropletRenderer | null>(null);
  const [isReady, setIsReady] = useState(false);

  // Initialize PixiJS Application
  useEffect(() => {
    if (!canvasRef.current) return;

    // Dynamic import to avoid SSR issues
    const initPixi = async () => {
      const PIXI = await import("pixi.js");

      const app = new PIXI.Application();

      if (!canvasRef.current?.parentElement) return;

      await app.init({
        canvas: canvasRef.current,
        backgroundAlpha: 0,
        antialias: true,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
        resizeTo: canvasRef.current.parentElement,
      });

      appRef.current = app;

      // Create renderer
      const renderer = new PixiDropletRenderer(app, PIXI);
      await renderer.init(dropletCount, scaleMultiplier);
      rendererRef.current = renderer;

      setIsReady(true);
    };

    initPixi();

    return () => {
      if (rendererRef.current) {
        rendererRef.current.destroy();
        rendererRef.current = null;
      }

      if (appRef.current) {
        appRef.current.destroy(true, { children: true });
        appRef.current = null;
      }
    };
  }, [dropletCount, scaleMultiplier]);

  // Update droplet count when changed
  useEffect(() => {
    if (!isReady || !rendererRef.current) return;

    rendererRef.current.updateDropletCount(dropletCount, scaleMultiplier);
  }, [dropletCount, scaleMultiplier, isReady]);

  // Update theme
  useEffect(() => {
    if (!isReady || !rendererRef.current) return;

    rendererRef.current.updateTheme(theme);
  }, [theme, isReady]);

  // Handle pause state
  useEffect(() => {
    if (!appRef.current) return;

    if (isPaused) {
      appRef.current.ticker.stop();
    } else {
      appRef.current.ticker.start();
    }
  }, [isPaused]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 1 }}
    />
  );
}
