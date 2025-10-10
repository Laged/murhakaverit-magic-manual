import type { CSSProperties } from "react";

type BloodDropletShapeSVGProps = {
  className?: string;
  style?: CSSProperties;
};

export default function BloodDropletShapeSVG({
  className,
  style,
}: BloodDropletShapeSVGProps) {
  const viewBox = "0 0 59 62";

  // Blood drop path (59x62 viewBox) - cubic curves keep the organic taper while scaling cleanly.
  const pathData = [
    "m28.443,3.6945",
    "c2.45,11.902,6.93,17.65,12.688,25.359",
    "1.9918,2.667,3.2188,5.8992,3.2188,9.4844",
    "0,8.7667,-7.1395,15.875,-15.906,15.875",
    "-8.7667,0,-15.844,-7.1083,-15.844,-15.875",
    "0,-3.5378,1.0945,-6.9015,3.125,-9.4844",
    "6.009,-7.645,10.407,-13.424,12.718,-25.36",
    "z",
  ].join(" ");

  return (
    <svg
      viewBox={viewBox}
      width="100%"
      height="100%"
      preserveAspectRatio="xMidYMax meet"
      className={className}
      style={style}
      role="img"
      aria-labelledby="blood-droplet-svg-title"
    >
      <title id="blood-droplet-svg-title">Decorative blood droplet</title>
      <path d={pathData} shapeRendering="geometricPrecision" />
    </svg>
  );
}
