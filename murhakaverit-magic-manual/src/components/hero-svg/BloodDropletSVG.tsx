import type { CSSProperties } from "react";
import BloodDropletShapeSVG from "./BloodDropletShapeSVG";
import styles from "./HeroSVG.module.css";

type BloodDropletVariant = "liquid" | "shape";

type BloodDropletSVGProps = {
  size: "large" | "small";
  delay: number;
  position: string;
  variant?: BloodDropletVariant;
};

export default function BloodDropletSVG({
  size,
  delay,
  position,
  variant = "shape",
}: BloodDropletSVGProps) {
  const sizeClass = size === "large" ? styles.dropLarge : styles.dropSmall;
  const variantClass =
    variant === "liquid" ? styles.innerLiquid : styles.innerShape;

  const style = {
    left: position,
    "--drop-delay": `${delay}s`,
  } as CSSProperties & Record<string, string>;

  return (
    <div className={`${styles.drop} ${sizeClass}`} style={style}>
      <div className={`${styles.dropInner} ${variantClass}`}>
        <BloodDropletShapeSVG />
      </div>
    </div>
  );
}
