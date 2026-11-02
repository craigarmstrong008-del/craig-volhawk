// Step 2: turn raw wallet histories into 90-day metrics, archetypes, a composite score,
// and cross-wallet "smart money" signals.
import { categorize } from './categorize.js';
import { DAY, num, sum, median, dateKey, percentileRanks } from './util.js';

const PRICE_BUCKETS = [
  ['Longshot <20¢', 0, 0.2],
  ['Underdog 20–50¢', 0.2, 0.5],
  ['Lean 50–80¢', 0.5, 0.8],
  ['Favourite 80–95¢', 0.8, 0.95],
  ['Near-certain ≥95¢', 0.95, 1.01],
];

const usd = (e) => num(e.usdcSize) || num(e.size) * num(e.price);
const isLive = (p) => {
  const cur = num(p.curPrice);
  return !p.redeemable && cur > 0.001 && cur < 0.999;
};

export function analyzeWallet(raw) {
  const { profile = {}, window, activity = [], closed = [], open = [], value = 0 } = raw;
  const { start, end, days } = window;
  const trades = activity.filter((e) => e.type === 'TRADE');
  const buys = trades.filter((e) => String(e.side).toUpperCase() === 'BUY');
  const sells = trades.filter((e) => String(e.side).toUpperCase() === 'SELL');
  const byType = (t) => sum(activity.filter((e) => e.type === t), usd);

  const buyUsd = sum(buys, usd);
  const sellUsd = sum(sells, usd);
  const redeemUsd = byType('REDEEM');
  const mergeUsd = byType('MERGE');
  const splitUsd = byType('SPLIT');
  const rewardUsd = byType('REWARD');
  const volume = buyUsd + sellUsd;
  const netCash = sellUsd + redeemUsd + mergeUsd + rewardUsd - buyUsd - splitUsd;

  const sizes = trades.map(usd).filter((x) => x > 0);
  const avgBuyPrice = buyUsd ? sum(buys, (e) => usd(e) * num(e.price)) / buyUsd : 0;

  const priceMix = PRICE_BUCKETS.map(([label, lo, hi]) => ({
    label, usd: sum(buys.filter((e) => num(e.price) >= lo && num(e.price) < hi), usd),
  }));
  priceMix.forEach((b) => (b.share = buyUsd ? b.usd / buyUsd : 0));

  const hours = new Array(24).fill(0);
  const weekdays = new Array(7).fill(0);
  const activeDays = new Set();
  for (const e of trades) {
    const d = new Date(num(e.timestamp) * 1000);
    hours[d.getUTCHours()]++;
    weekdays[d.getUTCDay()]++;
    activeDays.add(dateKey(num(e.timestamp)));
  }

  // Per-market and per-category flows.
  const markets = new Map();
  const catVol = new Map();
  for (const e of activity) {
    const id = e.conditionId || e.slug || e.title;
    if (!id) continue;
    const m = markets.get(id) || { conditionId: e.conditionId, title: e.title, slug: e.slug, eventSlug: e.eventSlug, category: categorize(e.title, e.eventSlug || e.slug), buyUsd: 0, sellUsd: 0, redeemUsd: 0, trades: 0 };
    const v = usd(e);
    if (e.type === 'TRADE') {
      m.trades++;
      if (String(e.side).toUpperCase() === 'BUY') m.buyUsd += v; else m.sellUsd += v;
      catVol.set(m.category, (catVol.get(m.category) || 0) + v);
    } else if (e.type === 'REDEEM' || e.type === 'MERGE') m.redeemUsd += v;
    markets.set(id, m);
  }
  const marketList = [...markets.values()].map((m) => ({ ...m, volume: m.buyUsd + m.sellUsd, cashPnl: m.sellUsd + m.redeemUsd - m.buyUsd }));
  const topMarkets = [...marketList].sort((a, b) => b.volume - a.volume).slice(0, 12);
  const categories = [...catVol.entries()].map(([name, v]) => ({ name, volume: v, share: volume ? v / volume : 0 })).sort((a, b) => b.volume - a.volume);

  // Realised results: positions closed inside the window.
  const closedIn = closed.filter((p) => num(p.timestamp) >= start && num(p.timestamp) <= end);
  const pnls = closedIn.map((p) => num(p.realizedPnl));
  const wins = pnls.filter((x) => x > 0);
  const losses = pnls.filter((x) => x < 0);
  const realizedPnl = sum(pnls);
  const grossWin = sum(wins);
  const grossLoss = -sum(losses);
  const costBasis = sum(closedIn, (p) => num(p.totalBought) * num(p.avgPrice));
  const decided = wins.length + losses.length;
  const winRate = decided ? wins.length / decided : 0;
  const profitFactor = grossLoss ? grossWin / grossLoss : grossWin ? Infinity : 0;
  const sortedClosed = [...closedIn].sort((a, b) => num(b.realizedPnl) - num(a.realizedPnl));
  const slim = (p) => ({ title: p.title, outcome: p.outcome, slug: p.slug, eventSlug: p.eventSlug, realizedPnl: num(p.realizedPnl), avgPrice: num(p.avgPrice), timestamp: num(p.timestamp) });

  // Daily realised PnL → equity curve, consistency, drawdown, Sharpe-like ratio.
  const daily = new Map();
  for (let t = start; t <= end; t += DAY) daily.set(dateKey(t), 0);
  for (const p of closedIn) { const k = dateKey(num(p.timestamp)); daily.set(k, (daily.get(k) || 0) + num(p.realizedPnl)); }
  const dailyRows = [...daily.entries()].sort(([a], [b]) => (a < b ? -1 : 1));
  let cum = 0, peak = 0, maxDD = 0;
  const equity = dailyRows.map(([date, pnl]) => {
    cum += pnl; peak = Math.max(peak, cum); maxDD = Math.max(maxDD, peak - cum);
    return { date, pnl, cum };
  });
  const dVals = dailyRows.map(([, v]) => v);
  const nonZero = dVals.filter((v) => v !== 0);
  const mean = dVals.length ? sum(dVals) / dVals.length : 0;
  const sd = Math.sqrt(dVals.length ? sum(dVals, (v) => (v - mean) ** 2) / dVals.length : 0);
  const sharpe = sd ? (mean / sd) * Math.sqrt(365) : 0;
  const greenDayShare = nonZero.length ? nonZero.filter((v) => v > 0).length / nonZero.length : 0;

  // Open book (mark-to-market).
  const liveOpen = open.filter(isLive);
  const unrealizedPnl = sum(liveOpen, (p) => p.cashPnl);
  const openValue = sum(liveOpen, (p) => p.currentValue);
  const openPositions = [...liveOpen].sort((a, b) => num(b.currentValue) - num(a.currentValue)).map((p) => ({
    conditionId: p.conditionId, asset: p.asset, title: p.title, slug: p.slug, eventSlug: p.eventSlug, outcome: p.outcome, outcomeIndex: p.outcomeIndex,
    size: num(p.size), avgPrice: num(p.avgPrice), curPrice: num(p.curPrice), currentValue: num(p.currentValue), cashPnl: num(p.cashPnl), endDate: p.endDate,
    category: categorize(p.title, p.eventSlug || p.slug),
  }));

  const tradesPerDay = trades.length / Math.max(1, days);
  const avgTrade = sizes.length ? sum(sizes) / sizes.length : 0;
  const lastTradeTs = trades.length ? Math.max(...trades.map((e) => num(e.timestamp))) : 0;

  const m = {
    address: profile.address, name: profile.name || '', xUsername: profile.xUsername || '', verified: !!profile.verified,
    profileImage: profile.profileImage || '', boards: profile.boards || [],
    volume, buyUsd, sellUsd, redeemUsd, mergeUsd, splitUsd, rewardUsd, netCash,
    trades: trades.length, buys: buys.length, sells: sells.length, tradesPerDay, activeDays: activeDays.size,
    avgTrade, medianTrade: median(sizes), maxTrade: sizes.length ? Math.max(...sizes) : 0,
    avgBuyPrice, priceMix, hours, weekdays, uniqueMarkets: markets.size, categories, topMarkets,
    closedCount: closedIn.length, wins: wins.length, losses: losses.length, winRate, profitFactor,
    realizedPnl, grossWin, grossLoss, roi: costBasis ? realizedPnl / costBasis : 0,
    avgWin: wins.length ? grossWin / wins.length : 0, avgLoss: losses.length ? grossLoss / losses.length : 0,
    bestTrades: sortedClosed.slice(0, 5).filter((p) => num(p.realizedPnl) > 0).map(slim),
    worstTrades: sortedClosed.slice(-5).reverse().filter((p) => num(p.realizedPnl) < 0).map(slim),
    equity, maxDrawdown: maxDD, sharpe, greenDayShare,
    openCount: liveOpen.length, openPositions, openValue, unrealizedPnl, portfolioValue: num(value) || openValue,
    totalPnl90: realizedPnl + unrealizedPnl,
    truncated: !!raw.truncated, lastTradeTs, sellRatio: buyUsd ? sellUsd / buyUsd : 0,
  };
  m.archetypes = archetypes(m);
  return m;
}

export function archetypes(m) {
  const tags = [];
  const top = m.categories[0];
  if (m.avgTrade >= 5000 || m.maxTrade >= 100000) tags.push('Whale');
  if (m.tradesPerDay >= 40) tags.push('High-frequency');
  if (m.tradesPerDay >= 20 && m.sellRatio >= 0.7 && m.avgTrade < 2000) tags.push('Market-maker-like');
  if (top && top.share >= 0.7 && top.name !== 'Other') tags.push(`${top.name} specialist`);
  const share = (label) => m.priceMix.find((b) => b.label.startsWith(label))?.share || 0;
  if (share('Favourite') + share('Near-certain') >= 0.6) tags.push('Favourite grinder');
  if (share('Longshot') >= 0.35) tags.push('Longshot hunter');
  if (m.sellRatio < 0.15 && m.redeemUsd > m.sellUsd) tags.push('Hold-to-resolution');
  if (m.closedCount >= 20 && m.winRate >= 0.7) tags.push('Sharp');
  if (m.trades > 0 && m.trades <= 15 && m.realizedPnl > 50000) tags.push('Sniper');
  if (!tags.length) tags.push('Generalist');
  return tags;
}

/** Composite 0–100 "skill" score from percentile ranks across the cohort. */
export function score(wallets) {
  const shrunkWin = wallets.map((w) => (w.wins + 5) / (w.wins + w.losses + 10)); // Bayesian shrink toward 50%
  const pf = wallets.map((w) => Math.min(Number.isFinite(w.profitFactor) ? w.profitFactor : 10, 10));
  const roi = wallets.map((w) => Math.max(-1, Math.min(w.roi, 5)));
  const parts = {
    pnl: percentileRanks(wallets.map((w) => w.totalPnl90)),
    realized: percentileRanks(wallets.map((w) => w.realizedPnl)),
    win: percentileRanks(shrunkWin),
    pf: percentileRanks(pf),
    roi: percentileRanks(roi),
    sharpe: percentileRanks(wallets.map((w) => w.sharpe)),
  };
  wallets.forEach((w, i) => {
    const raw = 0.25 * parts.pnl[i] + 0.2 * parts.realized[i] + 0.15 * parts.win[i] + 0.15 * parts.pf[i] + 0.15 * parts.roi[i] + 0.1 * parts.sharpe[i];
    const confidence = Math.min(1, w.closedCount / 15); // thin samples are pulled toward the middle
    w.score = Math.round(100 * (0.5 + (raw - 0.5) * confidence));
    w.scoreParts = Object.fromEntries(Object.entries(parts).map(([k, v]) => [k, v[i]]));
  });
  return wallets;
}

/** Markets where several top wallets hold the same live outcome right now. */
export function consensus(wallets, { minHolders = 2, limit = 60 } = {}) {
  const groups = new Map();
  for (const w of wallets) {
    for (const p of w.openPositions || []) {
      if (p.currentValue < 100) continue;
      const key = `${p.conditionId}|${p.outcome}`;
      const g = groups.get(key) || { conditionId: p.conditionId, title: p.title, slug: p.slug, eventSlug: p.eventSlug, outcome: p.outcome, category: p.category, curPrice: p.curPrice, endDate: p.endDate, holders: [], value: 0, cost: 0, shares: 0 };
      g.holders.push({ address: w.address, name: w.name, score: w.score, value: p.currentValue, avgPrice: p.avgPrice, cashPnl: p.cashPnl });
      g.value += p.currentValue;
      g.cost += p.size * p.avgPrice;
      g.shares += p.size;
      groups.set(key, g);
    }
  }
  const byMarket = new Map();
  for (const g of groups.values()) {
    const arr = byMarket.get(g.conditionId) || [];
    arr.push(g); byMarket.set(g.conditionId, arr);
  }
  const rows = [];
  for (const g of groups.values()) {
    if (g.holders.length < minHolders) continue;
    const opposing = (byMarket.get(g.conditionId) || []).filter((o) => o !== g);
    const opposingValue = sum(opposing, (o) => o.value);
    rows.push({
      ...g, holderCount: g.holders.length, avgScore: Math.round(sum(g.holders, (h) => h.score) / g.holders.length),
      avgEntry: g.shares ? g.cost / g.shares : 0,
      opposingHolders: sum(opposing, (o) => o.holders.length), opposingValue,
      conviction: g.value / (g.value + opposingValue),
      holders: g.holders.sort((a, b) => b.value - a.value),
    });
  }
  return rows.sort((a, b) => b.holderCount - a.holderCount || b.value - a.value).slice(0, limit);
}

/** Outcomes several top wallets have been buying in the last `days` days. */
export function freshFlow(raws, scored, { days = 7, minWallets = 2, limit = 40 } = {}) {
  const byAddr = new Map(scored.map((w) => [w.address, w]));
  const groups = new Map();
  for (const raw of raws) {
    const w = byAddr.get(raw.profile?.address);
    if (!w) continue;
    const since = raw.window.end - days * DAY;
    for (const e of raw.activity || []) {
      if (e.type !== 'TRADE' || num(e.timestamp) < since) continue;
      const key = `${e.conditionId}|${e.outcome}`;
      const g = groups.get(key) || { conditionId: e.conditionId, title: e.title, slug: e.slug, eventSlug: e.eventSlug, outcome: e.outcome, category: categorize(e.title, e.eventSlug || e.slug), buyUsd: 0, sellUsd: 0, wallets: new Map(), lastTs: 0 };
      const v = usd(e);
      const side = String(e.side).toUpperCase();
      if (side === 'BUY') g.buyUsd += v; else g.sellUsd += v;
      const ww = g.wallets.get(w.address) || { address: w.address, name: w.name, score: w.score, net: 0 };
      ww.net += side === 'BUY' ? v : -v;
      g.wallets.set(w.address, ww);
      g.lastTs = Math.max(g.lastTs, num(e.timestamp));
      groups.set(key, g);
    }
  }
  return [...groups.values()]
    .map((g) => {
      const buyers = [...g.wallets.values()].filter((x) => x.net > 0).sort((a, b) => b.net - a.net);
      return { ...g, wallets: undefined, buyers, buyerCount: buyers.length, netFlow: g.buyUsd - g.sellUsd };
    })
    .filter((g) => g.buyerCount >= minWallets && g.netFlow > 0)
    .sort((a, b) => b.buyerCount - a.buyerCount || b.netFlow - a.netFlow)
    .slice(0, limit);
}

/** Keep only what freshFlow needs (recent trades) so full histories can be freed. */
export function slimRaw(raw, { days = 7 } = {}) {
  const since = raw.window.end - days * DAY;
  return {
    profile: { address: raw.profile?.address }, window: raw.window, fetchedAt: raw.fetchedAt,
    activity: (raw.activity || []).filter((e) => e.type === 'TRADE' && num(e.timestamp) >= since)
      .map(({ type, side, timestamp, conditionId, title, slug, eventSlug, outcome, usdcSize, size, price }) => ({ type, side, timestamp, conditionId, title, slug, eventSlug, outcome, usdcSize, size, price })),
  };
}

export function buildReport(raws, opts) {
  return buildReportFrom(raws.map(analyzeWallet), raws.map((r) => slimRaw(r)), opts);
}

/** Memory-friendly entry point: per-wallet analyses plus slimmed raws. */
export function buildReportFrom(analyses, raws, { minTrades = 1 } = {}) {
  const wallets = analyses.filter((w) => w.trades >= minTrades || w.closedCount > 0);
  score(wallets);
  wallets.sort((a, b) => b.score - a.score || b.totalPnl90 - a.totalPnl90);
  wallets.forEach((w, i) => (w.rank = i + 1));

  const days = raws[0]?.window?.days || 90;
  const archetypeCounts = {};
  for (const w of wallets) for (const t of w.archetypes) archetypeCounts[t] = (archetypeCounts[t] || 0) + 1;
  const catTotals = new Map();
  for (const w of wallets) for (const c of w.categories) catTotals.set(c.name, (catTotals.get(c.name) || 0) + c.volume);

  const profitable = wallets.filter((w) => w.totalPnl90 > 0);
  const winners = [...wallets].sort((a, b) => b.totalPnl90 - a.totalPnl90);
  const top10 = winners.slice(0, 10);
  const totalPos = sum(profitable, (w) => w.totalPnl90);

  return {
    generatedAt: Math.max(...raws.map((r) => r.fetchedAt || r.window.end)),
    window: { days, start: Math.min(...raws.map((r) => r.window.start)), end: Math.max(...raws.map((r) => r.window.end)) },
    summary: {
      wallets: wallets.length,
      totalVolume: sum(wallets, (w) => w.volume),
      totalTrades: sum(wallets, (w) => w.trades),
      totalRealized: sum(wallets, (w) => w.realizedPnl),
      totalPnl: sum(wallets, (w) => w.totalPnl90),
      profitableShare: wallets.length ? profitable.length / wallets.length : 0,
      medianWinRate: median(wallets.filter((w) => w.wins + w.losses >= 10).map((w) => w.winRate)),
      medianTrade: median(wallets.map((w) => w.medianTrade).filter(Boolean)),
      top10PnlShare: totalPos ? sum(top10.filter((w) => w.totalPnl90 > 0), (w) => w.totalPnl90) / totalPos : 0,
      archetypes: Object.entries(archetypeCounts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
      categories: [...catTotals.entries()].map(([name, volume]) => ({ name, volume })).sort((a, b) => b.volume - a.volume),
    },
    insights: insights(wallets),
    consensus: consensus(wallets),
    freshFlow: freshFlow(raws, wallets),
    wallets: wallets.map((w) => ({ ...w, openPositions: w.openPositions.slice(0, 25), profitFactor: Number.isFinite(w.profitFactor) ? w.profitFactor : null })),
  };
}

/** Plain-language, data-derived observations (only computed from the cohort). */
export function insights(wallets) {
  const out = [];
  const ok = wallets.filter((w) => w.wins + w.losses >= 10);
  if (!ok.length) return out;
  const fmt = (x) => `$${Math.round(x).toLocaleString('en-US')}`;
  const pct = (x) => `${Math.round(x * 100)}%`;

  const byTag = (tag) => ok.filter((w) => w.archetypes.some((t) => t.includes(tag)));
  for (const tag of ['Favourite grinder', 'Longshot hunter', 'Whale', 'High-frequency', 'specialist']) {
    const g = byTag(tag);
    if (g.length >= 3) out.push(`${tag === 'specialist' ? 'Category specialists' : tag + 's'} (${g.length} wallets): median 90-day PnL ${fmt(median(g.map((w) => w.totalPnl90)))}, median win rate ${pct(median(g.map((w) => w.winRate)))}.`);
  }
  const hi = [...ok].sort((a, b) => b.winRate - a.winRate)[0];
  out.push(`Highest win rate (≥10 decided positions): ${hi.name || hi.address.slice(0, 10)} at ${pct(hi.winRate)} over ${hi.wins + hi.losses} positions.`);
  const pnlRank = percentileRanks(ok.map((w) => w.totalPnl90));
  const wrRank = percentileRanks(ok.map((w) => w.winRate));
  const n = ok.length;
  const meanP = sum(pnlRank) / n, meanW = sum(wrRank) / n;
  const cov = sum(pnlRank.map((p, i) => (p - meanP) * (wrRank[i] - meanW)));
  const den = Math.sqrt(sum(pnlRank, (p) => (p - meanP) ** 2) * sum(wrRank, (w) => (w - meanW) ** 2));
  if (den) out.push(`Rank correlation between win rate and 90-day PnL: ${(cov / den).toFixed(2)} (near 0 means a high win rate alone doesn't predict profit).`);
  const lb = wallets.filter((w) => w.boards.some((b) => b.timePeriod === 'ALL'));
  const lbLosing = lb.filter((w) => w.totalPnl90 < 0);
  if (lb.length >= 5) out.push(`${lbLosing.length} of ${lb.length} all-time leaderboard wallets are down over the last 90 days.`);
  return out;
}
