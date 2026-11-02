export const DAY = 86400;
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export const num = (v) => (v == null || v === '' || Number.isNaN(Number(v)) ? 0 : Number(v));
export const sum = (xs, f = (x) => x) => xs.reduce((a, x) => a + num(f(x)), 0);
export const dateKey = (ts) => new Date(ts * 1000).toISOString().slice(0, 10);

export function median(xs) {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

/** Percentile rank (0..1) of each value within the array. */
export function percentileRanks(values) {
  const n = values.length;
  if (n <= 1) return values.map(() => 0.5);
  const sorted = [...values].sort((a, b) => a - b);
  return values.map((v) => {
    let lo = 0, hi = n;
    while (lo < hi) { const m = (lo + hi) >> 1; if (sorted[m] < v) lo = m + 1; else hi = m; }
    let eq = lo; while (eq < n && sorted[eq] === v) eq++;
    return ((lo + eq - 1) / 2) / (n - 1);
  });
}

/** Run async fn over items with bounded concurrency. */
export async function pool(items, limit, fn) {
  const out = new Array(items.length);
  let i = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (i < items.length) { const idx = i++; out[idx] = await fn(items[idx], idx); }
  });
  await Promise.all(workers);
  return out;
}
