"use client";

import type { CSSProperties, ReactNode } from "react";
import { useEffect, useState } from "react";
import DropletShape from "./DropletShape";

const BASE_DROPLET_HEIGHT = 62;
type BloodDropletTheme = "dark" | "light";

// Hook to detect iOS Safari which has poor SVG filter support
const useSupportsGooFilter = () => {
  const [supportsFilter, setSupportsFilter] = useState(true);

  useEffect(() => {
    // Detect iOS Safari which has buggy feGaussianBlur implementation
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

    // iOS Safari has buggy feGaussianBlur implementation
    setSupportsFilter(!(isIOS && isSafari));
  }, []);

  return supportsFilter;
};

const BLOOD_THEME_VARS: Record<BloodDropletTheme, Record<string, string>> = {
  dark: {
    "--title-crisp-color": "#FFFFFF",
    "--title-crisp-shadow1": "rgba(255, 255, 255, 0.35)",
    "--title-crisp-shadow2": "rgba(255, 255, 255, 0.15)",
    "--title-goo-color": "#880808",
    "--title-goo-stroke": "#880808",
    "--title-goo-shadow1": "#880808",
    "--title-goo-shadow2": "rgba(136, 8, 8, 0.8)",
  },
  light: {
    "--title-crisp-color": "#FFFFFF",
    "--title-crisp-shadow1": "rgba(0, 0, 0, 0.25)",
    "--title-crisp-shadow2": "rgba(0, 0, 0, 0.15)",
    "--title-goo-color": "#880808",
    "--title-goo-stroke": "#880808",
    "--title-goo-shadow1": "#880808",
    "--title-goo-shadow2": "rgba(136, 8, 8, 0.6)",
  },
};

interface BloodDropletProps {
  gooChildren: ReactNode;
  crispChildren?: ReactNode;
  barHeight?: number;
  theme?: BloodDropletTheme;
}

export default function BloodDroplet({
  gooChildren,
  crispChildren,
  barHeight = BASE_DROPLET_HEIGHT,
  theme = "dark",
}: BloodDropletProps) {
  const backgroundClass = theme === "light" ? "bg-white" : "bg-black";
  const themeStyles = BLOOD_THEME_VARS[theme] as CSSProperties;
  const supportsGooFilter = useSupportsGooFilter();

  return (
    <div
      className={`relative h-full w-full overflow-hidden ${backgroundClass}`}
      style={themeStyles}
      data-blood-theme={theme}
      data-supports-goo={supportsGooFilter}
    >
      {/* SVG filter definition - only if supported */}
      {supportsGooFilter && (
        <svg
          className="absolute h-0 w-0 pointer-events-none"
          aria-hidden="true"
        >
          <defs>
            <filter
              id="goo"
              x="-50%"
              y="-50%"
              width="200%"
              height="200%"
              colorInterpolationFilters="sRGB"
            >
              <feGaussianBlur
                in="SourceGraphic"
                stdDeviation="8"
                result="blur"
              />
              <feColorMatrix
                in="blur"
                type="matrix"
                values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -8"
                result="goo"
              />
              <feBlend in="SourceGraphic" in2="goo" />
            </filter>
          </defs>
        </svg>
      )}

      {/* Goo layer - apply filter conditionally */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          filter: supportsGooFilter ? "url(#goo)" : "blur(8px) contrast(20)",
          WebkitFilter: supportsGooFilter
            ? "url(#goo)"
            : "blur(8px) contrast(20)",
        }}
      >
        <div
          className="absolute top-0 bg-[#880808]"
          style={{ height: `${barHeight}px`, left: "-20px", right: "-20px" }}
        />
        {gooChildren}
        <div
          className="absolute bottom-0 bg-[#880808]"
          style={{ height: `${barHeight}px`, left: "-20px", right: "-20px" }}
        />
      </div>
      {crispChildren}
    </div>
  );
}

export { DropletShape };
