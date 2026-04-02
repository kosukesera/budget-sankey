/**
 * Magnifying glass SVG icon for drillable nodes.
 */
export default function SearchIcon({ x, y, size = 8, opacity = 0.6 }) {
  const r = size * 0.35;
  return (
    <g
      transform={`translate(${x},${y})`}
      opacity={opacity}
      style={{ pointerEvents: "none" }}
    >
      <circle cx={0} cy={0} r={r} fill="none" stroke="#fff" strokeWidth={1.2} />
      <line
        x1={r * 0.7}
        y1={r * 0.7}
        x2={size * 0.5}
        y2={size * 0.5}
        stroke="#fff"
        strokeWidth={1.2}
        strokeLinecap="round"
      />
    </g>
  );
}
