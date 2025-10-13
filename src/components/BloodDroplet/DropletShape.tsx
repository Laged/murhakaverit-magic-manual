"use client";

import type { CSSProperties } from "react";
import { useId } from "react";
import styles from "./DropletShape.module.css";
import { DROPLET_DURATION } from "./dropletConfig";

const DROPLET_PATH =
  "m28.443,3.6945c2.45,11.902,6.93,17.65,12.688,25.359,1.9918,2.667,3.2188,5.8992,3.2188,9.4844,0,8.7667-7.1395,15.875-15.906,15.875-8.7667,0-15.844-7.1083-15.844-15.875,0-3.5378,1.0945-6.9015,3.125-9.4844,6.009-7.645,10.407-13.424,12.718-25.36z";

const BASE_DROPLET_HEIGHT = 62;
const BASE_DROPLET_WIDTH = 59;

interface DropletShapeProps {
  scale?: number;
  offset?: number;
  delay?: number;
  initialPhase?: number;
  isPaused?: boolean;
  onIteration?: () => void;
}

export default function DropletShape({
  scale = 1,
  offset = 50,
  delay = 0,
  initialPhase = 0,
  isPaused = false,
  onIteration,
}: DropletShapeProps) {
  const height = BASE_DROPLET_HEIGHT * scale;
  const width = BASE_DROPLET_WIDTH * scale;
  const titleId = useId();
  const phase = Math.max(0, Math.min(1, initialPhase));
  const animationDelay = delay - phase * DROPLET_DURATION;

  const style: CSSProperties = {
    height: `${height}px`,
    width: `${width}px`,
    "--drop-delay": `${animationDelay}s`,
    "--drop-left": `${offset}%`,
    "--drop-top0": `${BASE_DROPLET_HEIGHT / 2 - height / 2}px`,
    "--drop-top1": `30vh`,
    "--drop-top2": `55vh`,
    "--drop-top3": `100vh`,
    "--drop-top4": `110vh`,
    animationDelay: `${animationDelay}s`,
    animationDuration: `${DROPLET_DURATION}s`,
    animationPlayState: isPaused ? "paused" : "running",
  } as CSSProperties;

  return (
    <svg
      className={styles.drop}
      style={style}
      viewBox="0 0 59 62"
      xmlns="http://www.w3.org/2000/svg"
      aria-labelledby={titleId}
      role="img"
      onAnimationIteration={onIteration}
    >
      <title id={titleId}>Blood droplet</title>
      <path d={DROPLET_PATH} fill="#880808" />
    </svg>
  );
}
