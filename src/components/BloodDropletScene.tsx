"use client";

import dynamic from "next/dynamic";
import type { CSSProperties } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { DropletShape } from "@/components/BloodDroplet";
import styles from "@/components/BloodDroplet/BloodDroplet.module.css";
import CrispBloodDroplet from "@/components/BloodDroplet/CrispBloodDroplet";
import {
  BASE_OFFSETS,
  DELAY_INCREMENT,
  JITTER_RANGE,
  MAX_OFFSET,
  MIN_OFFSET,
} from "@/components/BloodDroplet/dropletConfig";
import type { DropletSeed } from "@/components/BloodDroplet/dropletTypes";
import { useWebGLSupport } from "@/hooks/useWebGLSupport";

const PixiDropletCanvas = dynamic(
  () => import("@/components/BloodDroplet/PixiDropletCanvas"),
  { ssr: false },
);

// Anchor droplets over "MURHA" letters with a conservative jitter band
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

const TITLE_INTRO_DURATION_MS = 1200;

const createDroplets = (
  scaleMultiplier: number,
  count: number,
): DropletSeed[] =>
  BASE_OFFSETS.slice(0, count).map((baseOffset, index) => ({
    id: randomId(),
    offset: getRandomOffset(baseOffset),
    scale: getRandomScale(scaleMultiplier),
    delay: index * DELAY_INCREMENT,
    phase: Math.random(),
  }));

const BASE_DROPLETS: DropletSeed[] = BASE_OFFSETS.map((baseOffset, index) => ({
  id: `base-${index}`,
  offset: baseOffset,
  scale: 1,
  delay: index * DELAY_INCREMENT,
  phase: 0,
}));

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
  const { hasWebGL, isChecking } = useWebGLSupport();
  const [scaleMultiplier, setScaleMultiplier] = useState(1);
  const [dropletCount, setDropletCount] = useState(7);
  const [droplets, setDroplets] = useState<DropletSeed[]>(BASE_DROPLETS);
  const [hasHydrated, setHasHydrated] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isTitleIntroActive, setIsTitleIntroActive] = useState(true);

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

  useEffect(() => {
    setIsTitleIntroActive(true);
    const timer = window.setTimeout(
      () => setIsTitleIntroActive(false),
      TITLE_INTRO_DURATION_MS,
    );

    return () => window.clearTimeout(timer);
  }, []);

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

  const renderCrispTitle = (extraClass?: string, style?: CSSProperties) => (
    <div
      className={`${styles.titleCrisp}${extraClass ? ` ${extraClass}` : ""}`}
      style={style}
    >
      <h1>
        murha-
        <br />
        kaverit
      </h1>
    </div>
  );

  const renderGooTitle = (extraClass?: string, style?: CSSProperties) => (
    <div
      className={`${styles.titleGoo}${extraClass ? ` ${extraClass}` : ""}`}
      style={style}
    >
      <h1>
        murha-
        <br />
        kaverit
      </h1>
    </div>
  );

  // Show static version if reduced motion preferred
  if (prefersReducedMotion) {
    return (
      <div
        className={`w-screen ${containerBgClass}`}
        style={{ height: "95vh" }}
      >
        <CrispBloodDroplet
          theme={theme}
          gooChildren={renderGooTitle(undefined, { opacity: 0.5 })}
          crispChildren={renderCrispTitle()}
        />
      </div>
    );
  }
  const mode: "loading" | "webgl" | "css" = isChecking
    ? "loading"
    : hasWebGL
      ? "webgl"
      : "css";

  const activeDroplets = hasHydrated ? droplets : BASE_DROPLETS;

  const isIntroClassActive = isTitleIntroActive || mode === "loading";

  const fallbackGooChildren = (
    <>
      {activeDroplets.map((droplet, index) => (
        <DropletShape
          key={droplet.id}
          offset={droplet.offset}
          delay={droplet.delay}
          scale={droplet.scale}
          initialPhase={droplet.phase}
          isPaused={!isVisible}
          onIteration={index === 0 ? reshuffleDroplets : undefined}
        />
      ))}
      {renderGooTitle(isIntroClassActive ? styles.titleGooIntro : undefined)}
    </>
  );

  const loadingGooChildren = renderGooTitle(styles.titleGooIntro, {
    opacity: 0.4,
  });

  return (
    <div
      ref={containerRef}
      className={`relative w-screen overflow-hidden ${containerBgClass}`}
      style={{ height: "95vh" }}
    >
      <div className="absolute inset-0 pointer-events-none">
        <CrispBloodDroplet
          theme={theme}
          gooChildren={
            mode === "css"
              ? fallbackGooChildren
              : mode === "loading"
                ? loadingGooChildren
                : null
          }
          crispChildren={null}
        />
      </div>

      {mode === "webgl" && (
        <div className="absolute inset-0">
          <PixiDropletCanvas
            theme={theme}
            droplets={droplets}
            isPaused={!isVisible}
            onLoop={reshuffleDroplets}
          />
        </div>
      )}

      {mode === "loading" && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none" />
      )}

      {renderCrispTitle(
        isIntroClassActive ? styles.titleCrispIntro : undefined,
        isIntroClassActive
          ? ({ "--title-intro-duration": "1.2s" } as CSSProperties)
          : undefined,
      )}
    </div>
  );
}
