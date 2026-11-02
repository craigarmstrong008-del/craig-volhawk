// Gathers what the backtest needs from data/raw + Polymarket (prices, resolutions) and runs it.
import fs from 'node:fs/promises';
import path from 'node:path';
import * as api from './api.js';
import { DAY, num, pool } from './util.js';
import { trainStats, runBacktest, STRATEGIES, selectWallets, buildSignals, isBuy, usd } from './backtest.js';

const MIN_USD = Math.min(...STRATEGIES.map((s) => s.minUsd));
const parseJsonArr = (v) => { if (Array.isArray(v)) return v; try { const x = JSON.parse(v); return Array.isArray(x) ? x : []; } catch { return []; } };

export async function backtest({ dataDir, trainDays = 45, maxAssets = 12000, maxFine = 16000, concurrency = 8, log = console.log }) {
  const rawDir = path.join(dataDir, 'raw');
  const files = (await fs.readdir(rawDir)).filter((f) => f.endsWith('.json'));
  if (!files.length) throw new Error('No raw wallet data. Run `npm run collect` first.');

  // Pass 1: train stats, test-period buys, and resolution hints from position data. One file at a time.
  const stats = [];
  const liveStats = []; // most recent `trainDays`, for the paper-trading watchlist
  const buys = [];
  const hints = new Map(); // asset -> {value, resolved}
  let start = Infinity, end = 0;
  for (const f of files) {
    const raw = JSON.parse(await fs.readFile(path.join(rawDir, f), 'utf8'));
    start = Math.min(start, raw.window.start); end = Math.max(end, raw.window.end);
    const split = raw.window.start + trainDays * DAY;
    stats.push(trainStats(raw, split));
    liveStats.push(trainStats(raw, raw.window.end, raw.window.end - trainDays * DAY));
    for (const e of raw.activity || []) {
      if (!isBuy(e) || num(e.timestamp) < split || usd(e) < MIN_USD) continue;
      buys.push({ wallet: raw.profile.address, t: num(e.timestamp), asset: e.asset, conditionId: e.conditionId, outcome: e.outcome, outcomeIndex: e.outcomeIndex, price: num(e.price), usd: usd(e), title: e.title, slug: e.slug, eventSlug: e.eventSlug });
    }
    for (const p of [...(raw.open || []), ...(raw.closed || [])]) {
      if (!p.asset) continue;
      const cur = num(p.curPrice);
      const resolved = !!p.redeemable || cur <= 0.001 || cur >= 0.999;
      const prev = hints.get(p.asset);
      if (!prev || (resolved && !prev.resolved)) hints.set(p.asset, { value: resolved ? Math.round(cur) : cur, resolved });
    }
  }
  buys.sort((a, b) => a.t - b.t);
  const split = start + trainDays * DAY;
  log(`backtest: ${stats.length} wallets, ${buys.length} test-period buys, split ${new Date(split * 1000).toISOString().slice(0, 10)}`);
  log(`  train PnL source: ${['polymarket', 'positions', 'none'].map((k) => `${k} ${stats.filter((s) => s.source === k).length}`).join(', ')}`);

  // Which outcomes need prices: strategies first, so the cap only ever trims the baseline.
  // Signals per strategy, then interleaved so a fetch cap trims every strategy evenly.
  const perStrategy = STRATEGIES.map((s) => {
    const sigs = buildSignals(buys, s, selectWallets(stats, s.select));
    log(`  ${s.id}: ${sigs.length} signals`);
    return sigs;
  });
  const needed = new Map();
  const fineKeys = new Map(); // `${asset}|${t}` -> {asset, t}
  const longest = Math.max(0, ...perStrategy.map((x) => x.length));
  for (let i = 0; i < longest; i++) {
    for (const sigs of perStrategy) {
      const g = sigs[i];
      if (!g) continue;
      if (!needed.has(g.asset)) needed.set(g.asset, g.conditionId);
      const k = `${g.asset}|${g.t}`;
      if (!fineKeys.has(k)) fineKeys.set(k, { asset: g.asset, t: g.t });
    }
  }
  const assets = [...needed.keys()].slice(0, maxAssets);
  if (needed.size > maxAssets) log(`  price fetches capped at ${maxAssets} of ${needed.size} outcomes`);

  // Prices (cached on disk between runs).
  const cacheDir = path.join(dataDir, 'cache', 'prices');
  await fs.mkdir(cacheDir, { recursive: true });
  const prices = new Map();
  let done = 0, empty = 0;
  await pool(assets, concurrency, async (a) => {
    const file = path.join(cacheDir, `${a}.json`);
    let h = null;
    try { const c = JSON.parse(await fs.readFile(file, 'utf8')); if (c.end >= end - 6 * 3600) h = c.h; } catch {}
    if (!h) { h = await api.priceHistory(a, split - DAY, end); await fs.writeFile(file, JSON.stringify({ end, h })); }
    if (!h.length) empty++;
    prices.set(a, h);
    if (++done % 500 === 0) log(`  prices ${done}/${assets.length}`);
  });
  log(`  prices fetched for ${assets.length} outcomes (${empty} had no history)`);

  // Minute-level prices in a small window after each signal, for the 1- and 5-minute delays.
  const fine = new Map();
  const fineList = [...fineKeys.values()].slice(0, maxFine);
  if (fineKeys.size > maxFine) log(`  minute-level price windows capped at ${maxFine} of ${fineKeys.size}`);
  let fineDone = 0, fineEmpty = 0;
  await pool(fineList, concurrency, async ({ asset, t }) => {
    const h = await api.priceHistory(asset, t - 60, t + 9 * 60, { fidelity: 1, chunkDays: 1 });
    if (!h.length) fineEmpty++;
    fine.set(`${asset}|${t}`, h);
    if (++fineDone % 1000 === 0) log(`  minute prices ${fineDone}/${fineList.length}`);
  });
  log(`  minute-level windows: ${fineList.length} fetched, ${fineEmpty} empty`);

  // Resolutions from Polymarket's market data, falling back to position data.
  const outcomes = new Map();
  const conds = [...new Set(assets.map((a) => needed.get(a)).filter(Boolean))];
  const batches = [];
  for (let i = 0; i < conds.length; i += 25) batches.push(conds.slice(i, i + 25));
  let fromGamma = 0;
  await pool(batches, 4, async (ids) => {
    for (const m of await api.marketsByCondition(ids)) {
      const tokens = parseJsonArr(m.clobTokenIds).map(String);
      const px = parseJsonArr(m.outcomePrices).map(Number);
      const resolved = !!m.closed && px.length === tokens.length && px.every((x) => x === 0 || x === 1 || x === 0.5);
      tokens.forEach((tok, i) => { if (resolved) { outcomes.set(tok, { value: px[i], resolved: true }); fromGamma++; } });
    }
  });
  let fromHints = 0;
  for (const a of assets) if (!outcomes.has(a) && hints.get(a)?.resolved) { outcomes.set(a, hints.get(a)); fromHints++; }
  log(`  resolutions: ${fromGamma} from market data, ${fromHints} from position data; the rest are marked to the latest price`);

  // Watchlist for the paper-trading agent: who each strategy would follow today.
  const watch = {};
  for (const s of STRATEGIES) {
    if (s.select.all) continue;
    const set = selectWallets(liveStats, s.select);
    watch[s.id] = liveStats.filter((x) => set.has(x.address)).sort((a, b) => b.trainPnl - a.trainPnl)
      .map(({ address, name, trainPnl, tradesPerDay }) => ({ address, name, pnl: trainPnl, tradesPerDay }));
  }
  await fs.writeFile(path.join(dataDir, 'watchlist.json'), JSON.stringify({ generatedAt: end, rankedOnDays: trainDays, strategies: watch }, null, 2));
  log(`  watchlist: ${Object.entries(watch).map(([k, v]) => `${k} ${v.length}`).join(', ')}`);

  const result = runBacktest({ stats, buys, prices, outcomes, split, end, opts: { fine } });
  result.start = start;
  result.trainDays = trainDays;
  result.coverage = { outcomes: needed.size, priced: assets.length, fineWindows: fineList.length, fineEmpty, noHistory: empty, resolvedFromMarket: fromGamma, resolvedFromPositions: fromHints };
  result.caveats = [
    'Wallets came from leaderboards as they stand today, which partly reflect the test period. That flatters every strategy equally, so compare each one with the baseline rather than reading its return on its own.',
    'The 1- and 5-minute delays use minute-by-minute prices; longer delays use the first recorded price after the delay (30-minute resolution). The "same price" column assumes you got the wallet\'s own fill, which in practice you can\'t.',
    'Each bet stakes $100 and pays 1¢ of slippage on entry. No fees are charged. Bets on markets that haven\'t resolved yet are valued at the latest price.',
  ];
  return result;
}
