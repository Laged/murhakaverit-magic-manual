import BloodDropletScene from "@/components/BloodDropletScene";
import GraniittiSauna from "@/components/GraniittiSauna";

export const dynamic = "force-dynamic";

const HERO_THEME: "dark" | "light" = "dark";
const SAUNA_THEME: "dark" | "light" = "light";

export default function HomePage() {
  return (
    <main>
      <BloodDropletScene theme={HERO_THEME} />
      {/* Temporarily removed for performance */}
      {/* <GraniittiSauna theme={SAUNA_THEME} /> */}
    </main>
  );
}
