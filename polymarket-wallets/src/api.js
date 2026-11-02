// Thin client for Polymarket's public Data API (no auth needed).
import { sleep, num } from './util.js';

const BASE = () => (process.env.PM_DATA_API || 'https://data-api.polymarket.com').replace(/\/$/, '');
let requestCount = 0;
export const stats = () => ({ requests: requestCount });

export async function get(path, params = {}, { retries = 6 } = {}) {
  const url = new URL(BASE() + path);
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
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
      // Paging past the API's offset ceiling returns 400 — treat as "no more data".
      if (res.status === 400 && /offset|limit/i.test(body)) return [];
      throw new Error(`GET ${url} -> HTTP ${res.status} ${body.slice(0, 200)}`);
    }
    return res.json();
  }
}

const asArray = (j) => (Array.isArray(j) ? j : Array.isArray(j?.data) ? j.data : []);

/** Official leaderboard. timePeriod: DAY|WEEK|MONTH|ALL, orderBy: PNL|VOL. 50 per page. */
export async function leaderboard({ timePeriod, orderBy, total = 100, category = 'OVERALL' }) {
  const out = [];
  for (let offset = 0; offset < total; offset += 50) {
    const page = asArray(await get('/v1/leaderboard', {
      timePeriod, orderBy, limit: 50, offset, category: category === 'OVERALL' ? undefined : category,
    }));
    out.push(...page);
    if (page.length < 50) break;
  }
  return out.slice(0, total);
}

const eventKey = (e) => `${e.transactionHash}|${e.asset}|${e.type}|${e.side}|${e.size}|${e.timestamp}`;

/**
 * All on-chain activity (TRADE, REDEEM, SPLIT, MERGE, REWARD, CONVERSION) in [start, end].
 * Walks backwards with a moving `end` cursor so the API offset ceiling never truncates busy wallets.
 */
export async function activity(user, start, end, { maxEvents = 25000, pageSize = 500 } = {}) {
  const seen = new Map();
  let cursor = end;
  let offset = 0;
  while (seen.size < maxEvents) {
    const page = asArray(await get('/activity', {
      user, start, end: cursor, limit: pageSize, offset, sortBy: 'TIMESTAMP', sortDirection: 'DESC',
    }));
    if (!page.length) break;
    let added = 0;
    for (const e of page) { const k = eventKey(e); if (!seen.has(k)) { seen.set(k, e); added++; } }
    if (page.length < pageSize) break;
    const minTs = Math.min(...page.map((e) => num(e.timestamp)));
    if (minTs <= start) break;
    if (minTs === cursor || added === 0) {
      // Whole page shares one timestamp: step through it with offset, then move on.
      offset += pageSize;
      if (offset > 3000) { cursor = minTs - 1; offset = 0; }
    } else {
      cursor = minTs; offset = 0; // inclusive; duplicates are removed by key
    }
  }
  return [...seen.values()].filter((e) => num(e.timestamp) >= start && num(e.timestamp) <= end);
}

/** Closed (resolved/exited) positions, newest first, until older than `start`. */
export async function closedPositions(user, start, { maxPages = 120 } = {}) {
  const out = [];
  for (let p = 0; p < maxPages; p++) {
    const page = asArray(await get('/closed-positions', {
      user, limit: 50, offset: p * 50, sortBy: 'TIMESTAMP', sortDirection: 'DESC',
    }));
    out.push(...page);
    if (page.length < 50) break;
    if (Math.min(...page.map((x) => num(x.timestamp))) < start) break;
  }
  return out;
}

/** Current open positions. */
export async function positions(user, { maxPages = 10 } = {}) {
  const out = [];
  for (let p = 0; p < maxPages; p++) {
    const page = asArray(await get('/positions', { user, limit: 500, offset: p * 500, sizeThreshold: 1 }));
    out.push(...page);
    if (page.length < 500) break;
  }
  return out;
}

export async function portfolioValue(user) {
  const j = await get('/value', { user });
  const row = Array.isArray(j) ? j[0] : j;
  return num(row?.value);
}
