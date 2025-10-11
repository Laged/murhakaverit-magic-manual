import type { ReactNode } from "react";
import Card from "./Card";
import styles from "./GraniittiSauna.module.css";
import SmokeOverlay from "./SmokeOverlay";

type GraniittiSaunaTheme = "light" | "dark";

interface GraniittiSaunaProps {
  theme?: GraniittiSaunaTheme;
}

export default function GraniittiSauna({
  theme = "light",
}: GraniittiSaunaProps) {
  const sectionClass = `${styles.section} ${
    theme === "dark" ? styles.sectionDark : styles.sectionLight
  }`;

  return (
    <section className={sectionClass}>
      <div className={styles.smokeContainer}>
        <SmokeOverlay />
      </div>
      <div className={styles.cardWrapper}>
        <Card theme={theme}>
          <div className="flex flex-col gap-8">
            <header className={styles.header}>
              <h2 className={styles.heading}>Graniittisauna 05/2026</h2>
              <p className={styles.body}>
                Murhamysteereitä, lautapelejä ja saunomista luvassa toukokuussa
                2026. Hyvässä porukassa, tietenkin! Syksyllä hyväksi todettu
                graniittisaunareissu tulee uudestaan. Lisätiedot alla.
              </p>
            </header>

            <div className="flex flex-col gap-4">
              <DetailRow label="Paikka">
                Storfinnhova Gård{" "}
                <a
                  href="https://www.storfinnhova.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.externalLink}
                >
                  ↗
                </a>
              </DetailRow>
              <DetailRow label="Aika">Toukokuu 2026</DetailRow>
              <DetailRow label="Ohjelma">
                Jubensha - BotC - Ten Candles - jne.
              </DetailRow>
              <DetailRow label="Osallistuminen">Vain kutsulla</DetailRow>
            </div>

            <div className={styles.buttonWrap}>
              <button type="button" className={styles.button}>
                Ilmoittaudu tästä!
              </button>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
}

interface DetailRowProps {
  label: string;
  children: ReactNode;
}

function DetailRow({ label, children }: DetailRowProps) {
  return (
    <div className={styles.detailRow}>
      <span className={styles.detailLabel}>{label}:</span>
      <span className={styles.detailValue}>{children}</span>
    </div>
  );
}
