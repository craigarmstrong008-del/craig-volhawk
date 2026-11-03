// Quick end-to-end check of every Data API call against the live API, for one wallet.
// Usage: node src/smoke.js [walletAddress]
import * as api from './api.js';

const user = process.argv[2];
const now = Math.floor(Date.now() / 1000);
const pick = (o, keys) => (o ? Object.fromEntries(keys.map((k) => [k, typeof o[k] === 'string' && o[k].length > 14 ? `${o[k].slice(0, 10)}…` : o[k]])) : null);

async function step(name, fn, show) {
  try {
    const r = await fn();
    console.log(`SMOKE ok   ${name}: ${show(r)}`);
    return r;
  } catch (e) {
    console.log(`SMOKE FAIL ${name}: ${String(e.message).slice(0, 300)}`);
    process.exitCode = 1;
    return null;
  }
}

const lb = await step('leaderboard MONTH/PNL x120 (3 cursor pages)', () => api.leaderboard({ timePeriod: 'MONTH', orderBy: 'PNL', total: 120 }),
  (r) => `${r.length} rows (${new Set(r.map((x) => x.proxyWallet)).size} unique), #1 ${JSON.stringify(pick(r[0], ['userName', 'proxyWallet', 'pnl', 'vol']))}`);
const w = user || lb?.[0]?.proxyWallet;
await step('activity last 3 days (cursor pages)', () => api.activity(w, now - 3 * 86400, now, { maxEvents: 3000 }),
  (r) => `${r.length} events, types ${[...new Set(r.map((e) => e.type))].join('/')}, trade ${JSON.stringify(pick(r.find((e) => e.type === 'TRADE'), ['asset', 'conditionId', 'side', 'price', 'usdcSize', 'timestamp', 'eventSlug', 'outcome']))}`);
await step('recentTrades (agent poll)', () => api.recentTrades(w, now - 6 * 3600, { limit: 50 }),
  (r) => `${r.length} trades, newest ${JSON.stringify(pick(r[0], ['asset', 'side', 'price', 'usdcSize', 'timestamp']))}`);
await step('closedPositions last 30 days', () => api.closedPositions(w, now - 30 * 86400, { maxPages: 5 }),
  (r) => `${r.length} closed, ${JSON.stringify(pick(r[0], ['asset', 'realizedPnl', 'timestamp', 'totalBought', 'avgPrice', 'curPrice', 'eventSlug']))}`);
await step('positions (open)', () => api.positions(w),
  (r) => `${r.length} open, ${JSON.stringify(pick(r[0], ['asset', 'size', 'avgPrice', 'curPrice', 'currentValue', 'cashPnl', 'redeemable', 'endDate']))}`);
await step('portfolioValue', () => api.portfolioValue(w), (r) => `$${Math.round(r)}`);
await step('pnlSeries (economic_pnl)', () => api.pnlSeries(w), (r) => `${r.length} points, last ${JSON.stringify(r.at(-1))}`);
