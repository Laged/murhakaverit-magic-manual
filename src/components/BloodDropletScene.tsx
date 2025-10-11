"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import BloodDroplet, { DropletShape } from "@/components/BloodDroplet";
import styles from "@/components/BloodDroplet/BloodDroplet.module.css";

const BASE_OFFSETS = [20, 30, 40, 50, 60, 70, 80];
const JITTER_RANGE = 12;
const MIN_OFFSET = 5;
const MAX_OFFSET = 95;
const DELAY_INCREMENT = 0.25; // seconds between droplets

interface DropletConfig {
  id: string;
  offset: number;
  scale: number;
  delay: number;
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const randomId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
};

const getRandomOffset = (base: number) =>
  clamp(base + (Math.random() * 2 - 1) * JITTER_RANGE, MIN_OFFSET, MAX_OFFSET);

const getRandomScale = (scaleMultiplier: number) =>
  (Math.random() * 1.25 + 0.25) * scaleMultiplier;

const createDroplets = (
  scaleMultiplier: number,
  count: number,
): DropletConfig[] =>
  BASE_OFFSETS.slice(0, count).map((baseOffset, index) => ({
    id: randomId(),
    offset: getRandomOffset(baseOffset),
    scale: getRandomScale(scaleMultiplier),
    delay: index * DELAY_INCREMENT,
  }));

const BASE_DROPLETS: DropletConfig[] = BASE_OFFSETS.map(
  (baseOffset, index) => ({
    id: `base-${index}`,
    offset: baseOffset,
    scale: 1,
    delay: index * DELAY_INCREMENT,
  }),
);

const getDropletCount = (width: number) => {
  if (width <= 480) return 3; // Mobile: 3 droplets
  if (width <= 768) return 4; // Tablet: 4 droplets
  if (width <= 1024) return 5; // Small desktop: 5 droplets
  return 7; // Desktop: 7 droplets
};

const resolveScaleMultiplier = (width: number) => {
  if (width <= 480) return 0.6;
  if (width <= 768) return 0.75;
  if (width <= 1024) return 0.9;
  return 1;
};

type BloodDropletSceneTheme = "dark" | "light";

interface BloodDropletSceneProps {
  theme?: BloodDropletSceneTheme;
}

export default function BloodDropletScene({
  theme = "dark",
}: BloodDropletSceneProps) {
  const [scaleMultiplier, setScaleMultiplier] = useState(1);
  const [dropletCount, setDropletCount] = useState(7);
  const [droplets, setDroplets] = useState<DropletConfig[]>(BASE_DROPLETS);
  const [hasHydrated, setHasHydrated] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Update scale multiplier based on viewport width
  useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQueries = [
      window.matchMedia("(max-width: 480px)"),
      window.matchMedia("(max-width: 768px)"),
      window.matchMedia("(max-width: 1024px)"),
    ];

    const updateMultiplier = () => {
      const width = window.innerWidth;
      setScaleMultiplier((prev) => {
        const resolved = resolveScaleMultiplier(width);
        return prev === resolved ? prev : resolved;
      });
      setDropletCount(getDropletCount(width));
    };

    updateMultiplier();

    mediaQueries.forEach((mq) => {
      if (typeof mq.addEventListener === "function") {
        mq.addEventListener("change", updateMultiplier);
      } else {
        mq.addListener(updateMultiplier);
      }
    });

    return () => {
      mediaQueries.forEach((mq) => {
        if (typeof mq.removeEventListener === "function") {
          mq.removeEventListener("change", updateMultiplier);
        } else {
          mq.removeListener(updateMultiplier);
        }
      });
    };
  }, []);

  // Regenerate droplets whenever the scale multiplier or count changes
  useEffect(() => {
    setDroplets(createDroplets(scaleMultiplier, dropletCount));
    setHasHydrated(true);
  }, [scaleMultiplier, dropletCount]);

  const reshuffleDroplets = useCallback(() => {
    if (!hasHydrated) return;
    setDroplets(createDroplets(scaleMultiplier, dropletCount));
  }, [hasHydrated, scaleMultiplier, dropletCount]);

  // Intersection Observer to pause animations when offscreen
  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsVisible(entry.isIntersecting);
        });
      },
      { threshold: 0.1 },
    );

    observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, []);

  // Detect prefers-reduced-motion
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", handleChange);
    } else {
      mediaQuery.addListener(handleChange);
    }

    return () => {
      if (typeof mediaQuery.removeEventListener === "function") {
        mediaQuery.removeEventListener("change", handleChange);
      } else {
        mediaQuery.removeListener(handleChange);
      }
    };
  }, []);

  const containerBgClass = theme === "light" ? "bg-white" : "bg-black";

  // Show static version if reduced motion preferred
  if (prefersReducedMotion) {
    return (
      <div
        className={`w-screen ${containerBgClass}`}
        style={{ height: "95vh" }}
      >
        <BloodDroplet
          theme={theme}
          gooChildren={
            <div className={styles.titleGoo} style={{ opacity: 0.5 }}>
              <h1>
                murha-
                <br />
                kaverit
              </h1>
            </div>
          }
          crispChildren={
            <div className={styles.titleCrisp}>
              <h1>
                murha-
                <br />
                kaverit
              </h1>
            </div>
          }
        />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`w-screen ${containerBgClass}`}
      style={{ height: "95vh" }}
    >
      <BloodDroplet
        theme={theme}
        gooChildren={
          <>
            {(hasHydrated ? droplets : BASE_DROPLETS).map((droplet, index) => (
              <DropletShape
                key={droplet.id}
                offset={droplet.offset}
                delay={droplet.delay}
                scale={droplet.scale}
                isPaused={!isVisible}
                onIteration={index === 0 ? reshuffleDroplets : undefined}
              />
            ))}
            <div className={styles.titleGoo}>
              <h1>
                murha-
                <br />
                kaverit
              </h1>
            </div>
            {/* Debug lines for slow section */}
            {/* <div style={{ position: 'absolute', top: '37%', left: 0, right: 0, height: '2px', background: 'cyan', zIndex: 100 }} /> */}
            {/* <div style={{ position: 'absolute', top: '65%', left: 0, right: 0, height: '2px', background: 'cyan', zIndex: 100 }} /> */}
          </>
        }
        crispChildren={
          <div className={styles.titleCrisp}>
            <h1>
              murha-
              <br />
              kaverit
            </h1>
          </div>
        }
      />
    </div>
  );
}
