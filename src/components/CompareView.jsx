import { useState, useEffect, useMemo } from "react";
import { YEARS } from "../constants";
import useBudgetData from "../hooks/useBudgetData";
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
  const [dims, setDims] = useState({ w: 960, h: 380 });

  useEffect(() => {
    const update = () => setDims({
      w: Math.min(960, window.innerWidth - 24),
      h: Math.max(280, Math.min(400, window.innerHeight - 480)),
    });
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const dataA = useBudgetData(yearKeyA);
  const dataB = useBudgetData(yearKeyB);
  const loading = dataA.loading || dataB.loading;
  const error = dataA.error || dataB.error;

  const isNarrow = dims.w < 700;
  const sankeyW = isNarrow ? dims.w : Math.floor((dims.w - 16) / 2);

  // Revenue/expenditure sums for scale
  const scaleA = useMemo(() => {
    if (!dataA.data) return 0;
    return Math.max(
      dataA.data.revenue.reduce((s, i) => s + i.value, 0),
      dataA.data.expenditure.reduce((s, i) => s + i.value, 0),
    );
  }, [dataA.data]);
  const scaleB = useMemo(() => {
    if (!dataB.data) return 0;
    return Math.max(
      dataB.data.revenue.reduce((s, i) => s + i.value, 0),
      dataB.data.expenditure.reduce((s, i) => s + i.value, 0),
    );
  }, [dataB.data]);
  const scaleTotal = Math.max(scaleA, scaleB);

  const labelA = YEARS.find((y) => y.key === yearKeyA)?.label || yearKeyA;
  const labelB = YEARS.find((y) => y.key === yearKeyB)?.label || yearKeyB;

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
          <select value={yearKeyA} onChange={(e) => setYearKeyA(e.target.value)} style={selectStyle}>
            {YEARS.map((y) => <option key={y.key} value={y.key}>{y.label}</option>)}
          </select>
        </div>
        <span style={{ color: "#475569", fontSize: 16 }}>→</span>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 11, color: "#64748b" }}>比較先</span>
          <select value={yearKeyB} onChange={(e) => setYearKeyB(e.target.value)} style={selectStyle}>
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
      {scaleA && scaleB && Math.max(scaleA, scaleB) / Math.min(scaleA, scaleB) > 2 && (
        <div style={{ textAlign: "center", fontSize: 10, color: "#64748b", marginBottom: 6 }}>
          ※ スケールが大きく異なるため、小さい方のサンキーは余白が多くなります
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
        {dataA.data && (
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ textAlign: "center", marginBottom: 4 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#e2e8f0" }}>{labelA}</div>
              <div style={{ fontSize: 11, color: "#64748b" }}>歳出 {fmt(dataA.data.total)}</div>
            </div>
            <SankeyView
              leftItems={dataA.data.revenue}
              rightItems={dataA.data.expenditure}
              w={sankeyW}
              h={dims.h}
              hover={hover}
              setHover={setHover}
              drillableIds={new Set()}
              onDrill={() => {}}
              scaleTotal={scaleTotal}
              gradientPrefix="L_"
            />
          </div>
        )}
        {dataB.data && (
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ textAlign: "center", marginBottom: 4 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#e2e8f0" }}>{labelB}</div>
              <div style={{ fontSize: 11, color: "#64748b" }}>歳出 {fmt(dataB.data.total)}</div>
            </div>
            <SankeyView
              leftItems={dataB.data.revenue}
              rightItems={dataB.data.expenditure}
              w={sankeyW}
              h={dims.h}
              hover={hover}
              setHover={setHover}
              drillableIds={new Set()}
              onDrill={() => {}}
              scaleTotal={scaleTotal}
              gradientPrefix="R_"
            />
          </div>
        )}
      </div>

      {/* Key numbers */}
      {keyNumbers && (
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
      {dataA.data && dataB.data && yearKeyA !== yearKeyB && (
        <div style={{
          marginTop: 12, padding: "12px 14px",
          background: "#131620", border: "1px solid #1e293b", borderRadius: 8,
        }}>
          <DiffChart oldData={dataA.data} newData={dataB.data} hover={hover} setHover={setHover} />
        </div>
      )}

      <div style={{ marginTop: 8, textAlign: "center", fontSize: 10, color: "#475569" }}>
        項目をホバーすると左右のサンキーが同時にハイライトされます
      </div>
    </div>
  );
}
