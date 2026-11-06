// Paper-trading agent: watches the wallets each strategy follows, and when one of them buys,
// records the $20 bet we would have placed at the live order-book price. No orders are sent.
import fs from 'node:fs/promises';
import path from 'node:path';
import * as api from './api.js';
import { STRATEGIES, eventKey } from './backtest.js';
import { DAY, num, pool, sleep } from './util.js';

/**
 * Paper-only experiments: each is "Consensus of 3+" with exactly one thing changed, traded flat $20,
 * so it can be compared like for like with the plain consensus book. They follow consensus's wallets.
 */
const CONSENSUS = STRATEGIES.find((s) => s.id === 'consensus');
const variant = (v) => ({ ...CONSENSUS, pctOfWallet: null, sizings: ['flat'], watchFrom: 'consensus', ...v });
export const PAPER_VARIANTS = [
  variant({ id: 'consensus-noesports', name: 'Consensus 3+, no esports', desc: 'Consensus of 3+, but skips esports markets (Counter-Strike, LoL, Dota and similar).', skipEsports: true }),
  variant({ id: 'consensus-limit', name: 'Consensus 3+, limit at their price', desc: 'Consensus of 3+, but bids at the price the third wallet paid instead of taking the current asks. Unfilled bids are cancelled after 30 minutes.', limitAtTheirPrice: true, limitMinutes: 30 }),
  variant({ id: 'consensus-fast', name: 'Consensus 3+ within 1 hour', desc: 'Consensus of 3+, but the 3 wallets must all buy within 1 hour of each other (not 24).', consensus: { ...CONSENSUS.consensus, windowH: 1 } }),
];
const ALL_STRATEGIES = [...STRATEGIES, ...PAPER_VARIANTS];
export const strategyOf = (id) => ALL_STRATEGIES.find((s) => s.id === id);
const MAX_WINDOW_H = Math.max(...ALL_STRATEGIES.filter((s) => s.consensus).map((s) => s.consensus.windowH));

export const PAPER_STRATEGIES = [...STRATEGIES.filter((s) => !s.select.all && s.paper !== false), ...PAPER_VARIANTS].map((s) => s.id);
export const SIZINGS = ['flat', 'sized', 'pct'];

/** Esports markets, by title or by the event slug's game prefix (e.g. "cs2-furia-faze-…", "lol-dk-blg-…"). */
const ESPORTS_TITLE = /\b(LoL|League of Legends|Dota ?2?|CS2|CS:GO|Counter-Strike|Valorant|Overwatch|Rocket League|e-?sports?|Call of Duty|Rainbow Six|StarCraft|Mobile Legends|Honor of Kings|PUBG)\b/i;
const ESPORTS_SLUG = /^(cs2|csgo|lol|dota2|val|valorant|cod|r6|r6s|ow|rl|mlbb|hok|sc2|pubg)-/i;
export const isEsports = (m) => ESPORTS_TITLE.test(m.title || '') || ESPORTS_SLUG.test(m.eventSlug || '') || ESPORTS_SLUG.test(m.slug || '');
/**
 * A "book" is one strategy traded one way, with its own paper wallet: flat $20, conviction-sized
 * $10-$50, or (for strategies with pctOfWallet) a fixed share of the wallet's current value.
 */
export const bookId = (strategy, sizing) => (sizing === 'flat' ? strategy : `${strategy}-${sizing}`);
export const sizingsFor = (id) => { const s = strategyOf(id); return s?.sizings || (s?.pctOfWallet ? SIZINGS : SIZINGS.filter((z) => z !== 'pct')); };
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
  return { version: 1, startedAt: Math.floor(Date.now() / 1000), stake, lastSeen: {}, recent: {}, dedupe: {}, daily: {}, skipped: {}, positions: [], pending: [], log: [] };
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
    const s = strategyOf(id);
    const list = watch[id] || (s.watchFrom ? watch[s.watchFrom] : null) || [];
    if (!list.some((w) => w.address === buy.wallet)) continue;
    if (buy.usd < s.minUsd) continue;
    if (s.skipEsports && isEsports(buy)) { bump(state.skipped, `${id}: esports`); continue; }
    const dk = `${id}|${buy.wallet}|${buy.asset}`;
    if (state.dedupe[dk] && buy.t - state.dedupe[dk] < DAY) continue;
    state.dedupe[dk] = buy.t;

    let wallets = [buy.wallet];
    if (s.consensus) {
      // One shared list of recent buyers per outcome, kept for the longest window any strategy uses;
      // each strategy then counts only the buyers inside its own window.
      const rk = buy.asset;
      const all = (state.recent[rk] || []).filter((x) => buy.t - x.t <= MAX_WINDOW_H * 3600 && x.wallet !== buy.wallet);
      all.push({ wallet: buy.wallet, t: buy.t });
      state.recent[rk] = all;
      const arr = all.filter((x) => buy.t - x.t <= s.consensus.windowH * 3600);
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
  const waiting = (state.pending || []).filter((o) => o.book === book);
  if (waiting.some((o) => o.conditionId === conditionId || (event && eventKey(o) === event))) return 'bid already waiting';
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
      name: strategyOf(splitBook(b).strategy)?.name ?? null,
      pctOfWallet: strategyOf(splitBook(b).strategy)?.pctOfWallet ?? null,
      waiting: (state.pending || []).filter((o) => o.book === b).length,
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
  state.pending = state.pending || [];
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
  /** Record a filled paper bet (after the price limits) and take its cost from the book's cash. */
  const openBet = (o, fill, strat) => {
    if (fill.avg >= 0.99) { bump(state.skipped, `${o.book}: price too high`); return; }
    if (strat?.maxEntry != null && fill.avg > strat.maxEntry) { bump(state.skipped, `${o.book}: favourite above ${Math.round(strat.maxEntry * 100)}¢`); return; }
    const detectedAt = Math.floor(Date.now() / 1000);
    state.positions.push({
      id: `${o.book}-${o.token}-${detectedAt}`, book: o.book, strategy: o.strategy, sizing: o.sizing, status: 'open',
      token: o.token, conditionId: o.conditionId, title: o.title, slug: o.slug, eventSlug: o.eventSlug,
      outcome: o.outcome, wallets: o.wallets, theirPrice: o.theirPrice, theirTs: o.theirTs, theirUsd: o.theirUsd, theirTypicalUsd: o.theirTypicalUsd,
      detectedAt, lagSec: detectedAt - o.theirTs, entry: fill.avg, bestAsk: fill.bestAsk, shares: fill.shares, cost: o.amount,
      ...(o.limit != null ? { limit: o.limit } : {}),
    });
    state.books[o.book].cash -= o.amount;
    state.daily[`${o.book}|${o.day}`] = (state.daily[`${o.book}|${o.day}`] || 0) + 1;
    note(`${o.book}: bought ${o.outcome} on "${(o.title || '').slice(0, 60)}" for $${o.amount} at ${(fill.avg * 100).toFixed(1)}¢ (they paid ${(o.theirPrice * 100).toFixed(1)}¢ with $${Math.round(o.theirUsd)}, ${detectedAt - o.theirTs}s ago)`);
  };

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
        const strat = strategyOf(want.strategy);
        const theirPrice = want.target === 'same' ? buy.price : 1 - buy.price;
        let asks = null;
        for (const sizing of sizingsFor(want.strategy)) {
          const book = bookId(want.strategy, sizing);
          const amount = sizing === 'pct'
            ? pctStake(bookEquity(state, book), state.books[book]?.cash ?? 0, strat.pctOfWallet)
            : stakeFor(sizing, buy.usd, typical.get(buy.wallet), { stake, ...sized });
          const why = bookCheck(state, book, buy.conditionId, want.day, amount, { maxBetsPerDay, event: strat.oneBetPerEvent ? eventKey(buy) : null });
          if (why) { bump(state.skipped, `${book}: ${why}`); continue; }
          try {
            if (!asks) asks = (await api.book(tgt.token)).asks;
            const order = { book, strategy: want.strategy, sizing, token: tgt.token, outcome: tgt.outcome, conditionId: buy.conditionId, title: buy.title, slug: buy.slug, eventSlug: buy.eventSlug, wallets: want.wallets, theirPrice, theirTs: buy.t, theirUsd: buy.usd, theirTypicalUsd: typical.get(buy.wallet) ?? null, day: want.day, amount };
            if (strat.limitAtTheirPrice) {
              // Bid at their price: fill now only from asks at or below it, otherwise wait for the price to come back.
              const fill = fillFromBook(asks.filter((a) => a.price <= theirPrice + 1e-9), amount);
              if (fill) { openBet(order, fill, strat); continue; }
              const placedAt = Math.floor(Date.now() / 1000);
              state.pending.push({ ...order, limit: theirPrice, placedAt, expiresAt: placedAt + (strat.limitMinutes || 30) * 60 });
              note(`${book}: bid $${amount} at ${(theirPrice * 100).toFixed(1)}¢ for ${tgt.outcome} on "${(buy.title || '').slice(0, 60)}" (asks start at ${asks[0] ? (asks[0].price * 100).toFixed(1) : '?'}¢)`);
              continue;
            }
            const fill = fillFromBook(asks, amount);
            if (!fill) { bump(state.skipped, `${book}: not enough liquidity`); continue; }
            openBet(order, fill, strat);
          } catch { bump(state.skipped, `${book}: pricing error`); }
        }
      }
    }

    // 2b. Resting bids: fill from asks at or below the bid, or cancel once they expire.
    for (const o of [...state.pending]) {
      const now = Math.floor(Date.now() / 1000);
      let fill = null;
      try { fill = fillFromBook((await api.book(o.token)).asks.filter((a) => a.price <= o.limit + 1e-9), o.amount); } catch { /* try again next cycle */ }
      if (fill && (state.books[o.book]?.cash ?? 0) >= o.amount) {
        state.pending.splice(state.pending.indexOf(o), 1);
        openBet(o, fill, strategyOf(o.strategy));
      } else if (now >= o.expiresAt) {
        state.pending.splice(state.pending.indexOf(o), 1);
        bump(state.skipped, `${o.book}: bid not filled`);
        note(`${o.book}: bid at ${(o.limit * 100).toFixed(1)}¢ on "${(o.title || '').slice(0, 60)}" cancelled unfilled`);
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
