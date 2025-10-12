"use client";

import type { Application } from "pixi.js";
import { useEffect, useRef, useState } from "react";
import type { DropletSeed } from "./dropletTypes";
import { PixiDropletRenderer } from "./PixiDropletRenderer";

interface PixiDropletCanvasProps {
  theme: "dark" | "light";
  droplets: DropletSeed[];
  isPaused?: boolean;
  onLoop?: () => void;
}

export default function PixiDropletCanvas({
  theme,
  droplets,
  isPaused = false,
  onLoop,
}: PixiDropletCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const appRef = useRef<Application | null>(null);
  const rendererRef = useRef<PixiDropletRenderer | null>(null);
  const [isReady, setIsReady] = useState(false);
  const initialDropletsRef = useRef(droplets);
  const loopCallbackRef = useRef(onLoop);

  useEffect(() => {
    loopCallbackRef.current = onLoop;
  }, [onLoop]);

  useEffect(() => {
    if (!isReady) {
      initialDropletsRef.current = droplets;
    }
  }, [droplets, isReady]);

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
      const renderer = new PixiDropletRenderer(app, PIXI, {
        onLoop: () => {
          if (typeof loopCallbackRef.current === "function") {
            loopCallbackRef.current();
          }
        },
      });
      await renderer.init(initialDropletsRef.current);
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
  }, []);

  // Update droplet seeds when changed
  useEffect(() => {
    if (!isReady || !rendererRef.current) return;

    rendererRef.current.updateDroplets(droplets);
  }, [droplets, isReady]);

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
