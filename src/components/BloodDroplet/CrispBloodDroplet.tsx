"use client";

import type { CSSProperties, ReactNode } from "react";
import { useEffect, useId, useState } from "react";
import DropletShape from "./DropletShape";

const BASE_DROPLET_HEIGHT = 62;
type BloodDropletTheme = "dark" | "light";

// Hook to detect iOS Safari which has poor SVG filter support
const useSupportsGooFilter = () => {
  const [supportsFilter, setSupportsFilter] = useState(true);

  useEffect(() => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

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

interface CrispBloodDropletProps {
  gooChildren: ReactNode;
  crispChildren?: ReactNode;
  barHeight?: number;
  theme?: BloodDropletTheme;
  disableFilter?: boolean;
}

const FALLBACK_FILTER =
  "saturate(260%) brightness(0.92) drop-shadow(0 2px 6px rgba(68, 0, 0, 0.55)) drop-shadow(0 0 14px rgba(136, 8, 8, 0.5))";

export default function CrispBloodDroplet({
  gooChildren,
  crispChildren,
  barHeight = BASE_DROPLET_HEIGHT,
  theme = "dark",
  disableFilter = false,
}: CrispBloodDropletProps) {
  const filterId = useId();
  const backgroundClass = theme === "light" ? "bg-white" : "bg-black";
  const themeStyles = BLOOD_THEME_VARS[theme] as CSSProperties;
  const supportsGooFilter = useSupportsGooFilter();
  const shouldUseSvgFilter = supportsGooFilter && !disableFilter;
  const gooFilter = disableFilter
    ? "none"
    : supportsGooFilter
      ? `url(#${filterId})`
      : FALLBACK_FILTER;

  return (
    <div
      className={`relative h-full w-full overflow-hidden ${backgroundClass}`}
      style={themeStyles}
      data-blood-theme={theme}
      data-supports-goo={supportsGooFilter}
    >
      {shouldUseSvgFilter && (
        <svg
          className="absolute h-0 w-0 pointer-events-none"
          aria-hidden="true"
        >
          <defs>
            <filter
              id={filterId}
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

      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            filter: gooFilter,
            WebkitFilter: gooFilter,
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

        {!shouldUseSvgFilter && supportsGooFilter && (
          <div
            className="absolute inset-0 pointer-events-none"
            aria-hidden="true"
            style={{ background: "rgba(136, 8, 8, 0.12)" }}
          />
        )}

        {!supportsGooFilter && !disableFilter && (
          <div
            className="absolute inset-0 pointer-events-none"
            aria-hidden="true"
            style={{
              background:
                "radial-gradient(120% 120% at 50% 0%, rgba(255, 255, 255, 0.18) 0%, rgba(255, 255, 255, 0) 55%), radial-gradient(80% 80% at 50% 100%, rgba(0, 0, 0, 0.25) 0%, rgba(0, 0, 0, 0) 65%)",
              mixBlendMode: "multiply",
              opacity: 0.9,
            }}
          />
        )}
      </div>
      {crispChildren}
    </div>
  );
}

export { DropletShape };
