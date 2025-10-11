"use client";

import { useId } from "react";

const DROPLET_PATH =
  "m28.443,3.6945c2.45,11.902,6.93,17.65,12.688,25.359,1.9918,2.667,3.2188,5.8992,3.2188,9.4844,0,8.7667-7.1395,15.875-15.906,15.875-8.7667,0-15.844-7.1083-15.844-15.875,0-3.5378,1.0945-6.9015,3.125-9.4844,6.009-7.645,10.407-13.424,12.718-25.36z";

const BASE_DROPLET_HEIGHT = 62;
const BASE_DROPLET_WIDTH = 59;

interface DropletShapeProps {
  scale?: number;
  offset?: number;
  delay?: number;
}

export default function DropletShape({
  scale = 1,
  offset = 50,
  delay = 0,
}: DropletShapeProps) {
  const DROPLET_HEIGHT = BASE_DROPLET_HEIGHT * scale;
  const DROPLET_WIDTH = BASE_DROPLET_WIDTH * scale;
  const titleId = useId();

  return (
    <>
      <svg
        className="absolute animate-fall"
        style={{
          height: `${DROPLET_HEIGHT}px`,
          width: `${DROPLET_WIDTH}px`,
          top: `-${DROPLET_HEIGHT}px`,
          left: `${offset}%`,
          transform: "translateX(-50%)",
          animationDelay: `${delay}s`,
        }}
        viewBox="0 0 59 62"
        xmlns="http://www.w3.org/2000/svg"
        aria-labelledby={titleId}
        role="img"
      >
        <title id={titleId}>Blood droplet</title>
        <path d={DROPLET_PATH} fill="#880808" />
      </svg>
      <style jsx>{`
        @keyframes fall {
          0% {
            top: -${DROPLET_HEIGHT}px;
            transform: translateX(-50%) scaleY(0.96);
            animation-timing-function: cubic-bezier(0.22, 0.12, 0.5, 0.98);
          }
          16% {
            top: -${DROPLET_HEIGHT * 0.6}px;
            transform: translateX(-50%) scaleY(1.03);
            animation-timing-function: cubic-bezier(0.28, 0.2, 0.52, 0.99);
          }
          30% {
            top: -${DROPLET_HEIGHT * 0.12}px;
            transform: translateX(-50%) scaleY(1.06);
            animation-timing-function: linear;
          }
          48% {
            top: calc(50% - ${DROPLET_HEIGHT / 2}px);
            transform: translateX(-50%) scaleY(0.9);
            animation-timing-function: linear;
          }
          54% {
            top: calc(50% + ${DROPLET_HEIGHT * 0.1}px);
            transform: translateX(-50%) scaleY(0.95);
            animation-timing-function: cubic-bezier(0.28, 0.12, 0.62, 0.98);
          }
          76% {
            top: calc(100% + ${DROPLET_HEIGHT * 0.3}px);
            transform: translateX(-50%) scaleY(1.22);
            animation-timing-function: cubic-bezier(0.18, 0.7, 0.32, 1);
          }
          100% {
            top: calc(100% + ${DROPLET_HEIGHT * 0.6}px);
            transform: translateX(-50%) scaleY(1.32);
          }
        }

        .animate-fall {
          animation: fall 6s linear infinite;
        }
      `}</style>
    </>
  );
}
