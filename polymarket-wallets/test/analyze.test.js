import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeWallet, buildReport, consensus, officialPnl } from '../src/analyze.js';
import { categorize } from '../src/categorize.js';
import { percentileRanks } from '../src/util.js';
import { makeRaw, NOW } from './fixtures.js';

test('cash flows and trade counts add up', () => {
  const raw = makeRaw(1);
  const w = analyzeWallet(raw);
  const trades = raw.activity.filter((e) => e.type === 'TRADE');
  assert.equal(w.trades, trades.length);
  const buy = trades.filter((e) => e.side === 'BUY').reduce((a, e) => a + e.usdcSize, 0);
  const sell = trades.filter((e) => e.side === 'SELL').reduce((a, e) => a + e.usdcSize, 0);
  assert.ok(Math.abs(w.volume - (buy + sell)) < 1e-6);
  const redeem = raw.activity.filter((e) => e.type === 'REDEEM').reduce((a, e) => a + e.usdcSize, 0);
  assert.ok(Math.abs(w.netCash - (sell + redeem - buy)) < 1e-6);
  assert.ok(Math.abs(w.priceMix.reduce((a, b) => a + b.share, 0) - 1) < 1e-9);
});

test('realised stats only count positions closed inside the window', () => {
  const raw = makeRaw(2);
  raw.closed.push({ realizedPnl: 1e9, timestamp: NOW - 200 * 86400, totalBought: 1, avgPrice: 1 });
  const w = analyzeWallet(raw);
  assert.ok(w.realizedPnl < 1e8);
  assert.equal(w.wins + w.losses, raw.closed.length - 1 + 1); // minus the pre-window close, plus the fixture's unredeemed resolved position
  assert.ok(w.winRate >= 0 && w.winRate <= 1);
  assert.equal(w.equity.length, 91);
  assert.ok(Math.abs(w.equity.at(-1).cum - w.realizedPnl) < 1e-6);
});

test('resolved/redeemable positions are excluded from the open book', () => {
  const w = analyzeWallet(makeRaw(3));
  assert.equal(w.openCount, 2);
  assert.equal(w.unrealizedPnl, 150);
});

test('unredeemed resolved losers count as realised losses', () => {
  const raw = makeRaw(4);
  const base = analyzeWallet(raw);
  raw.open.push({ conditionId: '0xlost', asset: 'lost', title: 'Lost bet', outcome: 'Yes', size: 2000, avgPrice: 0.9, curPrice: 0, currentValue: 0, cashPnl: -1800, endDate: new Date((raw.window.end - 86400) * 1000).toISOString() });
  raw.open.push({ conditionId: '0xold', asset: 'old', title: 'Old loss', outcome: 'No', size: 10, avgPrice: 0.5, curPrice: 0, currentValue: 0, cashPnl: -5, endDate: new Date((raw.window.start - 30 * 86400) * 1000).toISOString() });
  const w = analyzeWallet(raw);
  // The fixture already holds one resolved winner (+50); the new loser adds -1800, the pre-window one is ignored.
  assert.equal(w.losses, base.losses + 1);
  assert.ok(Math.abs(w.realizedPnl - (base.realizedPnl - 1800)) < 1e-6);
  assert.equal(w.openCount, base.openCount);
});

test('scores are 0-100 and report is ranked', () => {
  const raws = Array.from({ length: 12 }, (_, i) => makeRaw(i + 1, { winBias: i / 12 }));
  const r = buildReport(raws);
  assert.equal(r.wallets.length, 12);
  r.wallets.forEach((w, i) => { assert.equal(w.rank, i + 1); assert.ok(w.score >= 0 && w.score <= 100); });
  for (let i = 1; i < r.wallets.length; i++) assert.ok(r.wallets[i - 1].score >= r.wallets[i].score);
  assert.ok(r.insights.length > 0);
  assert.ok(JSON.stringify(r)); // serialisable (no Infinity leaks)
});

test('consensus groups shared live outcomes and computes average entry', () => {
  const ws = [1, 2, 3].map((i) => ({ ...analyzeWallet(makeRaw(i)), score: 60 }));
  const c = consensus(ws);
  assert.equal(c.length, 1);
  assert.equal(c[0].conditionId, '0xshared');
  assert.equal(c[0].holderCount, 3);
  assert.ok(Math.abs(c[0].avgEntry - 0.4) < 1e-9);
  assert.equal(c[0].conviction, 1);
});

test('fresh flow finds outcomes bought by several wallets recently', () => {
  const raws = [1, 2, 3].map((i) => makeRaw(i));
  raws.forEach((r, k) => r.activity.push({ type: 'TRADE', side: 'BUY', timestamp: NOW - 3600, conditionId: '0xhot', title: 'Hot market', outcome: 'Yes', usdcSize: 1000 + k, size: 2000, price: 0.5 }));
  const r = buildReport(raws);
  const hot = r.freshFlow.find((f) => f.conditionId === '0xhot');
  assert.ok(hot);
  assert.equal(hot.buyerCount, 3);
});

test('categoriser and percentile ranks', () => {
  assert.equal(categorize('Lakers vs Celtics'), 'Sports');
  assert.equal(categorize('Will Bitcoin hit $150k?'), 'Crypto');
  assert.equal(categorize('Fed rate cut in March?'), 'Economy');
  assert.equal(categorize('Something unrelated'), 'Other');
  assert.deepEqual(percentileRanks([10, 20, 30]), [0, 0.5, 1]);
  assert.deepEqual(percentileRanks([5, 5]), [0.5, 0.5]);
});

test('Polymarket PnL history drives 90-day PnL when present', () => {
  const raw = makeRaw(5);
  const { start, end } = raw.window;
  raw.pnl = [
    { t: start - 10 * 86400, p: 1000 },
    { t: start - 86400, p: 2000 },          // baseline: last point at/before the window start
    { t: (start + 5 * 86400) * 1000, p: 2500 }, // millisecond timestamps are normalised
    { t: end - 86400, p: 7000 },
  ];
  const w = analyzeWallet(raw);
  assert.equal(w.pnlSource, 'polymarket');
  assert.equal(w.totalPnl90, 5000);
  assert.ok(Math.abs(w.equity.at(-1).cum - 5000) < 1e-6);
  assert.notEqual(w.positionPnl90, w.totalPnl90);
  assert.equal(officialPnl([], start), null);
  assert.equal(analyzeWallet(makeRaw(6)).pnlSource, 'positions');
});
