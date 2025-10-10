import type { ReactNode } from "react";
import BloodDropletSVG from "./BloodDropletSVG";
import styles from "./HeroSVG.module.css";

function GooFilterDefs() {
  return (
    <svg className={styles.gooDefs} aria-hidden="true">
      <defs>
        <filter
          id="hero-svg-goo"
          x="-50%"
          y="-50%"
          width="200%"
          height="200%"
          colorInterpolationFilters="sRGB"
        >
          <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
          <feColorMatrix
            in="blur"
            type="matrix"
            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7"
            result="goo"
          />
          <feBlend in="SourceGraphic" in2="goo" />
        </filter>
      </defs>
    </svg>
  );
}

const largeDrops = [
  { position: "calc(20% - 25px)", delay: 0 },
  { position: "calc(40% - 25px)", delay: 2 },
  { position: "calc(50% - 25px)", delay: 5 },
  { position: "calc(65% - 25px)", delay: 3 },
  { position: "calc(85% - 25px)", delay: 7 },
];

const smallDrops = [
  { position: "calc(10% - 19px)", delay: 0.5 },
  { position: "calc(25% - 15px)", delay: 1.2 },
  { position: "calc(35% - 15px)", delay: 2.5 },
  { position: "calc(55% - 15px)", delay: 0.8 },
  { position: "calc(70% - 15px)", delay: 1.8 },
  { position: "calc(80% - 15px)", delay: 0.2 },
  { position: "calc(92% - 15px)", delay: 2.2 },
];

type ContainerHeroSVGProps = {
  children: ReactNode;
  gooChildren?: ReactNode;
  crispChildren?: ReactNode;
  extraDroplets?: ReactNode;
};

export default function ContainerHeroSVG({
  children,
  gooChildren,
  crispChildren,
  extraDroplets,
}: ContainerHeroSVGProps) {
  return (
    <>
      <GooFilterDefs />
      <div className={styles.container}>
        <div className={styles.gooLayer}>
          <div className={styles.gooBar} />
          <div className={styles.gooPool} />
          <div className={styles.gooPuddle} />

          {largeDrops.map((drop) => (
            <BloodDropletSVG
              key={`goo-large-${drop.position}-${drop.delay}`}
              size="large"
              delay={drop.delay}
              position={drop.position}
              variant="liquid"
            />
          ))}

          {smallDrops.map((drop) => (
            <BloodDropletSVG
              key={`goo-small-${drop.position}-${drop.delay}`}
              size="small"
              delay={drop.delay}
              position={drop.position}
              variant="liquid"
            />
          ))}

          {gooChildren ? (
            <div className={styles.gooCenter}>{gooChildren}</div>
          ) : null}
        </div>

        <div className={styles.bar} />

        <div className={styles.dropsCrisp}>
          {crispChildren ? (
            <div className={styles.crispCenter}>{crispChildren}</div>
          ) : null}

          {largeDrops.map((drop) => (
            <BloodDropletSVG
              key={`shape-large-${drop.position}-${drop.delay}`}
              size="large"
              delay={drop.delay}
              position={drop.position}
            />
          ))}

          {smallDrops.map((drop) => (
            <BloodDropletSVG
              key={`shape-small-${drop.position}-${drop.delay}`}
              size="small"
              delay={drop.delay}
              position={drop.position}
            />
          ))}

          {extraDroplets}
        </div>

        <div className={styles.content}>{children}</div>
      </div>
    </>
  );
}

(
  ContainerHeroSVG as typeof ContainerHeroSVG & {
    BloodDroplet: typeof BloodDropletSVG;
  }
).BloodDroplet = BloodDropletSVG;
