import { useMemo } from "react";
import { calcLayout } from "../lib/layout";
import { fmt, pct } from "../lib/format";
import SearchIcon from "./SearchIcon";
import DisplayToggle from "./DisplayToggle";

/**
 * SVG Sankey diagram renderer.
 * Supports hover highlighting, double-click drill-down, and tooltip.
 * Nodes too small to interact with are listed below the SVG.
 */
export default function SankeyView({
  leftItems,
  rightItems,
  w,
  h,
  hover,
  setHover,
  onDrill,
  drillableIds,
  displayMode = "yen",
  setDisplayMode,
  total,
}) {
  const { left, right, links } = useMemo(
    () => calcLayout(leftItems, rightItems, w, h),
    [leftItems, rightItems, w, h]
  );

  // Compute column sums for percentage display
  const leftSum = useMemo(() => leftItems.reduce((s, i) => s + i.value, 0), [leftItems]);
  const rightSum = useMemo(() => rightItems.reduce((s, i) => s + i.value, 0), [rightItems]);

  const fmtVal = (nd) => {
    if (displayMode === "pct") {
      const colSum = nd.x < w / 2 ? leftSum : rightSum;
      return pct(nd.value, colSum);
    }
    return fmt(nd.value);
  };

  const isActive = (id) => !hover || hover === id;
  const isLinkActive = (l) =>
    !hover || l.sourceId === hover || l.targetId === hover;

  // All right-side nodes for the item list below the SVG
  const rightNodes = right;

  // Find hovered node for tooltip
  const hoveredNode = useMemo(() => {
    if (!hover) return null;
    return [...left, ...right].find((nd) => nd.id === hover) || null;
  }, [hover, left, right]);

  const canDrillHovered = hoveredNode && drillableIds?.has(hoveredNode.id);

  // Position tooltip to the inside of the diagram, away from the node
  const tooltipPos = useMemo(() => {
    if (!hoveredNode) return null;
    const nd = hoveredNode;
    const isLeft = nd.x < w / 2;
    const hasGlobalPct = displayMode === "pct" && total;
    const tipW = canDrillHovered ? 180 : hasGlobalPct ? 170 : 128;
    const tipH = canDrillHovered ? (hasGlobalPct ? 50 : 38) : (hasGlobalPct ? 36 : 22);

    // Place tooltip on the inner side of the node (toward center of diagram)
    let tx, ty;
    if (isLeft) {
      tx = nd.x + nd.width + 8;
    } else {
      tx = nd.x - tipW - 8;
    }
    // Vertically centered on the node, clamped to SVG bounds
    ty = Math.max(4, Math.min(h - tipH - 4, nd.y + nd.height / 2 - tipH / 2));

    return { x: tx, y: ty, w: tipW, h: tipH };
  }, [hoveredNode, canDrillHovered, w, h, displayMode, total]);

  return (
    <>
      <svg
        width={w}
        height={h}
        viewBox={`0 0 ${w} ${h}`}
        style={{
          display: "block",
          borderRadius: 8,
          background: "#0f1117",
          border: "1px solid #1e293b",
        }}
        onMouseLeave={() => setHover(null)}
      >
        <defs>
          {links.map((l) => (
            <linearGradient key={`g${l.id}`} id={`g${l.id}`} x1="0%" x2="100%">
              <stop offset="0%" stopColor={l.sourceColor} stopOpacity={0.5} />
              <stop offset="100%" stopColor={l.targetColor} stopOpacity={0.5} />
            </linearGradient>
          ))}
        </defs>

        {/* Flow paths */}
        {links.map((l) => {
          const mx = (l.sx + l.tx) / 2;
          const t = l.thickness / 2;
          return (
            <path
              key={l.id}
              d={`M${l.sx},${l.sy - t} C${mx},${l.sy - t} ${mx},${l.ty - t} ${l.tx},${l.ty - t} L${l.tx},${l.ty + t} C${mx},${l.ty + t} ${mx},${l.sy + t} ${l.sx},${l.sy + t} Z`}
              fill={`url(#g${l.id})`}
              opacity={isLinkActive(l) ? 0.6 : 0.04}
              style={{ transition: "opacity 0.3s" }}
            />
          );
        })}

        {/* Nodes */}
        {[...left, ...right].map((nd) => {
          const active = isActive(nd.id);
          const canDrill = drillableIds?.has(nd.id);
          const fs = Math.min(13, Math.max(8.5, nd.height * 0.32));
          const labelY = nd.y + nd.height / 2 - (nd.height > 36 ? 7 : 0);
          const approxTextW = nd.label.length * fs * 0.55;

          return (
            <g
              key={nd.id}
              onMouseEnter={() => setHover(nd.id)}
              onDoubleClick={canDrill ? () => onDrill(nd.id) : undefined}
              style={{ cursor: canDrill ? "pointer" : "default" }}
            >
              <rect
                x={nd.x}
                y={nd.y}
                width={nd.width}
                height={nd.height}
                rx={3}
                fill={nd.color}
                opacity={active ? 0.85 : 0.08}
                style={{ transition: "opacity 0.3s" }}
              />

              {nd.height > 14 && (
                <>
                  <text
                    x={nd.x + nd.width / 2}
                    y={labelY}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill="#fff"
                    fontSize={fs}
                    fontWeight={700}
                    opacity={active ? 1 : 0.2}
                    style={{
                      transition: "opacity 0.3s",
                      pointerEvents: "none",
                    }}
                  >
                    {nd.label}
                  </text>

                  {canDrill && (
                    <line
                      x1={nd.x + nd.width / 2 - approxTextW / 2}
                      y1={labelY + fs * 0.55}
                      x2={nd.x + nd.width / 2 + approxTextW / 2}
                      y2={labelY + fs * 0.55}
                      stroke="#fff"
                      strokeWidth={0.8}
                      opacity={active ? 0.7 : 0.12}
                      style={{ transition: "opacity 0.3s", pointerEvents: "none" }}
                    />
                  )}

                  {canDrill && (
                    <SearchIcon
                      x={nd.x + nd.width - 8}
                      y={nd.y + 7}
                      size={7}
                      opacity={active ? 0.8 : 0.1}
                    />
                  )}
                </>
              )}

              {nd.height > 36 && (
                <text
                  x={nd.x + nd.width / 2}
                  y={nd.y + nd.height / 2 + 9}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="#cbd5e1"
                  fontSize={Math.min(10.5, fs - 1)}
                  opacity={active ? 0.7 : 0.1}
                  style={{ transition: "opacity 0.3s", pointerEvents: "none" }}
                >
                  {fmtVal(nd)}
                </text>
              )}
            </g>
          );
        })}

        {/* Tooltip anchored next to the hovered node */}
        {tooltipPos && hoveredNode && (
          <g
            transform={`translate(${tooltipPos.x},${tooltipPos.y})`}
            style={{ pointerEvents: "none" }}
          >
            <rect
              x={0}
              y={0}
              width={tooltipPos.w}
              height={tooltipPos.h}
              rx={4}
              fill="#1e293b"
              fillOpacity={0.95}
              stroke="#334155"
              strokeWidth={0.5}
            />
            <text x={8} y={15} fill="#e2e8f0" fontSize={10.5} fontWeight={600}>
              {hoveredNode.label}  {fmtVal(hoveredNode)}
            </text>
            {displayMode === "pct" && total && (
              <text x={8} y={29} fill="#94a3b8" fontSize={9}>
                （歳出全体の{pct(hoveredNode.value, total)}）
              </text>
            )}
            {canDrillHovered && (
              <text x={8} y={displayMode === "pct" && total ? 43 : 30} fill="#60a5fa" fontSize={9.5}>
                ダブルクリックで詳細を表示
              </text>
            )}
          </g>
        )}
      </svg>

      {/* Right-side item list + display toggle */}
      {rightNodes.length > 1 && (
        <div
          style={{
            marginTop: 6,
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 4,
            padding: "6px 10px",
            background: "#131620",
            borderRadius: 6,
            border: "1px solid #1e293b",
          }}
        >
          {rightNodes.map((nd) => {
            const canDrill = drillableIds?.has(nd.id);
            return (
              <button
                key={nd.id}
                onMouseEnter={() => setHover(nd.id)}
                onMouseLeave={() => setHover(null)}
                onDoubleClick={canDrill ? () => onDrill(nd.id) : undefined}
                style={{
                  background: hover === nd.id ? "#1e293b" : "transparent",
                  border: `1px solid ${hover === nd.id ? nd.color || "#475569" : "#1e293b"}`,
                  borderRadius: 4,
                  color: nd.color || "#94a3b8",
                  padding: "2px 8px",
                  cursor: canDrill ? "pointer" : "default",
                  fontSize: 11,
                  lineHeight: "18px",
                  transition: "all 0.2s",
                }}
              >
                {nd.label}
                <span style={{ color: "#64748b", marginLeft: 4, fontSize: 9 }}>
                  {displayMode === "pct" ? pct(nd.value, rightSum) : fmt(nd.value)}
                </span>
              </button>
            );
          })}
          {setDisplayMode && (
            <div style={{ marginLeft: "auto" }}>
              <DisplayToggle displayMode={displayMode} setDisplayMode={setDisplayMode} />
            </div>
          )}
        </div>
      )}
    </>
  );
}
