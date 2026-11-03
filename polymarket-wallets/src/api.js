// Thin client for Polymarket's public Data API (no auth needed).
import { sleep, num } from './util.js';

const BASE = () => (process.env.PM_DATA_API || 'https://data-api.polymarket.com').replace(/\/$/, '');
let requestCount = 0;
export const stats = () => ({ requests: requestCount });

export async function get(path, params = {}, { retries = 6 } = {}) {
  const url = new URL(/^https?:/.test(path) ? path : BASE() + path);
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null) continue;
    if (Array.isArray(v)) v.forEach((x) => url.searchParams.append(k, String(x)));
    else url.searchParams.set(k, String(v));
  }
  let attempt = 0;
  for (;;) {
    requestCount++;
    let res;
    try {
      res = await fetch(url, { headers: { accept: 'application/json', 'user-agent': 'polymarket-wallets/1.0' } });
    } catch (err) {
      if (attempt++ >= retries) throw new Error(`GET ${url} failed: ${err.message}`);
      await sleep(500 * 2 ** attempt);
      continue;
    }
    if (res.status === 429 || res.status >= 500) {
      if (attempt++ >= retries) throw new Error(`GET ${url} -> HTTP ${res.status}`);
      const ra = num(res.headers.get('retry-after'));
      await sleep(ra ? ra * 1000 : 500 * 2 ** attempt);
      continue;
    }
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`GET ${url} -> HTTP ${res.status} ${body.slice(0, 200)}`);
    }
    return res.json();
  }
}

// ---- Data API v2 (v1 was retired: HTTP 410). Pages are cursor-only; fields are snake_case. ----

const camelKey = (k) => k.replace(/_([a-z0-9])/g, (_, c) => c.toUpperCase());
/** Recursively convert snake_case keys to the camelCase names the rest of the code uses. */
export function camelize(o) {
  if (Array.isArray(o)) return o.map(camelize);
  if (o && typeof o === 'object') { const r = {}; for (const [k, v] of Object.entries(o)) r[camelKey(k)] = camelize(v); return r; }
  return o;
}
const tsSec = (t) => { let x = num(t); if (!x && typeof t === 'string') x = Math.floor(Date.parse(t) / 1000) || 0; return x > 1e12 ? Math.floor(x / 1000) : x; };

/** One v2 page: items (camelCased) and the cursor for the next page, if any. */
export function pageOf(j) {
  const items = Array.isArray(j) ? j : Array.isArray(j?.data) ? j.data : [];
  const p = j?.pagination || {};
  return { items: camelize(items), next: p.has_more === false ? null : (p.next_cursor || null) };
}

/** Follow next_cursor pages (the original params must be repeated alongside the cursor). */
export async function* pages(path, params, { maxPages = 100 } = {}) {
  let cursor = null;
  for (let i = 0; i < maxPages; i++) {
    const { items, next } = pageOf(await get(path, cursor ? { ...params, cursor } : params));
    yield items;
    if (!next || !items.length) break;
    cursor = next;
  }
}

// v1-compatible shapes for the rest of the code.
export const normActivity = (e) => ({ ...e, asset: String(e.asset ?? e.tokenId ?? ''), timestamp: tsSec(e.timestamp) });
export const normPosition = (p) => ({
  ...p,
  asset: String(p.asset ?? p.tokenId ?? ''),
  size: num(p.size ?? p.currentSize),
  curPrice: num(p.curPrice ?? p.currentPrice),
  currentValue: num(p.currentValue),
  cashPnl: num(p.cashPnl ?? p.unrealizedPnl),
  initialValue: num(p.initialValue ?? p.totalCostUsdc),
  totalBought: num(p.totalBought ?? p.totalSize),
  realizedPnl: num(p.realizedPnl),
  timestamp: tsSec(p.timestamp ?? p.lastEventAt),
});
export const normLeader = (r) => ({ ...r, proxyWallet: r.proxyWallet ?? r.userId, vol: num(r.vol ?? r.volume), pnl: num(r.pnl), verifiedBadge: r.verifiedBadge ?? r.verified });

/** Official leaderboard. timePeriod: DAY|WEEK|MONTH|ALL, orderBy: PNL|VOL. */
export async function leaderboard({ timePeriod, orderBy, total = 100, category = 'OVERALL' }) {
  const out = [];
  // v2 accepts PNL or VOLUME (v1's 'VOL' is rejected with HTTP 400).
  const params = { timePeriod, orderBy: orderBy === 'VOL' ? 'VOLUME' : orderBy, limit: 50, category: category === 'OVERALL' ? undefined : category };
  for await (const items of pages('/v2/leaderboard', params, { maxPages: Math.ceil(total / 50) })) {
    out.push(...items.map(normLeader));
    if (out.length >= total) break;
  }
  return out.slice(0, total);
}

const eventKey = (e) => `${e.transactionHash}|${e.asset}|${e.type}|${e.side}|${e.size}|${e.timestamp}`;

/** All on-chain activity (TRADE, REDEEM, SPLIT, MERGE, REWARD, CONVERSION) in [start, end], newest first. */
export async function activity(user, start, end, { maxEvents = 25000, pageSize = 500 } = {}) {
  const seen = new Map();
  const params = { user, start, end, limit: pageSize, sortBy: 'TIMESTAMP', sortDirection: 'DESC' };
  for await (const items of pages('/v2/activity', params, { maxPages: Math.ceil(maxEvents / pageSize) + 1 })) {
    for (const raw of items) { const e = normActivity(raw); const k = eventKey(e); if (!seen.has(k)) seen.set(k, e); }
    if (seen.size >= maxEvents) break;
    if (items.length && Math.min(...items.map((x) => tsSec(x.timestamp))) < start) break;
  }
  return [...seen.values()].filter((e) => e.timestamp >= start && e.timestamp <= end);
}

/** Closed positions, newest first, until older than `start`. */
export async function closedPositions(user, start, { maxPages = 120 } = {}) {
  const out = [];
  const params = { user, status: 'CLOSED', limit: 200, sortBy: 'TIMESTAMP', sortDirection: 'DESC' };
  for await (const items of pages('/v2/positions', params, { maxPages })) {
    const page = items.map(normPosition);
    out.push(...page);
    if (page.length && Math.min(...page.map((x) => x.timestamp)) < start) break;
  }
  return out;
}

/** Current open positions. */
export async function positions(user, { maxPages = 10 } = {}) {
  const out = [];
  for await (const items of pages('/v2/positions', { user, limit: 500 }, { maxPages })) out.push(...items.map(normPosition));
  return out.filter((p) => p.size >= 1);
}

export async function portfolioValue(user) {
  const j = await get('/v2/value', { user });
  const row = Array.isArray(j) ? j[0] : j?.data ?? j;
  return num(Array.isArray(row) ? row[0]?.value : row?.value);
}

// The old user-pnl-api.polymarket.com host was retired (HTTP 410) in favour of data-api /v2/user-pnl.
const PNL_URL = () => (process.env.PM_PNL_URL || `${BASE()}/v2/user-pnl`);

/** Polymarket's own cumulative-PnL history for a wallet (what the profile chart shows): [{t, p}]. */
const PNL_VARIANTS = [
  { interval: 'all', fidelity: '1d' }, // full daily history; a bare request returns only the last day
  { interval: 'all' },
  { interval: 'max' },
  {},
];
export const pnlDiag = { ok: 0, empty: 0, failed: 0, variant: null, samples: [] };
let pnlVariant = null; // first variant that returned data is reused for every wallet

async function rawGet(url) {
  try {
    const res = await fetch(url, { headers: { accept: 'application/json', 'user-agent': 'polymarket-wallets/1.0' } });
    const text = await res.text();
    let json = null; try { json = JSON.parse(text); } catch {}
    return { status: res.status, text, json };
  } catch (err) { return { status: 0, text: err.message, json: null }; }
}
const seriesOf = (j) => {
  for (const c of [j, j?.data?.points, j?.data?.history, j?.points, j?.history, j?.data, j?.pnl, j?.series]) if (Array.isArray(c)) return c;
  return [];
};

// economic_pnl is the all-in cumulative PnL after fees (the probe showed realized_market_pnl, the first
// 'pnl' field, is realised-only), so it is preferred.
const PNL_KEYS = ['p', 'pnl', 'economic_pnl', 'economicPnl', 'position_pnl', 'positionPnl', 'value', 'cumulativePnl', 'cumulative_pnl', 'totalPnl', 'total_pnl', 'cashPnl', 'cash_pnl', 'profit'];
/** One history point -> {t (seconds), p}, whatever the API calls its fields. */
export function normPoint(x) {
  if (!x || typeof x !== 'object') return null;
  let t = num(x.t ?? x.timestamp ?? x.time ?? x.ts);
  if (t > 1e12) t = Math.floor(t / 1000);
  const isNum = (v) => v !== null && v !== '' && typeof v !== 'boolean' && Number.isFinite(Number(v));
  let key = PNL_KEYS.find((k) => isNum(x[k]));
  if (!key) key = Object.keys(x).find((k) => /pnl/i.test(k) && isNum(x[k]));
  if (!key) key = Object.keys(x).find((k) => !/^(t|timestamp|time|ts)$/i.test(k) && isNum(x[k]));
  if (!t || !key) return null;
  return { t, p: Number(x[key]) };
}

export async function pnlSeries(user) {
  const variants = pnlVariant ? [pnlVariant] : PNL_VARIANTS;
  for (const v of variants) {
    const url = new URL(PNL_URL());
    url.searchParams.set('user', user);
    for (const [k, x] of Object.entries(v)) url.searchParams.set(k, x);
    let r = await rawGet(url);
    for (let i = 0; i < 3 && (r.status === 429 || r.status >= 500 || r.status === 0); i++) { await sleep(1000 * 2 ** i); r = await rawGet(url); }
    requestCount++;
    const arr = seriesOf(r.json).map(normPoint).filter(Boolean);
    if (!pnlDiag.pointKeys && seriesOf(r.json)[0]) pnlDiag.pointKeys = Object.keys(seriesOf(r.json)[0]).join(', ');
    if (pnlDiag.samples.length < 6) pnlDiag.samples.push(`${new URLSearchParams(v) || '(user only)'} -> HTTP ${r.status}, ${arr.length} points, body: ${r.text.slice(0, 160).replace(/\s+/g, ' ')}`);
    if (r.status === 200 && arr.length >= 2) { pnlVariant = v; pnlDiag.variant = v; pnlDiag.ok++; return arr; }
  }
  if (pnlVariant) pnlDiag.empty++; else pnlDiag.failed++;
  return [];
}

const CLOB = () => (process.env.PM_CLOB_API || 'https://clob.polymarket.com').replace(/\/$/, '');
const GAMMA = () => (process.env.PM_GAMMA_API || 'https://gamma-api.polymarket.com').replace(/\/$/, '');

/** Price history for one outcome token: sorted [{t, p}]. Long spans are fetched in chunks. */
export async function priceHistory(asset, startTs, endTs, { fidelity = 30, chunkDays = 14 } = {}) {
  const out = [];
  for (let a = startTs; a < endTs; a += chunkDays * 86400) {
    const b = Math.min(endTs, a + chunkDays * 86400);
    let j;
    try { j = await get(`${CLOB()}/prices-history`, { market: asset, startTs: a, endTs: b, fidelity }, { retries: 3 }); }
    catch { continue; }
    const h = Array.isArray(j?.history) ? j.history : Array.isArray(j) ? j : [];
    for (const x of h) out.push({ t: num(x.t), p: num(x.p) });
  }
  out.sort((x, y) => x.t - y.t);
  return out.filter((x, i) => i === 0 || x.t !== out[i - 1].t);
}

/** Market metadata (outcomes, token ids, resolution prices) by condition id. */
export async function marketsByCondition(ids) {
  const out = [];
  for (const closed of [true, false]) {
    try {
      const j = await get(`${GAMMA()}/markets`, { condition_ids: ids, closed, limit: ids.length + 5 }, { retries: 3 });
      if (Array.isArray(j)) out.push(...j);
    } catch { /* fall back to position data */ }
  }
  return out;
}

/** Live order book for one outcome token: asks/bids sorted best-first, as numbers. */
export async function book(tokenId) {
  const j = await get(`${CLOB()}/book`, { token_id: tokenId }, { retries: 3 });
  const side = (xs) => (Array.isArray(xs) ? xs : []).map((x) => ({ price: num(x.price), size: num(x.size) })).filter((x) => x.price > 0 && x.size > 0);
  return {
    asks: side(j?.asks).sort((a, b) => a.price - b.price),
    bids: side(j?.bids).sort((a, b) => b.price - a.price),
  };
}

export async function midpoint(tokenId) {
  const j = await get(`${CLOB()}/midpoint`, { token_id: tokenId }, { retries: 2 });
  return num(j?.mid) || null;
}

/** Recent trades for one wallet after `since` (exclusive), newest first. */
export async function recentTrades(user, since, { limit = 100 } = {}) {
  const j = await get('/v2/activity', { user, type: 'TRADE', start: since + 1, limit, sortBy: 'TIMESTAMP', sortDirection: 'DESC' }, { retries: 3 });
  return pageOf(j).items.map(normActivity);
}
