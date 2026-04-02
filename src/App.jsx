import { useState } from "react";
import useBudgetData from "./hooks/useBudgetData";
import { fmt } from "./lib/format";
import FuncView from "./components/FuncView";
import MinistryView from "./components/MinistryView";

const TABS = [
  { key: "func", label: "歳入→歳出（使途別）" },
  { key: "ministry", label: "歳出（省庁別）" },
];

export default function App() {
  const [tab, setTab] = useState("func");
  const [displayMode, setDisplayMode] = useState("yen");
  const { data, loading, error } = useBudgetData("fy2025");

  if (loading) {
    return (
      <div
        style={{
          background: "#08090d",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#64748b",
          fontSize: 14,
        }}
      >
        データを読み込み中...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div
        style={{
          background: "#08090d",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#ef4444",
          fontSize: 14,
        }}
      >
        データの読み込みに失敗しました: {error}
      </div>
    );
  }

  const w = Math.min(960, typeof window !== "undefined" ? window.innerWidth - 24 : 960);

  return (
    <div
      style={{
        background: "#08090d",
        minHeight: "100vh",
        padding: "14px 14px 24px",
        boxSizing: "border-box",
      }}
    >
      <div style={{ maxWidth: 980, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: 5 }}>
          <div
            style={{
              fontSize: 10,
              letterSpacing: 3,
              color: "#64748b",
              textTransform: "uppercase",
            }}
          >
            Japan Budget Explorer
          </div>
          <h1
            style={{
              fontSize: Math.min(24, w * 0.03),
              fontWeight: 800,
              margin: "1px 0",
              background: "linear-gradient(135deg,#e2e8f0,#94a3b8)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            令和7年度 一般会計予算
          </h1>
          <div style={{ fontSize: 12, color: "#64748b" }}>
            歳入歳出総額{" "}
            <span
              style={{ color: "#e2e8f0", fontWeight: 700, fontSize: 14 }}
            >
              {fmt(data.total)}
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div
          style={{
            display: "flex",
            gap: 0,
            marginBottom: 5,
            borderRadius: 8,
            overflow: "hidden",
            border: "1px solid #334155",
            width: "fit-content",
          }}
        >
          {TABS.map((t, i) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                background: tab === t.key ? "#334155" : "#0f1117",
                border: "none",
                color: tab === t.key ? "#e2e8f0" : "#64748b",
                padding: "6px 16px",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: tab === t.key ? 700 : 400,
                borderRight:
                  i === 0 ? "1px solid #334155" : "none",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Active View */}
        {tab === "func" ? (
          <FuncView data={data} displayMode={displayMode} setDisplayMode={setDisplayMode} />
        ) : (
          <MinistryView data={data} displayMode={displayMode} setDisplayMode={setDisplayMode} />
        )}

        {/* Footer */}
        <div
          style={{
            marginTop: 8,
            fontSize: 8,
            color: "#2d3748",
            lineHeight: 1.7,
            borderTop: "1px solid #1e293b",
            paddingTop: 6,
          }}
        >
          {data.source}
        </div>
      </div>
    </div>
  );
}
