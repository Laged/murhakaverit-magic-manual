import PixiDropletSceneWrapper from "@/components/BloodDroplet/PixiDropletSceneWrapper";
import GraniittiSauna from "@/components/GraniittiSauna";

export const dynamic = "force-dynamic";

const HERO_THEME: "dark" | "light" = "dark";
const SAUNA_THEME: "dark" | "light" = "light";

export default function HomePage() {
  const heroBgClass = HERO_THEME === "light" ? "bg-white" : "bg-black";

  return (
    <main>
      <section className={heroBgClass}>
        <PixiDropletSceneWrapper theme={HERO_THEME} />
      </section>
      <GraniittiSauna theme={SAUNA_THEME} />
    </main>
  );
}
