import BloodDropletShape from "@/components/hero/BloodDropletShape";
import ContainerHero from "@/components/hero/ContainerHero";
import TitleHero from "@/components/hero/TitleHero";
import BloodDroplet from "./BloodDroplet";

export default function Hero() {
  return (
    <ContainerHero>
      <TitleHero />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "1rem",
          zIndex: 20,
          position: "relative",
        }}
      >
        <BloodDroplet size="small" position="200" delay={0}></BloodDroplet>
        <BloodDropletShape size="large" />
        <BloodDropletShape size="small" />
      </div>
    </ContainerHero>
  );
}
