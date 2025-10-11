import type { ReactNode } from "react";
import DropletShape from "./DropletShape";

const BASE_DROPLET_HEIGHT = 62;

interface BloodDropletProps {
  gooChildren: ReactNode;
  crispChildren?: ReactNode;
  barHeight?: number;
}

export default function BloodDroplet({
  gooChildren,
  crispChildren,
  barHeight = BASE_DROPLET_HEIGHT,
}: BloodDropletProps) {
  return (
    <div className="relative h-full w-full overflow-hidden bg-black">
      {/* SVG filter definition - defined once */}
      <svg className="absolute h-0 w-0 pointer-events-none" aria-hidden="true">
        <defs>
          <filter
            id="goo"
            x="-50%"
            y="-50%"
            width="200%"
            height="200%"
            colorInterpolationFilters="sRGB"
          >
            <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur" />
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

      {/* Goo layer - all red elements with filter applied */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          filter: "url(#goo)",
          WebkitFilter: "url(#goo)",
        }}
      >
        <div
          className="absolute left-0 top-0 w-full bg-[#880808]"
          style={{ height: `${barHeight}px` }}
        />
        {gooChildren}
        <div
          className="absolute bottom-0 left-0 w-full bg-[#880808]"
          style={{ height: `${barHeight}px` }}
        />
      </div>

      {/* Crisp overlay layer - for sharp top bar and white text */}
      <div
        className="absolute left-0 top-0 w-full bg-[#880808] z-10"
        style={{
          height: `${barHeight}px`,
          boxShadow: "0 12px 32px rgba(136, 8, 8, 0.45)",
        }}
      />
      {crispChildren}
    </div>
  );
}

export { DropletShape };
