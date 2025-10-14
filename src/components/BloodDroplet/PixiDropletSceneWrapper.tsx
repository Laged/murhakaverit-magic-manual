"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { DropletShape } from "@/components/BloodDroplet";
import styles from "@/components/BloodDroplet/BloodDroplet.module.css";
import CrispBloodDroplet from "@/components/BloodDroplet/CrispBloodDroplet";
import {
  BASE_OFFSETS,
  DROPLET_DURATION,
  MAX_OFFSET,
  MIN_OFFSET,
} from "@/components/BloodDroplet/dropletConfig";
import type { DropletSeed } from "@/components/BloodDroplet/dropletTypes";
import PixiDropletIndividual from "@/components/BloodDroplet/PixiDropletIndividual";
import { useWebGLSupport } from "@/hooks/useWebGLSupport";

const TITLE_INTRO_DURATION_MS = 2000;
const MIN_SPACING = 6;

const randomId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
};

const getRandomScale = (
  scaleMultiplier: number,
  minScale = 0.25,
  maxScale = 1.5,
) => {
  const randomScale = Math.random() * (maxScale - minScale) + minScale;
  return randomScale * scaleMultiplier;
};

const createDroplets = (
  scaleMultiplier: number,
  count: number,
  minScale = 0.25,
  maxScale = 1.5,
): DropletSeed[] => {
  const actualCount = Math.max(
    1,
    Math.round(count * (0.7 + Math.random() * 0.6)),
  );
  const offsets: number[] = [];
  let attempts = 0;

  while (offsets.length < actualCount && attempts < 200) {
    attempts += 1;
    const candidate = MIN_OFFSET + Math.random() * (MAX_OFFSET - MIN_OFFSET);
    if (
      offsets.every((existing) => Math.abs(existing - candidate) >= MIN_SPACING)
    ) {
      offsets.push(candidate);
    }
  }

  offsets.sort((a, b) => a - b);

  return offsets.map((offset) => ({
    id: randomId(),
    offset,
    scale: getRandomScale(scaleMultiplier, minScale, maxScale),
    delay: Math.random() * 1.25,
    phase: 0,
  }));
};

const BASE_DROPLETS: DropletSeed[] = createDroplets(1, BASE_OFFSETS.length);

const getDropletCount = (width: number) => {
  if (width <= 480) return 3;
  if (width <= 768) return 4;
  if (width <= 1024) return 5;
  return 7;
};

const resolveScaleMultiplier = (width: number) => {
  if (width <= 480) return 0.6;
  if (width <= 768) return 0.75;
  if (width <= 1024) return 0.9;
  return 1;
};

type BloodDropletSceneTheme = "dark" | "light";

interface PixiDropletSceneWrapperProps {
  theme?: BloodDropletSceneTheme;
}

export default function PixiDropletSceneWrapper({
  theme = "dark",
}: PixiDropletSceneWrapperProps) {
  const { hasWebGL, isChecking } = useWebGLSupport();
  const [scaleMultiplier, setScaleMultiplier] = useState(1);
  const [dropletCount, setDropletCount] = useState(7);
  const [droplets, setDroplets] = useState<DropletSeed[]>(BASE_DROPLETS);
  const [hasHydrated, setHasHydrated] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [isTitleIntroActive, setIsTitleIntroActive] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const burstTimerRef = useRef<number | null>(null);

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

  useEffect(() => {
    const seeds = createDroplets(scaleMultiplier, dropletCount);
    setDroplets(seeds);
    setHasHydrated(true);
  }, [scaleMultiplier, dropletCount]);

  useEffect(() => {
    if (burstTimerRef.current !== null) {
      window.clearTimeout(burstTimerRef.current);
    }

    const burstDurationMs = Math.round(DROPLET_DURATION * 1000 + 1500);
    burstTimerRef.current = window.setTimeout(() => {
      setDroplets(createDroplets(scaleMultiplier, dropletCount));
    }, burstDurationMs);

    return () => {
      if (burstTimerRef.current !== null) {
        window.clearTimeout(burstTimerRef.current);
      }
    };
  }, [dropletCount, scaleMultiplier]);

  useEffect(() => {
    setIsTitleIntroActive(true);
    const timer = window.setTimeout(
      () => setIsTitleIntroActive(false),
      TITLE_INTRO_DURATION_MS,
    );

    return () => window.clearTimeout(timer);
  }, []);

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

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
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

  const renderCrispTitle = (extraClass?: string) => (
    <div
      className={`${styles.titleCrisp}${extraClass ? ` ${extraClass}` : ""}`}
    >
      <h1>
        murha-
        <br />
        kaverit
      </h1>
    </div>
  );

  const renderGooTitle = (extraClass?: string) => (
    <div className={`${styles.titleGoo}${extraClass ? ` ${extraClass}` : ""}`}>
      <h1>
        murha-
        <br />
        kaverit
      </h1>
    </div>
  );

  // Hooks must be called before early returns
  const mode: "loading" | "webgl" | "css" = isChecking
    ? "loading"
    : hasWebGL
      ? "webgl"
      : "css";

  const activeDroplets = useMemo(
    () => (hasHydrated ? droplets : BASE_DROPLETS),
    [droplets, hasHydrated],
  );

  if (prefersReducedMotion) {
    return (
      <div
        className={`w-screen ${containerBgClass}`}
        style={{ height: "95vh" }}
      >
        <CrispBloodDroplet
          theme={theme}
          gooChildren={renderGooTitle(styles.titleGooIntro)}
          crispChildren={renderCrispTitle(styles.titleCrispIntro)}
        />
      </div>
    );
  }

  const isIntroClassActive = isTitleIntroActive || mode === "loading";

  const fallbackGooChildren = (
    <>
      {activeDroplets.map((droplet) => (
        <DropletShape
          key={droplet.id}
          offset={droplet.offset}
          delay={droplet.delay}
          scale={droplet.scale}
          initialPhase={droplet.phase}
          isPaused={!isVisible}
        />
      ))}
      {renderGooTitle(isIntroClassActive ? styles.titleGooIntro : undefined)}
    </>
  );

  // Only show red goo text in CSS fallback mode, not during loading
  return (
    <div
      ref={containerRef}
      className={`relative w-full overflow-hidden ${containerBgClass}`}
      style={{ height: "95vh" }}
    >
      {/* Prerendered red bars - visible immediately before PixiJS loads */}
      <div
        className="absolute top-0 left-0 right-0 h-[62px] pointer-events-none z-10"
        style={{ backgroundColor: "#880808" }}
      />
      <div
        className="absolute bottom-0 left-0 right-0 h-[62px] pointer-events-none z-10"
        style={{ backgroundColor: "#880808" }}
      />

      {mode === "css" && (
        <div className="absolute inset-0 pointer-events-none">
          <CrispBloodDroplet
            theme={theme}
            gooChildren={fallbackGooChildren}
            crispChildren={null}
          />
        </div>
      )}

      {mode === "webgl" && (
        <div className="absolute inset-0 pointer-events-none">
          <PixiDropletIndividual />
        </div>
      )}

      {mode === "loading" && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none" />
      )}

      {renderCrispTitle(
        mode !== "webgl" && isIntroClassActive
          ? styles.titleCrispIntro
          : undefined,
      )}
    </div>
  );
}
