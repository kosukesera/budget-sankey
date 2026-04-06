import { useState, useMemo } from "react";
import { YEARS } from "../constants";
import useBudgetData from "../hooks/useBudgetData";
import useDims from "../hooks/useDims";
import SankeyView from "./SankeyView";
import DiffChart from "./DiffChart";
import { fmt } from "../lib/format";

const sign = (v) => (v >= 0 ? "+" : "−") + fmt(Math.abs(v));
const signPct = (v, base) => {
  if (!base) return "";
  const r = (v / base) * 100;
  return (r >= 0 ? "+" : "−") + Math.abs(r).toFixed(1) + "%";
};

export default function CompareView() {
  const [yearKeyA, setYearKeyA] = useState(YEARS[1]?.key || "fy2024");
  const [yearKeyB, setYearKeyB] = useState(YEARS[0]?.key || "fy2025");
  const [hover, setHover] = useState(null);
  const [drill, setDrill] = useState(null); // drilled expenditure id (e.g. "e_ss")
  const { w, h, isMobile, isTablet } = useDims((vw, vh) =>
    Math.max(280, Math.min(400, vh - (vw <= 480 ? 380 : 480)))
  );

  const handleYearA = (key) => { setYearKeyA(key); setDrill(null); };
  const handleYearB = (key) => { setYearKeyB(key); setDrill(null); };

  const dataA = useBudgetData(yearKeyA);
  const dataB = useBudgetData(yearKeyB);
  const loading = dataA.loading || dataB.loading;
  const error = dataA.error || dataB.error;

  const isNarrow = isMobile || isTablet;
  const sankeyW = isNarrow ? w : Math.floor((w - 16) / 2);

  // Drillable IDs: expenditure items that have children in BOTH datasets
  const drillableIds = useMemo(() => {
    if (!dataA.data || !dataB.data) return new Set();
    const idsA = new Set(
      dataA.data.expenditure.filter((e) => e.children?.length).map((e) => e.id)
    );
    return new Set(
      dataB.data.expenditure.filter((e) => e.children?.length && idsA.has(e.id)).map((e) => e.id)
    );
  }, [dataA.data, dataB.data]);

  // Build Sankey data for each side
  const viewA = useMemo(() => {
    if (!dataA.data) return null;
    if (!drill) {
      return { left: dataA.data.revenue, right: dataA.data.expenditure };
    }
    const parent = dataA.data.expenditure.find((e) => e.id === drill);
    if (!parent?.children?.length) return null;
    return {
      left: [{ id: parent.id, label: parent.label, value: parent.value, color: parent.color }],
      right: parent.children.map((c) => ({ ...c, color: parent.color })),
    };
  }, [dataA.data, drill]);

  const viewB = useMemo(() => {
    if (!dataB.data) return null;
    if (!drill) {
      return { left: dataB.data.revenue, right: dataB.data.expenditure };
    }
    const parent = dataB.data.expenditure.find((e) => e.id === drill);
    if (!parent?.children?.length) return null;
    return {
      left: [{ id: parent.id, label: parent.label, value: parent.value, color: parent.color }],
      right: parent.children.map((c) => ({ ...c, color: parent.color })),
    };
  }, [dataB.data, drill]);

  // Compute scale for current view
  const scaleTotal = useMemo(() => {
    if (!viewA || !viewB) return 0;
    const sumSide = (items) => items.reduce((s, i) => s + i.value, 0);
    return Math.max(
      Math.max(sumSide(viewA.left), sumSide(viewA.right)),
      Math.max(sumSide(viewB.left), sumSide(viewB.right)),
    );
  }, [viewA, viewB]);

  // Drillable IDs for the drilled-in view (children with children — not used for now)
  const drillChildIds = useMemo(() => new Set(), []);

  // Build pseudo-data for DiffChart when drilled
  const diffOldData = useMemo(() => {
    if (!dataA.data) return null;
    if (!drill) return dataA.data;
    const parent = dataA.data.expenditure.find((e) => e.id === drill);
    if (!parent?.children) return null;
    return { ...dataA.data, expenditure: parent.children.map((c) => ({ ...c, color: parent.color })) };
  }, [dataA.data, drill]);

  const diffNewData = useMemo(() => {
    if (!dataB.data) return null;
    if (!drill) return dataB.data;
    const parent = dataB.data.expenditure.find((e) => e.id === drill);
    if (!parent?.children) return null;
    return { ...dataB.data, expenditure: parent.children.map((c) => ({ ...c, color: parent.color })) };
  }, [dataB.data, drill]);

  const labelA = YEARS.find((y) => y.key === yearKeyA)?.label || yearKeyA;
  const labelB = YEARS.find((y) => y.key === yearKeyB)?.label || yearKeyB;

  const drillLabel = useMemo(() => {
    if (!drill || !dataB.data) return "";
    return dataB.data.expenditure.find((e) => e.id === drill)?.label || "";
  }, [drill, dataB.data]);

  // Key numbers
  const keyNumbers = useMemo(() => {
    if (!dataA.data || !dataB.data) return null;
    const totalDiff = dataB.data.total - dataA.data.total;
    const taxA = dataA.data.revenue.filter((r) => r.id !== "r_bnd" && r.id !== "r_etc").reduce((s, r) => s + r.value, 0);
    const taxB = dataB.data.revenue.filter((r) => r.id !== "r_bnd" && r.id !== "r_etc").reduce((s, r) => s + r.value, 0);
    const bondA = dataA.data.revenue.find((r) => r.id === "r_bnd")?.value || 0;
    const bondB = dataB.data.revenue.find((r) => r.id === "r_bnd")?.value || 0;
    const bondDepA = dataA.data.total ? (bondA / dataA.data.total * 100).toFixed(1) : "—";
    const bondDepB = dataB.data.total ? (bondB / dataB.data.total * 100).toFixed(1) : "—";
    return [
      { label: "歳出総額の増減", value: sign(totalDiff), sub: signPct(totalDiff, dataA.data.total), accent: "#e2e8f0" },
      { label: "税収の増減", value: sign(taxB - taxA), sub: `${fmt(taxB)}`, accent: "#60a5fa" },
      { label: "国債発行の増減", value: sign(bondB - bondA), sub: signPct(bondB - bondA, bondA), accent: "#f472b6" },
      { label: "公債依存度", value: `${bondDepB}%`, sub: `${bondDepA}% → ${bondDepB}%`, accent: "#22c55e" },
    ];
  }, [dataA.data, dataB.data]);

  const selectStyle = {
    background: "#131620",
    border: "1px solid #334155",
    borderRadius: 6,
    color: "#e2e8f0",
    padding: "4px 8px",
    fontSize: 12,
  };

  const handleDrill = (id) => {
    if (drill) return; // no nested drill
    if (drillableIds.has(id)) setDrill(id);
  };

  if (loading) {
    return <div style={{ textAlign: "center", color: "#64748b", padding: 40 }}>データ読み込み中…</div>;
  }
  if (error) {
    return <div style={{ textAlign: "center", color: "#ef4444", padding: 40 }}>データの読み込みに失敗しました</div>;
  }

  return (
    <div>
      {/* Year selectors */}
      <div style={{
        display: "flex", justifyContent: "center", alignItems: "center",
        gap: 12, marginBottom: 10, flexWrap: "wrap",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 11, color: "#64748b" }}>比較元</span>
          <select value={yearKeyA} onChange={(e) => handleYearA(e.target.value)} style={selectStyle}>
            {YEARS.map((y) => <option key={y.key} value={y.key}>{y.label}</option>)}
          </select>
        </div>
        <span style={{ color: "#475569", fontSize: 16 }}>→</span>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 11, color: "#64748b" }}>比較先</span>
          <select value={yearKeyB} onChange={(e) => handleYearB(e.target.value)} style={selectStyle}>
            {YEARS.map((y) => <option key={y.key} value={y.key}>{y.label}</option>)}
          </select>
        </div>
      </div>

      {/* Same year warning */}
      {yearKeyA === yearKeyB && (
        <div style={{ textAlign: "center", fontSize: 12, color: "#f59e0b", marginBottom: 8 }}>
          同じ年度が選択されています
        </div>
      )}

      {/* Scale warning */}
      {!drill && scaleTotal > 0 && (() => {
        const min = Math.min(
          viewA ? Math.max(viewA.left.reduce((s, i) => s + i.value, 0), viewA.right.reduce((s, i) => s + i.value, 0)) : 0,
          viewB ? Math.max(viewB.left.reduce((s, i) => s + i.value, 0), viewB.right.reduce((s, i) => s + i.value, 0)) : 0,
        );
        return min > 0 && scaleTotal / min > 2;
      })() && (
        <div style={{ textAlign: "center", fontSize: 10, color: "#64748b", marginBottom: 6 }}>
          ※ スケールが大きく異なるため、小さい方のサンキーは余白が多くなります
        </div>
      )}

      {/* Breadcrumb for drill */}
      {drill && (
        <div style={{ marginBottom: 8, display: "flex", alignItems: "center", gap: 8 }}>
          <button
            onClick={() => setDrill(null)}
            style={{
              background: "#1e293b", border: "1px solid #334155", borderRadius: 6,
              color: "#94a3b8", padding: "4px 12px", fontSize: 12, cursor: "pointer",
            }}
          >
            ← 全体
          </button>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#e2e8f0" }}>
            {drillLabel}
          </span>
          <span style={{ fontSize: 11, color: "#64748b" }}>の内訳を比較</span>
        </div>
      )}

      {/* Side-by-side Sankeys */}
      <div
        style={{
          display: "flex",
          flexDirection: isNarrow ? "column" : "row",
          gap: isNarrow ? 12 : 8,
        }}
        onMouseLeave={() => setHover(null)}
      >
        {viewA && (
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ textAlign: "center", marginBottom: 4 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#e2e8f0" }}>{labelA}</div>
              <div style={{ fontSize: 11, color: "#64748b" }}>
                {drill ? `${drillLabel} ${fmt(viewA.left[0]?.value || 0)}` : `歳出 ${fmt(dataA.data.total)}`}
              </div>
            </div>
            <SankeyView
              leftItems={viewA.left}
              rightItems={viewA.right}
              w={sankeyW}
              h={h}
              hover={hover}
              setHover={setHover}
              drillableIds={drill ? drillChildIds : drillableIds}
              onDrill={handleDrill}
              scaleTotal={scaleTotal}
              gradientPrefix="L_"
            />
          </div>
        )}
        {viewB && (
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ textAlign: "center", marginBottom: 4 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#e2e8f0" }}>{labelB}</div>
              <div style={{ fontSize: 11, color: "#64748b" }}>
                {drill ? `${drillLabel} ${fmt(viewB.left[0]?.value || 0)}` : `歳出 ${fmt(dataB.data.total)}`}
              </div>
            </div>
            <SankeyView
              leftItems={viewB.left}
              rightItems={viewB.right}
              w={sankeyW}
              h={h}
              hover={hover}
              setHover={setHover}
              drillableIds={drill ? drillChildIds : drillableIds}
              onDrill={handleDrill}
              scaleTotal={scaleTotal}
              gradientPrefix="R_"
            />
          </div>
        )}
      </div>

      {/* Key numbers (top level only) */}
      {!drill && keyNumbers && (
        <div style={{
          display: "grid",
          gridTemplateColumns: `repeat(auto-fit, minmax(${isNarrow ? "130px" : "140px"}, 1fr))`,
          gap: 6, marginTop: 12,
        }}>
          {keyNumbers.map((c) => (
            <div key={c.label} style={{
              background: "#131620", border: "1px solid #1e293b", borderRadius: 8,
              padding: "8px 10px",
            }}>
              <div style={{ fontSize: 9, color: "#64748b" }}>{c.label}</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: c.accent }}>{c.value}</div>
              <div style={{ fontSize: 9, color: "#475569" }}>{c.sub}</div>
            </div>
          ))}
        </div>
      )}

      {/* Diff chart */}
      {diffOldData && diffNewData && yearKeyA !== yearKeyB && (
        <div style={{
          marginTop: 12, padding: "12px 14px",
          background: "#131620", border: "1px solid #1e293b", borderRadius: 8,
        }}>
          <DiffChart oldData={diffOldData} newData={diffNewData} hover={hover} setHover={setHover} />
        </div>
      )}

      <div style={{ marginTop: 8, textAlign: "center", fontSize: 10, color: "#475569" }}>
        {drill
          ? "「← 全体」で全体比較に戻ります"
          : <>
              <span className="hint-hover">項目をクリックで内訳を比較、ホバーで左右が連動します</span>
              <span className="hint-touch" style={{ display: "none" }}>ダブルタップで内訳を比較、タップで左右が連動します</span>
            </>}
      </div>
    </div>
  );
}
