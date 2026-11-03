// Walk-forward backtest of copy-trading rules. Pure functions only (no I/O) so they can be tested.
//
// The 90-day window is split: wallets are ranked on the first part ("train") and their trades are
// only followed in the second part ("test"), so no rule can see the future it is scored on.
import { DAY, num, median, dateKey } from './util.js';
import { categorize } from './categorize.js';

export const STRATEGIES = [
  { id: 'top20', name: 'Copy the top 20', desc: 'Copy every new buy of $500+ by the 20 wallets with the best first-half profit.', select: { top: 20, recentDays: 7 }, minUsd: 500 },
  { id: 'slow20', name: 'Copy the top 20 slow traders', desc: 'Same, but only wallets that averaged 20 trades a day or fewer, so their trades are realistic to copy.', select: { top: 20, maxTradesPerDay: 20, recentDays: 7 }, minUsd: 500 },
  { id: 'consensus', name: 'Consensus of 3+', desc: 'Buy when 3 of the top 50 wallets have bought the same outcome within 24 hours. Skips prices above 85¢ and takes one bet per game.', select: { top: 50, recentDays: 7 }, minUsd: 500, consensus: { k: 3, windowH: 24, cooldownDays: 7 }, maxEntry: 0.85, oneBetPerEvent: true },
  { id: 'consensus4', name: 'Consensus of 4+', desc: 'Stricter: 4 of the top 50 wallets on the same outcome within 24 hours. Skips prices above 85¢ and takes one bet per game.', select: { top: 50, recentDays: 7 }, minUsd: 500, consensus: { k: 4, windowH: 24, cooldownDays: 7 }, maxEntry: 0.85, oneBetPerEvent: true },
  { id: 'consensus-raw', name: 'Consensus of 3+ (no filters)', desc: 'The original consensus rule, without the 85¢ cap or one-bet-per-game, kept in the backtest for comparison.', select: { top: 50, recentDays: 7 }, minUsd: 500, consensus: { k: 3, windowH: 24, cooldownDays: 7 }, paper: false },
  { id: 'fade20', name: 'Fade the bottom 20', desc: 'Take the opposite side of buys of $1,000+ by the 20 wallets with the worst first-half profit. Backtest only: it reliably lost.', select: { bottom: 20, recentDays: 7 }, minUsd: 1000, fade: true, paper: false },
  { id: 'all', paper: false, name: 'Baseline: copy everyone', desc: 'A random sample of buys of $500+ by every wallet in the group. Each strategy should beat this to be worth anything.', select: { all: true }, minUsd: 500, sample: 3000 },
];

export const DELAYS = [
  { id: '0', label: 'Same price', seconds: 0 },
  { id: '1m', label: '1 min later', seconds: 60, fine: true },
  { id: '5m', label: '5 min later', seconds: 300, fine: true },
  { id: '30m', label: '30 min later', seconds: 1800 },
  { id: '2h', label: '2 hours later', seconds: 7200 },
  { id: '6h', label: '6 hours later', seconds: 21600 },
  { id: '24h', label: '24 hours later', seconds: 86400 },
];

const usd = (e) => num(e.usdcSize) || num(e.size) * num(e.price);
const isBuy = (e) => e.type === 'TRADE' && String(e.side).toUpperCase() === 'BUY';

/** Value of a cumulative series [{t,p}] at time ts (last point at or before ts). */
function seriesAt(pts, ts) {
  let v = null;
  for (const x of pts) { if (x.t <= ts) v = x.p; else break; }
  return v;
}
function normSeries(series) {
  if (!Array.isArray(series)) return [];
  return series
    .map((x) => { let t = num(x.t ?? x.timestamp); if (t > 1e12) t = Math.floor(t / 1000); return { t, p: num(x.p ?? x.pnl ?? x.value) }; })
    .filter((x) => x.t > 0).sort((a, b) => a.t - b.t);
}

/** Per-wallet stats computed only from the train period. */
export function trainStats(raw, split, start = raw.window.start) {
  const trainTrades = (raw.activity || []).filter((e) => e.type === 'TRADE' && num(e.timestamp) >= start && num(e.timestamp) < split);
  const days = Math.max(1, (split - start) / DAY);
  let trainPnl = null, source = 'none';
  const pts = normSeries(raw.pnl);
  if (pts.length >= 2 && pts[0].t <= start + DAY) {
    const a = seriesAt(pts, start), b = seriesAt(pts, split);
    if (a != null && b != null) { trainPnl = b - a; source = 'polymarket'; }
  }
  if (trainPnl == null) {
    const closed = (raw.closed || []).filter((p) => num(p.timestamp) >= start && num(p.timestamp) < split);
    if (closed.length) { trainPnl = closed.reduce((s, p) => s + num(p.realizedPnl), 0); source = 'positions'; }
  }
  const lastTradeTs = trainTrades.reduce((m, e) => Math.max(m, num(e.timestamp)), 0) || null;
  return {
    address: raw.profile?.address, name: raw.profile?.name || '',
    trainPnl, source, trainTrades: trainTrades.length, tradesPerDay: trainTrades.length / days,
    lastTradeTs, splitTs: split,
  };
}

/** Pick the wallets a strategy follows, using train-period stats only. */
export function selectWallets(stats, sel) {
  if (sel.all) return new Set(stats.map((s) => s.address));
  let pool = stats.filter((s) => s.trainPnl != null && s.trainTrades > 0);
  // Only wallets still trading: a last trade within `recentDays` of the ranking date.
  if (sel.recentDays) pool = pool.filter((s) => s.lastTradeTs == null || s.splitTs - s.lastTradeTs <= sel.recentDays * DAY);
  if (sel.maxTradesPerDay != null) pool = pool.filter((s) => s.tradesPerDay <= sel.maxTradesPerDay);
  if (sel.top) pool = pool.filter((s) => s.trainPnl > 0).sort((a, b) => b.trainPnl - a.trainPnl).slice(0, sel.top);
  if (sel.bottom) pool = pool.filter((s) => s.trainPnl < 0).sort((a, b) => a.trainPnl - b.trainPnl).slice(0, sel.bottom);
  return new Set(pool.map((s) => s.address));
}

/** Seeded PRNG so samples and bootstrap intervals are reproducible. */
export function rng(seed = 42) {
  let s = seed >>> 0;
  return () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

/**
 * Turn test-period buys into signals. `buys` = [{wallet, t, asset, conditionId, outcome, price, usd, title, slug}]
 * sorted by time. One signal per wallet+outcome per 24h, so a bot's hundreds of fills count as one bet.
 */
export function buildSignals(buys, strategy, wallets, { seed = 7 } = {}) {
  const mine = buys.filter((b) => wallets.has(b.wallet) && b.usd >= strategy.minUsd && b.asset);
  const last = new Map();
  const deduped = [];
  for (const b of mine) {
    const k = `${b.wallet}|${b.asset}`;
    if (last.has(k) && b.t - last.get(k) < DAY) continue;
    last.set(k, b.t);
    deduped.push(b);
  }
  if (strategy.consensus) {
    const { k, windowH, cooldownDays } = strategy.consensus;
    const recent = new Map(); // asset -> [{wallet,t}]
    const cooldown = new Map();
    const eventCooldown = new Map(); // one bet per game: event -> cooldown end
    const out = [];
    for (const b of deduped) {
      const arr = (recent.get(b.asset) || []).filter((x) => b.t - x.t <= windowH * 3600 && x.wallet !== b.wallet);
      arr.push({ wallet: b.wallet, t: b.t });
      recent.set(b.asset, arr);
      if (arr.length >= k && !(cooldown.get(b.asset) > b.t)) {
        const ev = eventKey(b);
        if (strategy.oneBetPerEvent && eventCooldown.get(ev) > b.t) continue;
        out.push({ ...b, wallets: arr.map((x) => x.wallet) });
        cooldown.set(b.asset, b.t + cooldownDays * DAY);
        if (strategy.oneBetPerEvent) eventCooldown.set(ev, b.t + cooldownDays * DAY);
      }
    }
    return out;
  }
  if (strategy.sample && deduped.length > strategy.sample) {
    const r = rng(seed);
    const idx = deduped.map((_, i) => i);
    for (let i = idx.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [idx[i], idx[j]] = [idx[j], idx[i]]; }
    return idx.slice(0, strategy.sample).sort((a, b) => a - b).map((i) => deduped[i]);
  }
  return deduped;
}

/** The game/event a market belongs to: every spread, total and moneyline of one match share it. */
export const eventKey = (b) => b.eventSlug || b.conditionId || b.asset;

/** First price at or after ts within maxGap seconds; history = sorted [{t,p}]. */
export function priceAfter(history, ts, maxGap = 3 * 3600) {
  if (!history?.length) return null;
  let lo = 0, hi = history.length;
  while (lo < hi) { const m = (lo + hi) >> 1; if (history[m].t < ts) lo = m + 1; else hi = m; }
  const x = history[lo];
  return x && x.t - ts <= maxGap ? x.p : null;
}

/**
 * Simulate one signal at one delay. prices: Map asset -> sorted [{t,p}];
 * outcomes: Map asset -> {value 0..1, resolved: bool}.
 */
export function simulate(sig, delay, prices, outcomes, { stake = 100, slippage = 0.01, feeBps = 0, fine = new Map() } = {}) {
  const hist = prices.get(sig.asset) || [];
  const entryT = sig.t + delay.seconds;
  const out = outcomes.get(sig.asset);
  if (out?.resolved && hist.length && hist[hist.length - 1].t < entryT) return { skip: 'already resolved' };
  // Minute-level delays need minute-level prices around the signal; never fall back to coarse data.
  let p = delay.seconds === 0 ? num(sig.price)
    : delay.fine ? priceAfter(fine.get(`${sig.asset}|${sig.t}`), entryT, 180)
    : priceAfter(hist, entryT);
  if (p == null || !(p > 0)) return { skip: 'no price' };
  // A market priced at 2c or less (or 98c or more) by the delayed entry is effectively decided:
  // nobody copying would still buy it, and buying resolved losers at ~1c would fake huge losses.
  if (delay.seconds > 0 && (p <= 0.02 || p >= 0.98)) return { skip: 'market already decided' };
  if (sig.fade) p = 1 - p;
  if (sig.maxEntry != null && p > sig.maxEntry) return { skip: 'favourite above cap' };
  const entry = p + slippage;
  if (entry >= 0.99 || entry <= 0.01) return { skip: 'price out of range' };
  let value = out ? out.value : hist.length ? hist[hist.length - 1].p : null;
  if (value == null) return { skip: 'no exit price' };
  if (sig.fade) value = 1 - value;
  const pnl = stake * (value / entry - 1) - (stake * feeBps) / 1e4;
  return { entry, exit: value, resolved: !!out?.resolved, pnl, stake };
}

/** Bootstrap interval for ROI (sum pnl / sum stake). */
export function bootstrapRoi(trades, { iters = 1000, seed = 11, lo = 0.05, hi = 0.95 } = {}) {
  if (trades.length < 5) return null;
  const r = rng(seed);
  const rois = [];
  for (let i = 0; i < iters; i++) {
    let pnl = 0, st = 0;
    for (let j = 0; j < trades.length; j++) { const t = trades[Math.floor(r() * trades.length)]; pnl += t.pnl; st += t.stake; }
    rois.push(pnl / st);
  }
  rois.sort((a, b) => a - b);
  return [rois[Math.floor(lo * iters)], rois[Math.floor(hi * iters)]];
}

export function summarize(trades, skipped) {
  const staked = trades.reduce((s, t) => s + t.stake, 0);
  const pnl = trades.reduce((s, t) => s + t.pnl, 0);
  const byDay = new Map();
  for (const t of trades) { const k = dateKey(t.t); byDay.set(k, (byDay.get(k) || 0) + t.pnl); }
  let cum = 0, peak = 0, maxDD = 0;
  const equity = [...byDay.entries()].sort(([a], [b]) => (a < b ? -1 : 1)).map(([date, v]) => { cum += v; peak = Math.max(peak, cum); maxDD = Math.max(maxDD, peak - cum); return { date, pnl: v, cum }; });
  const cats = new Map();
  for (const t of trades) { const c = cats.get(t.category) || { name: t.category, n: 0, staked: 0, pnl: 0 }; c.n++; c.staked += t.stake; c.pnl += t.pnl; cats.set(t.category, c); }
  return {
    n: trades.length, skipped, staked, pnl, roi: staked ? pnl / staked : 0,
    ci: bootstrapRoi(trades), winRate: trades.length ? trades.filter((t) => t.pnl > 0).length / trades.length : 0,
    resolvedShare: trades.length ? trades.filter((t) => t.resolved).length / trades.length : 0,
    medianEntry: median(trades.map((t) => t.entry)), maxDrawdown: maxDD, equity,
    categories: [...cats.values()].map((c) => ({ ...c, roi: c.staked ? c.pnl / c.staked : 0 })).sort((a, b) => b.n - a.n).slice(0, 8),
  };
}

/** Run every strategy at every delay. */
export function runBacktest({ stats, buys, prices, outcomes, split, end, opts = {} }) {
  const results = [];
  for (const s of STRATEGIES) {
    const wallets = selectWallets(stats, s.select);
    const signals = buildSignals(buys, s, wallets).map((x) => ({ ...x, fade: !!s.fade, maxEntry: s.maxEntry ?? null }));
    const byDelay = {};
    for (const d of DELAYS) {
      const trades = [];
      const skipped = {};
      for (const sig of signals) {
        const r = simulate(sig, d, prices, outcomes, opts);
        if (r.skip) { skipped[r.skip] = (skipped[r.skip] || 0) + 1; continue; }
        trades.push({ ...r, t: sig.t, wallet: sig.wallet, asset: sig.asset, title: sig.title, slug: sig.slug, eventSlug: sig.eventSlug, outcome: sig.outcome, category: categorize(sig.title, sig.eventSlug || sig.slug), wallets: sig.wallets });
      }
      const sum = summarize(trades, skipped);
      sum.sample = trades.slice(-40).reverse().map(({ t, title, slug, eventSlug, outcome, entry, exit, pnl, resolved, wallet, wallets: ws }) => ({ t, title, slug, eventSlug, outcome, entry, exit, pnl, resolved, wallet, walletCount: ws?.length }));
      byDelay[d.id] = sum;
    }
    const followed = stats.filter((x) => wallets.has(x.address)).sort((a, b) => b.trainPnl - a.trainPnl);
    results.push({ ...s, select: undefined, walletCount: wallets.size, followed: s.select.all ? [] : followed.map(({ address, name, trainPnl, tradesPerDay }) => ({ address, name, trainPnl, tradesPerDay })), signalCount: signals.length, byDelay });
  }
  const { fine, ...shownOpts } = opts;
  return { split, end, delays: DELAYS, opts: { stake: 100, slippage: 0.01, feeBps: 0, ...shownOpts }, strategies: results };
}

export { isBuy, usd };
