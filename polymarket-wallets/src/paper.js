// Paper-trading agent: watches the wallets each strategy follows, and when one of them buys,
// records the $20 bet we would have placed at the live order-book price. No orders are sent.
import fs from 'node:fs/promises';
import path from 'node:path';
import * as api from './api.js';
import { STRATEGIES, eventKey } from './backtest.js';
import { DAY, num, pool, sleep } from './util.js';

export const PAPER_STRATEGIES = STRATEGIES.filter((s) => !s.select.all && s.paper !== false).map((s) => s.id);
export const SIZINGS = ['flat', 'sized', 'pct'];
/**
 * A "book" is one strategy traded one way, with its own paper wallet: flat $20, conviction-sized
 * $10-$50, or (for strategies with pctOfWallet) a fixed share of the wallet's current value.
 */
export const bookId = (strategy, sizing) => (sizing === 'flat' ? strategy : `${strategy}-${sizing}`);
export const sizingsFor = (id) => (STRATEGIES.find((s) => s.id === id)?.pctOfWallet ? SIZINGS : SIZINGS.filter((z) => z !== 'pct'));
export const PAPER_BOOKS = PAPER_STRATEGIES.flatMap((id) => sizingsFor(id).map((z) => bookId(id, z)));
export const splitBook = (b) => { const m = String(b).match(/^(.*?)-(sized|pct)$/); return m ? { strategy: m[1], sizing: m[2] } : { strategy: String(b), sizing: 'flat' }; };

/** A wallet's current value: cash plus open bets at their latest price (cost if never priced). */
export function bookEquity(state, book) {
  const open = state.positions.filter((p) => (p.book || p.strategy) === book && p.status === 'open');
  return (state.books?.[book]?.cash ?? 0) + open.reduce((s, p) => s + (p.mark != null ? p.shares * p.mark : p.cost), 0);
}

/** Fixed-fraction stake: pct of the wallet's value, at least $5, at most 10% of value and never more than the cash. */
export function pctStake(equity, cash, pct, { min = 5, maxShare = 0.1 } = {}) {
  const want = Math.min(pct * equity, maxShare * equity, cash);
  return want >= min ? Math.round(want * 100) / 100 : min;
}

/**
 * Stake for one bet. Flat: always `stake`. Sized: $10 for a trade the size of the wallet's typical
 * buy, scaling with how much bigger it is, capped at $50.
 */
export function stakeFor(sizing, buyUsd, typicalUsd, { stake = 20, base = 10, max = 50 } = {}) {
  if (sizing === 'flat') return stake;
  const ratio = typicalUsd > 0 ? buyUsd / typicalUsd : 1;
  return Math.round(Math.min(max, Math.max(base, base * ratio)));
}

/** Median of a wallet's buys at or above `minUsd` (the sizes that can trigger a copy). */
export function typicalBuy(trades, minUsd) {
  const sizes = (trades || []).filter((e) => String(e.side).toUpperCase() === 'BUY')
    .map((e) => num(e.usdcSize) || num(e.size) * num(e.price)).filter((x) => x >= minUsd).sort((a, b) => a - b);
  return sizes.length ? sizes[sizes.length >> 1] : null;
}

/** Create any missing paper wallets. Older state (before wallets existed) is folded in. */
export function ensureBooks(state, bankroll) {
  state.books = state.books || {};
  for (const b of PAPER_BOOKS) {
    if (state.books[b]) continue;
    const ps = state.positions.filter((p) => (p.book || p.strategy) === b);
    const spent = ps.reduce((s, p) => s + p.cost, 0);
    const paidBack = ps.filter((p) => p.status !== 'open').reduce((s, p) => s + p.shares * (p.exit ?? 0), 0);
    state.books[b] = { start: bankroll, cash: bankroll - spent + paidBack };
  }
  for (const p of state.positions) { if (!p.book) p.book = p.strategy; if (!p.sizing) p.sizing = splitBook(p.book).sizing; }
  return state.books;
}

/** Average fill for spending `stake` dollars against the asks. Null if the book can't fill it. */
export function fillFromBook(asks, stake) {
  let cost = 0, shares = 0;
  for (const { price, size } of asks) {
    const take = Math.min(size, (stake - cost) / price);
    shares += take; cost += take * price;
    if (cost >= stake - 1e-9) break;
  }
  if (cost < stake - 1e-6 || !shares) return null;
  return { shares, avg: cost / shares, bestAsk: asks[0].price };
}

export function emptyState(stake) {
  return { version: 1, startedAt: Math.floor(Date.now() / 1000), stake, lastSeen: {}, recent: {}, dedupe: {}, daily: {}, skipped: {}, positions: [], log: [] };
}

const bump = (o, k) => (o[k] = (o[k] || 0) + 1);

/** Keep the latest distinct error messages (with counts and last time) so failures can be diagnosed. */
export function recordError(state, kind, err) {
  state.errors = state.errors || {};
  const msg = `${kind}: ${String(err?.message || err).replace(/0x[0-9a-fA-F]{40}/g, '0x…').slice(0, 300)}`;
  const e = state.errors[msg] || { count: 0, first: Math.floor(Date.now() / 1000) };
  e.count++; e.last = Math.floor(Date.now() / 1000);
  state.errors[msg] = e;
  const keys = Object.keys(state.errors);
  if (keys.length > 8) keys.sort((a, b) => state.errors[a].last - state.errors[b].last).slice(0, keys.length - 8).forEach((k) => delete state.errors[k]);
}

/**
 * Pure decision step: given one new buy by a watched wallet, return the bets each strategy wants
 * (before sizing and pricing). Mutates `state` bookkeeping (dedupe and consensus windows).
 */
export function decide(state, buy, watch) {
  const wants = [];
  const day = new Date(buy.t * 1000).toISOString().slice(0, 10);
  for (const id of PAPER_STRATEGIES) {
    const s = STRATEGIES.find((x) => x.id === id);
    const list = watch[id] || [];
    if (!list.some((w) => w.address === buy.wallet)) continue;
    if (buy.usd < s.minUsd) continue;
    const dk = `${id}|${buy.wallet}|${buy.asset}`;
    if (state.dedupe[dk] && buy.t - state.dedupe[dk] < DAY) continue;
    state.dedupe[dk] = buy.t;

    let wallets = [buy.wallet];
    if (s.consensus) {
      const rk = buy.asset;
      const arr = (state.recent[rk] || []).filter((x) => buy.t - x.t <= s.consensus.windowH * 3600 && x.wallet !== buy.wallet);
      arr.push({ wallet: buy.wallet, t: buy.t });
      state.recent[rk] = arr;
      if (arr.length < s.consensus.k) continue;
      const ck = `${id}|cool|${buy.asset}`;
      if (state.dedupe[ck] && buy.t < state.dedupe[ck]) { bump(state.skipped, `${id}: cooldown`); continue; }
      state.dedupe[ck] = buy.t + s.consensus.cooldownDays * DAY;
      wallets = arr.map((x) => x.wallet);
    }
    const target = s.fade ? 'opposite' : 'same';
    wants.push({ strategy: id, target, wallets, buy, day });
  }
  return wants;
}

/** Per-book checks before pricing: one open bet per market, daily cap, enough cash. */
export function bookCheck(state, book, conditionId, day, stake, { maxBetsPerDay = 40, event = null } = {}) {
  if (state.positions.some((p) => p.book === book && p.status === 'open' && p.conditionId === conditionId)) return 'already holding';
  if (event && state.positions.some((p) => p.book === book && p.status === 'open' && eventKey(p) === event)) return 'already on this game';
  if ((state.daily[`${book}|${day}`] || 0) >= maxBetsPerDay) return 'daily cap';
  if ((state.books[book]?.cash ?? 0) < stake) return 'out of cash';
  return null;
}

/** Resolve the token we'd actually buy (the same one, or the other side for a fade). */
async function targetToken(want, markets) {
  const { buy } = want;
  if (want.target === 'same') return { token: buy.asset, outcome: buy.outcome };
  let m = markets.get(buy.conditionId);
  if (m === undefined) {
    const found = (await api.marketsByCondition([buy.conditionId]))[0];
    m = found ? { tokens: parseArr(found.clobTokenIds).map(String), outcomes: parseArr(found.outcomes) } : null;
    markets.set(buy.conditionId, m);
  }
  if (!m || m.tokens.length !== 2) return null;
  const i = m.tokens.indexOf(String(buy.asset));
  if (i < 0) return null;
  return { token: m.tokens[1 - i], outcome: m.outcomes[1 - i] ?? `not ${buy.outcome}` };
}
const parseArr = (v) => { if (Array.isArray(v)) return v; try { const x = JSON.parse(v); return Array.isArray(x) ? x : []; } catch { return []; } };

export function summarizePaper(state) {
  const by = {};
  // Current books, plus retired ones (e.g. fade20) that still hold bets, so their results stay visible.
  const retired = Object.keys(state.books || {}).filter((b) => !PAPER_BOOKS.includes(b) && state.positions.some((p) => (p.book || p.strategy) === b));
  for (const b of [...PAPER_BOOKS, ...retired]) {
    const ps = state.positions.filter((p) => (p.book || p.strategy) === b);
    const settled = ps.filter((p) => p.status !== 'open');
    const open = ps.filter((p) => p.status === 'open');
    const realised = settled.reduce((s, p) => s + p.pnl, 0);
    const staked = settled.reduce((s, p) => s + p.cost, 0);
    const openValue = open.reduce((s, p) => s + (p.mark != null ? p.shares * p.mark : p.cost), 0);
    const openCost = open.reduce((s, p) => s + p.cost, 0);
    const lag = ps.map((p) => p.lagSec).sort((a, b) => a - b);
    const wallet = state.books?.[b] || { start: 0, cash: 0 };
    const equity = wallet.cash + openValue;
    by[b] = {
      ...splitBook(b), retired: !PAPER_BOOKS.includes(b),
      pctOfWallet: STRATEGIES.find((x) => x.id === splitBook(b).strategy)?.pctOfWallet ?? null,
      bets: ps.length, open: open.length, settled: settled.length,
      won: settled.filter((p) => p.pnl > 0).length, realised, staked, roi: staked ? realised / staked : null,
      unrealised: openValue - openCost, openCost,
      start: wallet.start, cash: wallet.cash, equity, walletReturn: wallet.start ? equity / wallet.start - 1 : null,
      avgStake: ps.length ? ps.reduce((s, p) => s + p.cost, 0) / ps.length : null,
      medianLagSec: lag.length ? lag[lag.length >> 1] : null,
      avgPriceGap: ps.length ? ps.reduce((s, p) => s + (p.entry - p.theirPrice), 0) / ps.length : null,
    };
  }
  return by;
}

/**
 * Run the agent for `minutes`. State lives in dataDir/paper/state.json so runs resume where they
 * left off; a gap longer than `maxGapMin` skips the backlog instead of trading on stale signals.
 */
export async function runPaper({ dataDir, minutes = 60, pollSec = 30, stake = 20, bankroll = 500, sized = { base: 10, max: 50 }, maxBetsPerDay = 40, maxGapMin = 10, settleEveryMin = 10, concurrency = 4, log = console.log }) {
  const dir = path.join(dataDir, 'paper');
  await fs.mkdir(dir, { recursive: true });
  const stateFile = path.join(dir, 'state.json');
  const watchFile = path.join(dataDir, 'watchlist.json');
  const watchJson = JSON.parse(await fs.readFile(watchFile, 'utf8').catch(() => 'null'));
  if (!watchJson) throw new Error('No data/watchlist.json yet. It is written by the backtest step.');
  const watch = watchJson.strategies;
  let state = JSON.parse(await fs.readFile(stateFile, 'utf8').catch(() => 'null')) || emptyState(stake);
  const wallets = [...new Set(Object.values(watch).flat().map((w) => w.address))];
  const now0 = Math.floor(Date.now() / 1000);
  let reset = 0;
  for (const w of wallets) if (!state.lastSeen[w] || now0 - state.lastSeen[w] > maxGapMin * 60) { state.lastSeen[w] = now0; reset++; }
  ensureBooks(state, bankroll);
  // Each wallet's typical copy-sized buy: the median of its own buys at or above the smallest copy
  // trigger, over its last 500 trades (30 days at most). Large orders fill as many small trades, so
  // comparing against all fills would make every copied buy look like maximum conviction.
  const typical = new Map();
  const trigger = Math.min(...STRATEGIES.filter((x) => !x.select.all).map((x) => x.minUsd));
  await pool(wallets, concurrency, async (w) => {
    try {
      const trades = await api.recentTrades(w, now0 - 30 * DAY, { limit: 500 });
      const t = typicalBuy(trades, trigger);
      if (t) typical.set(w, t);
    } catch { /* falls back to the minimum sized stake */ }
  });
  log(`paper agent: ${wallets.length} wallets, ${PAPER_BOOKS.length} books ($${bankroll} paper wallet each; flat $${stake}, sized $${sized.base}-$${sized.max}), ${minutes} min` + (reset ? ` (${reset} wallets start fresh; older trades are ignored)` : ''));

  const markets = new Map();
  const save = async () => {
    const now = Math.floor(Date.now() / 1000);
    state.updatedAt = now;
    state.log = state.log.slice(-200);
    for (const [k, v] of Object.entries(state.dedupe)) if (v < now - 8 * DAY) delete state.dedupe[k];
    for (const [k, arr] of Object.entries(state.recent)) { const keep = arr.filter((x) => now - x.t <= 2 * DAY); if (keep.length) state.recent[k] = keep; else delete state.recent[k]; }
    const cutoff = new Date((now - 7 * DAY) * 1000).toISOString().slice(0, 10);
    for (const k of Object.keys(state.daily)) if (k.split('|')[1] < cutoff) delete state.daily[k];
    const tmp = `${stateFile}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(state));
    await fs.rename(tmp, stateFile);
  };
  const note = (msg) => { const line = `${new Date().toISOString().slice(0, 19)}Z ${msg}`; state.log.push(line); log(`  ${line}`); };

  const deadline = Date.now() + minutes * 60e3;
  let lastSettle = 0;
  while (Date.now() < deadline) {
    const cycleStart = Date.now();
    // 1. Poll every watched wallet for new trades.
    const fresh = [];
    await pool(wallets, concurrency, async (w) => {
      let trades;
      try { trades = await api.recentTrades(w, state.lastSeen[w]); } catch (e) { bump(state.skipped, 'poll error'); recordError(state, 'poll', e); return; }
      state.pollOk = (state.pollOk || 0) + 1;
      state.lastPollOkAt = Math.floor(Date.now() / 1000);
      for (const e of trades) {
        const t = num(e.timestamp);
        if (t <= state.lastSeen[w]) continue;
        if (String(e.side).toUpperCase() === 'BUY' && e.asset) fresh.push({ wallet: w, t, asset: String(e.asset), conditionId: e.conditionId, outcome: e.outcome, title: e.title, slug: e.slug, eventSlug: e.eventSlug, price: num(e.price), usd: num(e.usdcSize) || num(e.size) * num(e.price) });
      }
      if (trades.length) state.lastSeen[w] = Math.max(state.lastSeen[w], ...trades.map((e) => num(e.timestamp)));
    });
    fresh.sort((a, b) => a.t - b.t);

    // 2. Decide and price paper bets at the live order book.
    for (const buy of fresh) {
      for (const want of decide(state, buy, watch)) {
        let tgt;
        try { tgt = await targetToken(want, markets); } catch { bump(state.skipped, `${want.strategy}: pricing error`); continue; }
        if (!tgt) { bump(state.skipped, `${want.strategy}: no opposite side`); continue; }
        let asks = null;
        for (const sizing of sizingsFor(want.strategy)) {
          const book = bookId(want.strategy, sizing);
          const pct = STRATEGIES.find((x) => x.id === want.strategy)?.pctOfWallet;
          const amount = sizing === 'pct'
            ? pctStake(bookEquity(state, book), state.books[book]?.cash ?? 0, pct)
            : stakeFor(sizing, buy.usd, typical.get(buy.wallet), { stake, ...sized });
          const strat = STRATEGIES.find((x) => x.id === want.strategy);
          const why = bookCheck(state, book, buy.conditionId, want.day, amount, { maxBetsPerDay, event: strat.oneBetPerEvent ? eventKey(buy) : null });
          if (why) { bump(state.skipped, `${book}: ${why}`); continue; }
          try {
            if (!asks) asks = (await api.book(tgt.token)).asks;
            const fill = fillFromBook(asks, amount);
            if (!fill) { bump(state.skipped, `${book}: not enough liquidity`); continue; }
            if (fill.avg >= 0.99) { bump(state.skipped, `${book}: price too high`); continue; }
            if (strat.maxEntry != null && fill.avg > strat.maxEntry) { bump(state.skipped, `${book}: favourite above ${Math.round(strat.maxEntry * 100)}¢`); continue; }
            const detectedAt = Math.floor(Date.now() / 1000);
            const theirPrice = want.target === 'same' ? buy.price : 1 - buy.price;
            state.positions.push({
              id: `${book}-${tgt.token}-${detectedAt}`, book, strategy: want.strategy, sizing, status: 'open',
              token: tgt.token, conditionId: buy.conditionId, title: buy.title, slug: buy.slug, eventSlug: buy.eventSlug,
              outcome: tgt.outcome, wallets: want.wallets, theirPrice, theirTs: buy.t, theirUsd: buy.usd, theirTypicalUsd: typical.get(buy.wallet) ?? null,
              detectedAt, lagSec: detectedAt - buy.t, entry: fill.avg, bestAsk: fill.bestAsk, shares: fill.shares, cost: amount,
            });
            state.books[book].cash -= amount;
            state.daily[`${book}|${want.day}`] = (state.daily[`${book}|${want.day}`] || 0) + 1;
            note(`${book}: bought ${tgt.outcome} on "${(buy.title || '').slice(0, 60)}" for $${amount} at ${(fill.avg * 100).toFixed(1)}¢ (they paid ${(theirPrice * 100).toFixed(1)}¢ with $${Math.round(buy.usd)}, ${detectedAt - buy.t}s ago)`);
          } catch { bump(state.skipped, `${book}: pricing error`); }
        }
      }
    }

    // 3. Settle resolved markets and mark the rest to the midpoint.
    if (Date.now() - lastSettle > settleEveryMin * 60e3) {
      lastSettle = Date.now();
      const open = state.positions.filter((p) => p.status === 'open');
      const conds = [...new Set(open.map((p) => p.conditionId).filter(Boolean))];
      const resolved = new Map();
      for (let i = 0; i < conds.length; i += 25) {
        for (const m of await api.marketsByCondition(conds.slice(i, i + 25)).catch(() => [])) {
          const toks = parseArr(m.clobTokenIds).map(String), px = parseArr(m.outcomePrices).map(Number);
          if (m.closed && px.length === toks.length && px.every((x) => x === 0 || x === 1 || x === 0.5)) toks.forEach((t, j) => resolved.set(t, px[j]));
        }
      }
      await pool(open, concurrency, async (p) => {
        if (resolved.has(p.token)) {
          const v = resolved.get(p.token);
          p.exit = v; p.pnl = p.shares * v - p.cost; p.status = v > 0.5 ? 'won' : v < 0.5 ? 'lost' : 'void'; p.settledAt = Math.floor(Date.now() / 1000);
          state.books[p.book || p.strategy].cash += p.shares * v;
          note(`${p.book || p.strategy}: ${p.status} "${(p.title || '').slice(0, 60)}" ${p.pnl >= 0 ? '+' : ''}$${p.pnl.toFixed(2)}`);
        } else {
          try { p.mark = await api.midpoint(p.token); } catch { /* keep the previous mark */ }
        }
      });
    }

    await save();
    const wait = pollSec * 1000 - (Date.now() - cycleStart);
    if (wait > 0 && Date.now() + wait < deadline) await sleep(wait);
  }
  await save();
  return state;
}
