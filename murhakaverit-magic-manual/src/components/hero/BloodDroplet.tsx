import BloodDropletShape from "./BloodDropletShape";
import styles from "./Hero.module.css";

type BloodDropletProps = {
  size: "large" | "small";
  delay: number;
  position: string;
};

export default function BloodDroplet({
  size,
  delay,
  position,
}: BloodDropletProps) {
  const className = size === "large" ? styles.dropLarge : styles.dropSmall;

  return (
    <div
      className={className}
      style={{
        left: position,
        animationDelay: `${delay}s`,
      }}
    >
      <BloodDropletShape size={size} />
    </div>
  );
}
