import type { ReactNode } from "react";
import BloodDroplet from "@/components/hero/BloodDroplet";
import styles from "./Hero.module.css";

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

type ContainerHeroProps = {
  children: ReactNode;
  extraDroplets?: ReactNode;
};

export default function ContainerHero({
  children,
  extraDroplets,
}: ContainerHeroProps) {
  return (
    <div className={styles.container}>
      {/* Single blur area for all drops */}
      <div className={styles.blendArea}>
        {/* Large drops */}
        {largeDrops.map((drop) => (
          <BloodDroplet
            key={`large-${drop.position}-${drop.delay}`}
            size="large"
            delay={drop.delay}
            position={drop.position}
          />
        ))}

        {/* Small drops */}
        {smallDrops.map((drop) => (
          <BloodDroplet
            key={`small-${drop.position}-${drop.delay}`}
            size="small"
            delay={drop.delay}
            position={drop.position}
          />
        ))}

        {/* Extra droplets passed as prop */}
        {extraDroplets}

        <div className={styles.barBlur} />
      </div>

      {/* Sharp bar on top for crisp edges */}
      <div className={styles.bar} />

      {children}
    </div>
  );
}

ContainerHero.BloodDroplet = BloodDroplet;
