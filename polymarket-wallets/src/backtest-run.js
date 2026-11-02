// Gathers what the backtest needs from data/raw + Polymarket (prices, resolutions) and runs it.
import fs from 'node:fs/promises';
import path from 'node:path';
import * as api from './api.js';
import { DAY, num, pool } from './util.js';
import { trainStats, runBacktest, STRATEGIES, selectWallets, buildSignals, isBuy, usd } from './backtest.js';

const MIN_USD = Math.min(...STRATEGIES.map((s) => s.minUsd));
const parseJsonArr = (v) => { if (Array.isArray(v)) return v; try { const x = JSON.parse(v); return Array.isArray(x) ? x : []; } catch { return []; } };

export async function backtest({ dataDir, trainDays = 45, maxAssets = 6000, concurrency = 8, log = console.log }) {
  const rawDir = path.join(dataDir, 'raw');
  const files = (await fs.readdir(rawDir)).filter((f) => f.endsWith('.json'));
  if (!files.length) throw new Error('No raw wallet data. Run `npm run collect` first.');

  // Pass 1: train stats, test-period buys, and resolution hints from position data. One file at a time.
  const stats = [];
  const buys = [];
  const hints = new Map(); // asset -> {value, resolved}
  let start = Infinity, end = 0;
  for (const f of files) {
    const raw = JSON.parse(await fs.readFile(path.join(rawDir, f), 'utf8'));
    start = Math.min(start, raw.window.start); end = Math.max(end, raw.window.end);
    const split = raw.window.start + trainDays * DAY;
    stats.push(trainStats(raw, split));
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
  const needed = new Map();
  for (const s of STRATEGIES) {
    const sigs = buildSignals(buys, s, selectWallets(stats, s.select));
    log(`  ${s.id}: ${sigs.length} signals`);
    for (const g of sigs) if (!needed.has(g.asset)) needed.set(g.asset, g.conditionId);
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

  const result = runBacktest({ stats, buys, prices, outcomes, split, end });
  result.start = start;
  result.trainDays = trainDays;
  result.coverage = { outcomes: needed.size, priced: assets.length, noHistory: empty, resolvedFromMarket: fromGamma, resolvedFromPositions: fromHints };
  result.caveats = [
    'Wallets came from leaderboards as they stand today, which partly reflect the test period. That flatters every strategy equally, so compare each one with the baseline rather than reading its return on its own.',
    'Delayed entries use the first recorded price after the delay (30-minute resolution). The "same price" column assumes you got the wallet\'s own fill, which in practice you can\'t.',
    'Each bet stakes $100 and pays 1¢ of slippage on entry. No fees are charged. Bets on markets that haven\'t resolved yet are valued at the latest price.',
  ];
  return result;
}
