/**
 * Format a value in 億円 to a human-readable string.
 * Values >= 10000 are shown in 兆円, otherwise in 億円.
 */
export const fmt = (v) =>
  v >= 10000 ? `${(v / 10000).toFixed(1)}兆円` : `${v.toLocaleString()}億円`;

/**
 * Calculate percentage string.
 */
export const pct = (v, t) => `${((v / t) * 100).toFixed(1)}%`;
