/**
 * 4-quadrant context panel showing summary, yoy, trend, and debate.
 */
const ENTRIES = [
  { key: "summary", icon: "\ud83d\udcca", title: "概要" },
  { key: "yoy", icon: "\ud83d\udcc8", title: "昨年との比較" },
  { key: "trend", icon: "\ud83d\udd0d", title: "過去10年のトレンド" },
  { key: "debate", icon: "\ud83c\udfdb\ufe0f", title: "国会での主な論点" },
];

export default function ContextPanel({ ctx, itemLabel, itemColor }) {
  return (
    <div
      style={{
        marginTop: 10,
        background: "#131620",
        border: "1px solid #1e293b",
        borderRadius: 8,
        overflow: "hidden",
      }}
    >
      {itemLabel && (
        <div
          style={{
            padding: "8px 14px",
            borderBottom: "1px solid #1e293b",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: 2,
              background: itemColor || "#94a3b8",
            }}
          />
          <span style={{ fontSize: 14, fontWeight: 700, color: "#e2e8f0" }}>
            {itemLabel}
          </span>
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0 }}>
        {ENTRIES.map(({ key, icon, title }, i) => (
          <div
            key={key}
            style={{
              padding: "10px 14px",
              borderRight: i % 2 === 0 ? "1px solid #1e293b" : "none",
              borderBottom: i < 2 ? "1px solid #1e293b" : "none",
            }}
          >
            <div
              style={{
                fontSize: 11,
                color: "#64748b",
                marginBottom: 3,
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <span>{icon}</span> {title}
            </div>
            <div style={{ fontSize: 12.5, color: "#cbd5e1", lineHeight: 1.6 }}>
              {ctx?.[key] || "（データ準備中）"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
