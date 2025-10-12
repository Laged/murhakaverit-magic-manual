"use client";

import { useId } from "react";
import styles from "./SmokeOverlay.module.css";

export default function SmokeOverlay() {
  const idPrefix = useId();
  const fadeTopId = `${idPrefix}-fade-top`;
  const steamFilterId = `${idPrefix}-steam-turbulence`;

  return (
    <div className={styles.smoke} aria-hidden="true">
      <svg className={styles.svgContainer} role="presentation">
        <defs>
          <linearGradient id={fadeTopId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="black" stopOpacity="0" />
            <stop offset="50%" stopColor="black" stopOpacity="0.6" />
            <stop offset="80%" stopColor="black" stopOpacity="0.9" />
            <stop offset="100%" stopColor="black" stopOpacity="1" />
          </linearGradient>

          <filter
            id={steamFilterId}
            x="-50%"
            y="-50%"
            width="200%"
            height="200%"
          >
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.03 0.06"
              numOctaves="3"
              seed="5"
            >
              <animate
                attributeName="baseFrequency"
                values="0.03 0.06;0.035 0.065;0.03 0.06"
                dur="25s"
                repeatCount="indefinite"
              />
            </feTurbulence>
            <feColorMatrix
              type="matrix"
              values="0 0 0 0 0
                      0 0 0 0 0
                      0 0 0 0 0
                      0 0 0 0.7 -0.1"
              result="coloredSmoke"
            />
            <feGaussianBlur
              in="coloredSmoke"
              stdDeviation="8"
              result="blurred"
            />
            <feComponentTransfer in="blurred" result="smoke">
              <feFuncA
                type="table"
                tableValues="0 0.3 0.5 0.7 0.8 0.6 0.4 0.2 0"
              />
            </feComponentTransfer>
            <feComposite in="smoke" in2="SourceGraphic" operator="in" />
          </filter>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill={`url(#${fadeTopId})`}
          filter={`url(#${steamFilterId})`}
        />
      </svg>
    </div>
  );
}
