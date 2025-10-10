import { Creepster } from "next/font/google";

const creepster = Creepster({
  weight: "400",
  subsets: ["latin"],
});

export const creepsterClass = creepster.className;

type TitleHeroSVGProps = {
  variant?: "crisp" | "goo";
  className?: string;
};

export default function TitleHeroSVG({
  variant = "crisp",
  className = "",
}: TitleHeroSVGProps) {
  const baseColor = variant === "goo" ? "#880808" : "#ffffff";
  const zIndex = variant === "goo" ? 2 : 10;
  const isGoo = variant === "goo";

  return (
    <span
      className={`${creepsterClass} uppercase w-full text-center ${className}`.trim()}
      style={{
        fontSize: "clamp(2rem, 16vw, 13rem)",
        position: "relative",
        zIndex,
        color: baseColor,
        pointerEvents: "none",
      }}
      aria-hidden={isGoo}
    >
      murhakaverit
    </span>
  );
}
