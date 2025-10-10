import ContainerHeroSVG from "./ContainerHeroSVG";
import styles from "./HeroSVG.module.css";
import TitleHeroSVG from "./TitleHeroSVG";

export default function HeroSVG() {
  const gooTitle = (
    <div
      style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        pointerEvents: "none",
      }}
    >
      <TitleHeroSVG
        variant="goo"
        className={`${styles.titleLayer} ${styles.titleLayerGoo}`}
      />
    </div>
  );

  const crispTitle = (
    <div
      style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        pointerEvents: "none",
        zIndex: 11,
      }}
    >
      <TitleHeroSVG
        className={`${styles.titleLayer} ${styles.titleLayerCrisp}`}
      />
    </div>
  );

  const titleSpacer = (
    <div style={{ opacity: 0, pointerEvents: "none" }}>
      <TitleHeroSVG className={styles.titleLayer} />
    </div>
  );

  return (
    <ContainerHeroSVG gooChildren={gooTitle}>
      <div className={styles.contentCenter} style={{ position: "relative" }}>
        {crispTitle}
        {titleSpacer}
      </div>
    </ContainerHeroSVG>
  );
}
