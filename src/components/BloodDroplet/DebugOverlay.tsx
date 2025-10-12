"use client";

import { useEffect, useState } from "react";
import type { PixiDropletRenderer } from "./PixiDropletRenderer";

interface DebugOverlayProps {
  renderer: PixiDropletRenderer | null;
  enabled?: boolean;
}

export default function DebugOverlay({
  renderer,
  enabled = process.env.NODE_ENV === "development",
}: DebugOverlayProps) {
  const [fps, setFps] = useState(60);
  const [avgFps, setAvgFps] = useState(60);

  useEffect(() => {
    if (!enabled || !renderer) return;

    const interval = setInterval(() => {
      setFps(Math.round(renderer.getCurrentFPS()));
      setAvgFps(Math.round(renderer.getAverageFPS()));
    }, 100);

    return () => clearInterval(interval);
  }, [enabled, renderer]);

  if (!enabled || !renderer) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 10,
        right: 10,
        background: "rgba(0, 0, 0, 0.8)",
        color: "#00ff00",
        padding: "8px 12px",
        fontFamily: "monospace",
        fontSize: "12px",
        zIndex: 9999,
        borderRadius: "4px",
        pointerEvents: "none",
        lineHeight: "1.4",
      }}
    >
      <div>
        <strong>PixiJS Debug</strong>
      </div>
      <div>FPS: {fps}</div>
      <div>Avg FPS: {avgFps}</div>
      <div
        style={{
          color:
            avgFps >= 55 ? "#00ff00" : avgFps >= 30 ? "#ffaa00" : "#ff0000",
        }}
      >
        Status: {avgFps >= 55 ? "Good" : avgFps >= 30 ? "Fair" : "Poor"}
      </div>
    </div>
  );
}
