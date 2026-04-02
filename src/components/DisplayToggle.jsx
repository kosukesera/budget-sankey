/**
 * Toggle switch between yen (¥) and percentage (%) display modes.
 */
export default function DisplayToggle({ displayMode, setDisplayMode }) {
  return (
    <div
      style={{
        display: "flex",
        gap: 0,
        borderRadius: 5,
        overflow: "hidden",
        border: "1px solid #334155",
      }}
    >
      {[
        { key: "yen", label: "¥" },
        { key: "pct", label: "%" },
      ].map((m, i) => (
        <button
          key={m.key}
          onClick={() => setDisplayMode(m.key)}
          style={{
            background: displayMode === m.key ? "#334155" : "#0f1117",
            border: "none",
            color: displayMode === m.key ? "#e2e8f0" : "#64748b",
            padding: "2px 8px",
            cursor: "pointer",
            fontSize: 11,
            fontWeight: displayMode === m.key ? 700 : 400,
            borderRight: i === 0 ? "1px solid #334155" : "none",
            lineHeight: "16px",
          }}
        >
          {m.label}
        </button>
      ))}
    </div>
  );
}
