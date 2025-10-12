"use client";

import type { Application } from "pixi.js";
import { useEffect, useRef, useState } from "react";

interface PixiDropletCanvasProps {
  theme: "dark" | "light";
  dropletCount: number;
  scaleMultiplier: number;
  isPaused?: boolean;
}

export default function PixiDropletCanvas({
  theme: _theme,
  dropletCount: _dropletCount,
  scaleMultiplier: _scaleMultiplier,
  isPaused = false,
}: PixiDropletCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const appRef = useRef<Application | null>(null);
  const [_isReady, setIsReady] = useState(false);

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
      setIsReady(true);
    };

    initPixi();

    return () => {
      if (appRef.current) {
        appRef.current.destroy(true, { children: true });
        appRef.current = null;
      }
    };
  }, []);

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
