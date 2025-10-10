type BloodDropletShapeProps = {
  size: "large" | "small";
  style?: React.CSSProperties;
  className?: string;
};

export default function BloodDropletShape({
  size,
  style,
  className,
}: BloodDropletShapeProps) {
  const isLarge = size === "large";
  const viewBox = "0 0 59 62";
  const width = isLarge ? 59 : 29.5;
  const height = isLarge ? 62 : 31;

  // Blood drop path (59x62 viewBox) - uses cubic bezier curves for smooth organic shape
  const pathData = [
    "m28.443,3.6945", // Move to: starting point near top center
    "c2.45,11.902,6.93,17.65,12.688,25.359", // Cubic curve: right side of narrow top (control points define curve shape)
    "1.9918,2.667,3.2188,5.8992,3.2188,9.4844", // Continuation: transition into circular bottom right
    "0,8.7667,-7.1395,15.875,-15.906,15.875", // Continuation: bottom right arc of circle
    "-8.7667,0,-15.844,-7.1083,-15.844,-15.875", // Continuation: bottom left arc of circle
    "0,-3.5378,1.0945,-6.9015,3.125,-9.4844", // Continuation: transition from circular bottom to left side
    "6.009,-7.645,10.407,-13.424,12.718,-25.36", // Continuation: left side of narrow top back to start
    "z", // Close path
  ].join(" ");

  return (
    <svg
      viewBox={viewBox}
      width={width}
      height={height}
      style={style}
      className={className}
      role="img"
      aria-labelledby="blood-droplet-static-title"
    >
      <title id="blood-droplet-static-title">Decorative blood droplet</title>
      <path d={pathData} fill="#880808" />
    </svg>
  );
}
