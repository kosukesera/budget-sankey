import { useState, useEffect, useMemo, useCallback } from "react";
import texts from "../data/texts.json";
import { fmt, pct } from "../lib/format";
import SankeyView from "./SankeyView";
import ContextPanel from "./ContextPanel";

/**
 * Tab B: Functions → Ministries with drill-down into ministry internals.
 */
export default function MinistryView({ data, displayMode, setDisplayMode }) {
  const { functions, ministries, total } = data;

  const [hover, setHover] = useState(null);
  const [drill, setDrill] = useState(null);
  const [dims, setDims] = useState({ w: 960, h: 460 });

  useEffect(() => {
    const update = () =>
      setDims({
        w: Math.min(960, window.innerWidth - 24),
        h: Math.max(360, Math.min(480, window.innerHeight - 400)),
      });
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const { w, h } = dims;

  // Current view
  const { leftItems, rightItems, drillableIds } = useMemo(() => {
    if (drill) {
      const l = [
        {
          id: drill.id,
          label: drill.label,
          value: drill.value,
          color: drill.color,
        },
      ];
      const r = drill.children.map((c) => ({ ...c }));
      return { leftItems: l, rightItems: r, drillableIds: new Set() };
    }
    const l = functions;
    const r = ministries;
    return {
      leftItems: l,
      rightItems: r,
      drillableIds: new Set(
        ministries.filter((m) => m.children).map((m) => m.id)
      ),
    };
  }, [drill, functions, ministries]);

  const handleDrill = useCallback(
    (id) => {
      const m = ministries.find((x) => x.id === id);
      if (m?.children) {
        setHover(null);
        setDrill(m);
      }
    },
    [ministries]
  );

  // Find context for hover
  const findCtx = () => {
    if (!hover) {
      if (drill) {
        const mTexts = texts.ministries[drill.id];
        return {
          ctx: mTexts?.ctx || texts.defaults.ministry,
          label: drill.label,
          color: drill.color,
        };
      }
      return { ctx: texts.defaults.ministry, label: null, color: null };
    }
    // Check ministries text (top-level)
    const mTexts = texts.ministries[hover];
    if (mTexts?.ctx) {
      const item = ministries.find((m) => m.id === hover);
      return {
        ctx: mTexts.ctx,
        label: item?.label || hover,
        color: item?.color || null,
      };
    }
    // Check ministry breakdown text (drill children)
    if (drill) {
      const bTexts = texts.ministryBreakdown?.[hover];
      if (bTexts) {
        const child = drill.children?.find((c) => c.id === hover);
        return {
          ctx: bTexts,
          label: child?.label || hover,
          color: child?.color || drill.color,
        };
      }
    }
    return { ctx: texts.defaults.ministry, label: null, color: null };
  };
  const { ctx: activeCtx, label: ctxLabel, color: ctxColor } = findCtx();

  const leftLabel = drill ? drill.label : "歳出（機能別）";
  const rightLabel = drill ? "内訳" : "所管省庁";

  return (
    <div style={{ maxWidth: w }}>
      {drill && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            marginBottom: 4,
            fontSize: 12,
          }}
        >
          <button
            onClick={() => {
              setDrill(null);
              setHover(null);
            }}
            style={{
              background: "#1e293b",
              border: "1px solid #334155",
              borderRadius: 5,
              color: "#60a5fa",
              padding: "2px 10px",
              cursor: "pointer",
              fontSize: 11,
            }}
          >
            ← 省庁一覧
          </button>
          <span style={{ color: "#334155" }}>›</span>
          <span style={{ color: drill.color, fontWeight: 700 }}>
            {drill.label}
          </span>
          <span style={{ color: "#475569", fontSize: 10 }}>
            {displayMode === "pct" ? pct(drill.value, total) : fmt(drill.value)}
          </span>
        </div>
      )}

      {/* Column labels */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 2,
          padding: "0 2px",
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: drill ? drill.color : "#f97316",
            letterSpacing: 1,
          }}
        >
          {leftLabel}
        </div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: drill ? "#94a3b8" : "#22c55e",
            letterSpacing: 1,
          }}
        >
          {rightLabel}
        </div>
      </div>

      <SankeyView
        leftItems={leftItems}
        rightItems={rightItems}
        w={w}
        h={h}
        hover={hover}
        setHover={setHover}
        onDrill={handleDrill}
        drillableIds={drillableIds}
        displayMode={displayMode}
        setDisplayMode={setDisplayMode}
        total={data.total}
      />

      {/* Guide text */}
      <div
        style={{
          marginTop: 8,
          padding: "10px 14px",
          background: "#1e293b",
          borderRadius: 8,
          border: "1px solid #334155",
          fontSize: 13,
          color: "#cbd5e1",
          lineHeight: 1.7,
        }}
      >
        {drill ? (
          <>
            <span style={{ color: drill.color, fontWeight: 700 }}>
              {drill.label}
            </span>
            の所管予算
            <span style={{ fontWeight: 700 }}>
              {displayMode === "pct" ? pct(drill.value, total) : fmt(drill.value)}
            </span>
            （歳出全体の{pct(drill.value, total)}）の内訳。
            <span style={{ color: "#94a3b8" }}>
              {texts.ministries[drill.id]?.guide || ""}
            </span>
          </>
        ) : (
          texts.defaults.ministry.guide
        )}
      </div>

      <ContextPanel ctx={activeCtx} itemLabel={ctxLabel} itemColor={ctxColor} />

      {/* Hint */}
      <div
        style={{
          marginTop: 6,
          textAlign: "center",
          fontSize: 11,
          color: "#475569",
        }}
      >
        ホバーで解説が切り替わります
        {drillableIds.size > 0 && (
          <>
            {" "}
            ·{" "}
            <span style={{ textDecoration: "underline", textUnderlineOffset: "2px" }}>
              下線🔍
            </span>{" "}
            の省庁はクリックで内訳を展開
          </>
        )}
      </div>
    </div>
  );
}
