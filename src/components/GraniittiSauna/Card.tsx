import type { ReactNode } from "react";
import styles from "./GraniittiSauna.module.css";

type GraniittiSaunaTheme = "light" | "dark";

interface CardProps {
  theme: GraniittiSaunaTheme;
  children: ReactNode;
}

export default function Card({ theme, children }: CardProps) {
  const themeClass = theme === "dark" ? styles.themeDark : styles.themeLight;

  return (
    <div className={`${styles.card} ${themeClass}`}>
      <div className={styles.cardContent}>{children}</div>
    </div>
  );
}
