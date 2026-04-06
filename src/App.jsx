import { useState } from "react";
import useBudgetData from "./hooks/useBudgetData";
import useHashPage from "./hooks/useHashPage";
import useDims from "./hooks/useDims";
import { fmt } from "./lib/format";
import FuncView from "./components/FuncView";
import MinistryView from "./components/MinistryView";
import CompareView from "./components/CompareView";
import { TABS, YEARS, PAGES } from "./constants";

export default function App() {
  const { page, setPage } = useHashPage();
  const [tab, setTab] = useState("func");
  const [displayMode, setDisplayMode] = useState("yen");
  const [yearKey, setYearKey] = useState("fy2025");
  const { data, loading, error } = useBudgetData(yearKey);
  const { w, isMobile } = useDims(() => 0);

  return (
    <div
      style={{
        background: "#08090d",
        minHeight: "100vh",
        padding: isMobile ? "10px 8px 20px" : "14px 14px 24px",
        boxSizing: "border-box",
      }}
    >
      <div style={{ maxWidth: 980, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: 5 }}>
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            flexWrap: "wrap", gap: 8,
          }}>
            <div
              style={{
                fontSize: isMobile ? 8 : 10,
                letterSpacing: isMobile ? 2 : 3,
                color: "#64748b",
                textTransform: "uppercase",
              }}
            >
              Japan Budget Explorer
            </div>

            {/* Page navigation */}
            <div style={{
              display: "flex",
              borderRadius: 6,
              overflow: "hidden",
              border: "1px solid #334155",
            }}>
              {PAGES.map((p, i) => (
                <button
                  key={p.key}
                  onClick={() => setPage(p.key)}
                  style={{
                    background: page === p.key ? "#1e40af" : "#0f1117",
                    border: "none",
                    color: page === p.key ? "#e2e8f0" : "#64748b",
                    padding: isMobile ? "4px 10px" : "4px 14px",
                    fontSize: isMobile ? 11 : 12,
                    fontWeight: page === p.key ? 700 : 400,
                    cursor: "pointer",
                    borderRight: i < PAGES.length - 1 ? "1px solid #334155" : "none",
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Explorer-specific header */}
          {page === "explorer" && (
            <>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
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
                  一般会計予算
                </h1>
                <select
                  value={yearKey}
                  onChange={(e) => setYearKey(e.target.value)}
                  style={{
                    background: "#1e293b",
                    border: "1px solid #475569",
                    borderRadius: 5,
                    color: "#e2e8f0",
                    fontSize: 13,
                    fontWeight: 600,
                    padding: "3px 8px",
                    cursor: "pointer",
                  }}
                >
                  {YEARS.map((y) => (
                    <option key={y.key} value={y.key}>
                      {y.label}
                    </option>
                  ))}
                </select>
              </div>
              {data && (
                <div style={{ fontSize: 12, color: "#64748b" }}>
                  歳入歳出総額{" "}
                  <span style={{ color: "#e2e8f0", fontWeight: 700, fontSize: 14 }}>
                    {fmt(data.total)}
                  </span>
                </div>
              )}
            </>
          )}

          {/* Compare-specific header */}
          {page === "compare" && (
            <h1
              style={{
                fontSize: Math.min(22, w * 0.028),
                fontWeight: 800,
                margin: "1px 0",
                background: "linear-gradient(135deg,#e2e8f0,#94a3b8)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              年度比較
            </h1>
          )}
        </div>

        {/* Explorer page */}
        {page === "explorer" && (
          <>
            {loading && (
              <div style={{ textAlign: "center", color: "#64748b", padding: 40 }}>
                データを読み込み中...
              </div>
            )}
            {error && (
              <div style={{ textAlign: "center", color: "#ef4444", padding: 40 }}>
                データの読み込みに失敗しました: {error}
              </div>
            )}
            {data && (
              <>
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
                        padding: isMobile ? "5px 12px" : "6px 16px",
                        cursor: "pointer",
                        fontSize: isMobile ? 12 : 13,
                        fontWeight: tab === t.key ? 700 : 400,
                        borderRight: i === 0 ? "1px solid #334155" : "none",
                      }}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                {/* Active View */}
                {tab === "func" ? (
                  <FuncView data={data} displayMode={displayMode} setDisplayMode={setDisplayMode} yearKey={yearKey} />
                ) : (
                  <MinistryView data={data} displayMode={displayMode} setDisplayMode={setDisplayMode} yearKey={yearKey} />
                )}
              </>
            )}
          </>
        )}

        {/* Compare page */}
        {page === "compare" && <CompareView />}

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
          {page === "explorer" && data ? data.source : "出典: 財務省「各年度予算のポイント」、衆議院調査室。"}
        </div>
      </div>
    </div>
  );
}
