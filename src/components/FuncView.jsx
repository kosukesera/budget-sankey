import { useState, useEffect, useMemo, useCallback } from "react";
import { MINISTRY_MAP } from "../data/ministries";
import texts from "../data/texts.json";
import { fmt, pct } from "../lib/format";
import SankeyView from "./SankeyView";
import ContextPanel from "./ContextPanel";
import Breadcrumb from "./Breadcrumb";

/**
 * Tab A: Revenue → Expenditure (functional) with 3-level drill-down.
 */
export default function FuncView({ data, displayMode, setDisplayMode }) {
  const { revenue, expenditure } = data;

  const [hover, setHover] = useState(null);
  const [path, setPath] = useState([]);
  const [dims, setDims] = useState({ w: 960, h: 480 });

  useEffect(() => {
    const update = () =>
      setDims({
        w: Math.min(960, window.innerWidth - 24),
        h: Math.max(380, Math.min(520, window.innerHeight - 380)),
      });
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // Current view items
  const currentView = useMemo(() => {
    if (!path.length) {
      return {
        leftItems: revenue,
        rightItems: expenditure,
        leftLabel: "歳入",
        rightLabel: "歳出",
      };
    }
    const cur = path[path.length - 1];
    return {
      leftItems: [
        { id: cur.id, label: cur.label, value: cur.value, color: cur.color },
      ],
      rightItems: cur.children.map((c) => ({
        ...c,
        color: c.color || MINISTRY_MAP[c.ministry]?.color || "#94a3b8",
      })),
      leftLabel:
        path.length === 1
          ? "主要経費"
          : path[path.length - 2]?.label || "",
      rightLabel: "詳細費目",
    };
  }, [path, revenue, expenditure]);

  // Drillable IDs
  const drillableIds = useMemo(() => {
    const s = new Set();
    if (!path.length) {
      expenditure.forEach((e) => {
        if (e.children) s.add(e.id);
      });
    } else {
      const cur = path[path.length - 1];
      cur.children?.forEach((c) => {
        if (c.children) s.add(c.id);
      });
    }
    return s;
  }, [path, expenditure]);

  const handleDrill = useCallback(
    (id) => {
      setHover(null);
      if (!path.length) {
        const it = expenditure.find((e) => e.id === id);
        if (it?.children) setPath([it]);
      } else {
        const cur = path[path.length - 1];
        const it = cur.children.find((c) => c.id === id);
        if (it?.children)
          setPath([
            ...path,
            {
              ...it,
              color:
                it.color || MINISTRY_MAP[it.ministry]?.color || "#94a3b8",
            },
          ]);
      }
    },
    [path, expenditure]
  );

  const goBack = (idx) => {
    setHover(null);
    idx < 0 ? setPath([]) : setPath(path.slice(0, idx + 1));
  };

  const { w, h } = dims;
  const { leftItems, rightItems, leftLabel, rightLabel } = currentView;

  // Find context for hover
  const findCtx = () => {
    if (!hover) {
      return { ctx: texts.defaults.func, label: null, color: null };
    }
    // Search texts.expenditure for hover id
    const t = texts.expenditure[hover];
    if (t) {
      // Find the item to get label/color
      const allItems = [
        ...expenditure,
        ...expenditure.flatMap((e) => e.children || []),
        ...expenditure.flatMap((e) =>
          (e.children || []).flatMap((c) => c.children || [])
        ),
      ];
      const item = allItems.find((i) => i.id === hover);
      return {
        ctx: t,
        label: item?.label || hover,
        color: item?.color || MINISTRY_MAP[item?.ministry]?.color || null,
      };
    }
    return { ctx: texts.defaults.func, label: null, color: null };
  };
  const { ctx: activeCtx, label: ctxLabel, color: ctxColor } = findCtx();

  // Ministry legend for drill views
  const ministries =
    path.length > 0
      ? [
          ...new Set(
            rightItems.map((i) => i.ministry).filter(Boolean)
          ),
        ]
          .map((m) => MINISTRY_MAP[m])
          .filter(Boolean)
      : [];

  const depthLabels = ["全体像", "中分類", "個別施策"];
  const depth = path.length;

  return (
    <div style={{ maxWidth: w }}>
      {/* Depth indicator */}
      <div
        style={{
          display: "flex",
          gap: 3,
          marginBottom: 5,
          justifyContent: "flex-end",
        }}
      >
        {depthLabels.map((l, i) => (
          <div
            key={l}
            style={{
              fontSize: 10,
              padding: "2px 7px",
              borderRadius: 10,
              background: i === depth ? "#334155" : "transparent",
              color: i === depth ? "#e2e8f0" : "#475569",
              border: `1px solid ${i === depth ? "#475569" : "#1e293b"}`,
            }}
          >
            {l}
          </div>
        ))}
      </div>

      <Breadcrumb path={path} onNavigate={goBack} />

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
            color:
              path.length > 0
                ? path[path.length - 1].color || "#94a3b8"
                : "#60a5fa",
            letterSpacing: 1,
          }}
        >
          {leftLabel}
        </div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: path.length > 0 ? "#94a3b8" : "#f97316",
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

      {/* Ministry legend */}
      {ministries.length > 0 && (
        <div
          style={{
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
            marginTop: 6,
            padding: "5px 10px",
            background: "#131620",
            borderRadius: 6,
            border: "1px solid #1e293b",
          }}
        >
          <span style={{ fontSize: 10, color: "#475569" }}>所管:</span>
          {ministries.map((m) => (
            <div
              key={m.label}
              style={{ display: "flex", alignItems: "center", gap: 3 }}
            >
              <div
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: 2,
                  background: m.color,
                }}
              />
              <span style={{ fontSize: 10, color: "#94a3b8" }}>{m.label}</span>
            </div>
          ))}
        </div>
      )}

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
        {path.length > 0 ? (
          <>
            <span
              style={{
                color: path[path.length - 1].color,
                fontWeight: 700,
              }}
            >
              {path[path.length - 1].label}
            </span>
            の所管予算
            <span style={{ fontWeight: 700 }}>
              {displayMode === "pct"
                ? pct(path[path.length - 1].value, data.total)
                : fmt(path[path.length - 1].value)}
            </span>
            の内訳。
          </>
        ) : (
          texts.defaults.func.guide
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
              下線付き🔍
            </span>{" "}
            の項目はクリックでさらに展開
          </>
        )}
      </div>
    </div>
  );
}
