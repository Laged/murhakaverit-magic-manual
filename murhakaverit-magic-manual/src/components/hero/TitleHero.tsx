import { Creepster } from "next/font/google";

const creepster = Creepster({
  weight: "400",
  subsets: ["latin"],
});

export default function TitleHero() {
  return (
    <span
      className={`${creepster.className} uppercase w-full text-center text-white`}
      style={{
        fontSize: "clamp(2rem, 17vw, 20rem)",
        position: "relative",
        zIndex: 10,
      }}
    >
      murhakaverit
    </span>
  );
}
