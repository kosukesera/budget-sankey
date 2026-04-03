import { useMemo } from "react";
import { fmt } from "../lib/format";

const sign = (v) => (v >= 0 ? "+" : "−") + fmt(Math.abs(v));
const signPct = (v, base) => {
  if (!base) return "—";
  const r = (v / base) * 100;
  return (r >= 0 ? "+" : "−") + Math.abs(r).toFixed(1) + "%";
};

export default function DiffChart({ oldData, newData, hover, setHover }) {
  const items = useMemo(() => {
    if (!oldData || !newData) return [];
    return newData.expenditure.map((n) => {
      const o = oldData.expenditure.find((e) => e.id === n.id);
      const oldVal = o?.value || 0;
      const diff = n.value - oldVal;
      const diffPct = oldVal ? (diff / oldVal) * 100 : 0;
      return { ...n, diff, diffPct, oldVal };
    }).sort((a, b) => b.diffPct - a.diffPct);
  }, [oldData, newData]);

  const revItems = useMemo(() => {
    if (!oldData || !newData) return [];
    return newData.revenue.map((n) => {
      const o = oldData.revenue.find((e) => e.id === n.id);
      const oldVal = o?.value || 0;
      return { ...n, diff: n.value - oldVal, oldVal };
    }).filter((r) => Math.abs(r.diff) > 1000)
      .sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff));
  }, [oldData, newData]);

  const maxAbsDiff = useMemo(
    () => Math.max(...items.map((i) => Math.abs(i.diff)), 1),
    [items]
  );

  if (!items.length) return null;

  return (
    <div>
      <div style={{ fontSize: 12, fontWeight: 700, color: "#e2e8f0", marginBottom: 6 }}>
        歳出の増減
      </div>
      {items.map((item) => {
        const active = !hover || hover === item.id;
        const ratio = item.diff / maxAbsDiff;
        const bw = Math.abs(ratio) * 100;
        const isPos = item.diff >= 0;
        return (
          <div
            key={item.id}
            onMouseEnter={() => setHover(item.id)}
            onMouseLeave={() => setHover(null)}
            style={{
              display: "flex", alignItems: "center", gap: 8, padding: "3px 0",
              opacity: active ? 1 : 0.3, transition: "opacity .3s", cursor: "default",
            }}
          >
            <div style={{ width: 120, fontSize: 11, color: "#94a3b8", textAlign: "right", flexShrink: 0 }}>
              {item.label}
            </div>
            <div style={{ width: 200, position: "relative", height: 16, flexShrink: 0 }}>
              <div style={{
                position: "absolute",
                left: isPos ? "50%" : `calc(50% - ${bw}px)`,
                width: bw,
                height: "100%",
                background: isPos ? item.color : "#475569",
                borderRadius: 3, opacity: 0.7,
              }} />
              <div style={{ position: "absolute", left: "50%", top: 0, width: 1, height: "100%", background: "#334155" }} />
            </div>
            <div style={{ fontSize: 11, fontWeight: 600, color: isPos ? item.color : "#94a3b8", minWidth: 80 }}>
              {sign(item.diff)}
            </div>
            <div style={{ fontSize: 10, color: "#64748b", minWidth: 50 }}>
              {signPct(item.diff, item.oldVal)}
            </div>
          </div>
        );
      })}

      {revItems.length > 0 && (
        <div style={{ marginTop: 10, borderTop: "1px solid #1e293b", paddingTop: 8 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#e2e8f0", marginBottom: 4 }}>
            歳入の注目ポイント
          </div>
          {revItems.map((item) => {
            const active = !hover || hover === item.id;
            const isPos = item.diff >= 0;
            return (
              <div
                key={item.id}
                onMouseEnter={() => setHover(item.id)}
                onMouseLeave={() => setHover(null)}
                style={{
                  display: "flex", alignItems: "center", gap: 8, padding: "3px 0",
                  opacity: active ? 1 : 0.3, transition: "opacity .3s",
                }}
              >
                <div style={{ width: 120, fontSize: 11, color: "#94a3b8", textAlign: "right" }}>
                  {item.label}
                </div>
                <div style={{ fontSize: 11, fontWeight: 600, color: isPos ? "#22c55e" : "#ef4444" }}>
                  {sign(item.diff)}（{signPct(item.diff, item.oldVal)}）
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
