import BloodDroplet, { DropletShape } from "@/components/BloodDroplet";
import styles from "@/components/BloodDroplet/BloodDroplet.module.css";

export const dynamic = "force-dynamic";

const BASE_OFFSETS = [20, 40, 60, 80];
const JITTER_RANGE = 12; // percentage points applied symmetrically
const MIN_OFFSET = 5;
const MAX_OFFSET = 95;

const getRandomScale = () => Math.random() * 1.25 + 0.25;
const getRandomOffset = (base: number) => {
  const jitter = (Math.random() * 2 - 1) * JITTER_RANGE;
  return Math.min(MAX_OFFSET, Math.max(MIN_OFFSET, base + jitter));
};

export default function HomePage() {
  const droplets = BASE_OFFSETS.map((baseOffset, index) => {
    const offset = getRandomOffset(baseOffset);
    const scale = getRandomScale();

    return {
      offset,
      scale,
      delay: index * 0.5,
      key: `${offset.toFixed(2)}-${scale.toFixed(2)}-${index}`,
    };
  });

  return (
    <div className="h-screen w-screen">
      <BloodDroplet
        gooChildren={
          <>
            {droplets.map(({ key, offset, scale, delay }) => (
              <DropletShape
                key={key}
                offset={offset}
                delay={delay}
                scale={scale}
              />
            ))}
            <div className={styles.titleGoo}>
              <h1>murhakaverit</h1>
            </div>
          </>
        }
        crispChildren={
          <div className={styles.titleCrisp}>
            <h1>murhakaverit</h1>
          </div>
        }
      />
    </div>
  );
}
