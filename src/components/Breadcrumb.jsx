/**
 * Breadcrumb navigation for drill-down hierarchy.
 */
export default function Breadcrumb({ path, onNavigate }) {
  if (!path.length) return null;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 5,
        marginBottom: 4,
        fontSize: 12,
        flexWrap: "wrap",
      }}
    >
      <button
        onClick={() => onNavigate(-1)}
        style={{
          background: "#1e293b",
          border: "1px solid #334155",
          borderRadius: 5,
          color: "#60a5fa",
          padding: "2px 9px",
          cursor: "pointer",
          fontSize: 11,
        }}
      >
        ← 全体
      </button>
      {path.map((p, i) => (
        <span key={p.id} style={{ display: "flex", alignItems: "center", gap: 3 }}>
          <span style={{ color: "#334155" }}>›</span>
          {i < path.length - 1 ? (
            <button
              onClick={() => onNavigate(i)}
              style={{
                background: "none",
                border: "none",
                color: p.color || "#94a3b8",
                cursor: "pointer",
                fontWeight: 600,
                fontSize: 12,
                padding: 0,
              }}
            >
              {p.label}
            </button>
          ) : (
            <span style={{ color: p.color || "#94a3b8", fontWeight: 700 }}>
              {p.label}
            </span>
          )}
        </span>
      ))}
    </div>
  );
}
