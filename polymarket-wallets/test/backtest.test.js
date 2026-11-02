import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { trainStats, selectWallets, buildSignals, simulate, priceAfter, bootstrapRoi, STRATEGIES, DELAYS } from '../src/backtest.js';

const DAY = 86400;
const S = (id) => STRATEGIES.find((s) => s.id === id);
const D = (id) => DELAYS.find((d) => d.id === id);

test('train stats use only the first part of the window', () => {
  const start = 1_000_000, split = start + 45 * DAY;
  const raw = {
    profile: { address: '0xa' }, window: { start, end: start + 90 * DAY },
    pnl: [{ t: start - DAY, p: 0 }, { t: start + 10 * DAY, p: 500 }, { t: split - 1, p: 1000 }, { t: split + 10 * DAY, p: -99999 }],
    activity: [{ type: 'TRADE', timestamp: start + DAY }, { type: 'TRADE', timestamp: split + DAY }],
  };
  const s = trainStats(raw, split);
  assert.equal(s.trainPnl, 1000); // the later crash is invisible to the ranking
  assert.equal(s.trainTrades, 1);
  assert.equal(s.source, 'polymarket');
});

test('wallet selection: top, slow-only and bottom', () => {
  const stats = [
    { address: 'a', trainPnl: 500, trainTrades: 10, tradesPerDay: 100 },
    { address: 'b', trainPnl: 300, trainTrades: 10, tradesPerDay: 5 },
    { address: 'c', trainPnl: -200, trainTrades: 10, tradesPerDay: 5 },
    { address: 'd', trainPnl: null, trainTrades: 10, tradesPerDay: 5 },
  ];
  assert.deepEqual([...selectWallets(stats, { top: 1 })], ['a']);
  assert.deepEqual([...selectWallets(stats, { top: 5, maxTradesPerDay: 20 })], ['b']);
  assert.deepEqual([...selectWallets(stats, { bottom: 5 })], ['c']);
  assert.equal(selectWallets(stats, { all: true }).size, 4);
});

test('signals: one per wallet+outcome per day, minimum size enforced', () => {
  const buys = [0, 60, 120, DAY + 10].map((dt) => ({ wallet: 'a', t: 1000 + dt, asset: 'x', usd: 600, price: 0.5 }));
  buys.push({ wallet: 'a', t: 2000, asset: 'y', usd: 100, price: 0.5 });
  const sigs = buildSignals(buys, S('top20'), new Set(['a']));
  assert.equal(sigs.length, 2);
  assert.ok(sigs.every((s) => s.asset === 'x'));
});

test('consensus fires once when the 3rd distinct wallet buys within 24h', () => {
  const b = (wallet, t) => ({ wallet, t, asset: 'x', usd: 1000, price: 0.4 });
  const buys = [b('a', 0), b('a', 100), b('b', 3600), b('c', 7200), b('d', 9000), b('e', 10 * DAY)];
  const sigs = buildSignals(buys, S('consensus'), new Set(['a', 'b', 'c', 'd', 'e']));
  assert.equal(sigs.length, 1);
  assert.equal(sigs[0].t, 7200);
  assert.deepEqual(sigs[0].wallets.sort(), ['a', 'b', 'c']);
});

test('simulation: delays, slippage, fading and skips', () => {
  const hist = [{ t: 0, p: 0.4 }, { t: 1800, p: 0.5 }, { t: 7200, p: 0.6 }, { t: 30000, p: 0.9 }];
  const prices = new Map([['x', hist]]);
  const outcomes = new Map([['x', { value: 1, resolved: true }]]);
  const sig = { t: 0, asset: 'x', price: 0.4 };
  const now = simulate(sig, D('0'), prices, outcomes);
  assert.ok(Math.abs(now.entry - 0.41) < 1e-9);
  assert.ok(Math.abs(now.pnl - 100 * (1 / 0.41 - 1)) < 1e-9);
  const later = simulate(sig, D('30m'), prices, outcomes);
  assert.ok(Math.abs(later.entry - 0.51) < 1e-9);
  const fade = simulate({ ...sig, fade: true }, D('0'), prices, outcomes);
  assert.ok(Math.abs(fade.entry - 0.61) < 1e-9);
  assert.equal(fade.pnl, -100);
  assert.equal(simulate(sig, D('24h'), prices, outcomes).skip, 'already resolved');
  assert.equal(simulate({ ...sig, asset: 'nope' }, D('2h'), prices, outcomes).skip, 'no price');
  const fine = new Map([['x|0', [{ t: 0, p: 0.4 }, { t: 60, p: 0.42 }, { t: 120, p: 0.43 }, { t: 300, p: 0.45 }]]]);
  assert.ok(Math.abs(simulate(sig, D('1m'), prices, outcomes, { fine }).entry - 0.43) < 1e-9);
  assert.ok(Math.abs(simulate(sig, D('5m'), prices, outcomes, { fine }).entry - 0.46) < 1e-9);
  assert.equal(simulate(sig, D('1m'), prices, outcomes).skip, 'no price', 'no silent fallback to coarse prices');
  assert.equal(priceAfter(hist, 7000), 0.6);
  assert.equal(priceAfter(hist, 40000), null);
});

test('bootstrap interval brackets the point estimate', () => {
  const trades = Array.from({ length: 200 }, (_, i) => ({ pnl: i % 3 === 0 ? 50 : -10, stake: 100 }));
  const roi = trades.reduce((s, t) => s + t.pnl, 0) / (100 * trades.length);
  const [lo, hi] = bootstrapRoi(trades);
  assert.ok(lo <= roi && roi <= hi);
  assert.equal(bootstrapRoi(trades.slice(0, 3)), null);
});

test('runner: fetches prices and resolutions and scores every strategy', async () => {
  const now = Math.floor(Date.now() / 1000);
  const start = now - 90 * DAY, split = start + 45 * DAY;
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'pmbt-'));
  await fs.mkdir(path.join(dir, 'raw'));
  // 6 wallets: odd ones were good in the first half and keep buying the winning token "w".
  for (let i = 1; i <= 6; i++) {
    const good = i % 2 === 1;
    const address = `0x${String(i).padStart(40, '0')}`;
    const activity = [];
    for (let d = 46; d < 88; d += 3) activity.push({ type: 'TRADE', side: 'BUY', timestamp: start + d * DAY + i * 600, asset: good ? 'w' : 'l', conditionId: '0xc', outcome: good ? 'Yes' : 'No', price: 0.5, usdcSize: 2000, title: 'Test market', slug: 't' });
    activity.push({ type: 'TRADE', side: 'BUY', timestamp: start + DAY, asset: 'w', price: 0.5, usdcSize: 10 });
    await fs.writeFile(path.join(dir, 'raw', `${address}.json`), JSON.stringify({
      profile: { address, name: `w${i}` }, window: { start, end: now, days: 90 },
      pnl: [{ t: start - DAY, p: 0 }, { t: split - DAY, p: good ? 10000 : -10000 }, { t: now, p: 0 }],
      activity, closed: [], open: [],
    }));
  }
  const server = http.createServer((req, res) => {
    const u = new URL(req.url, 'http://x');
    const send = (j) => res.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify(j));
    if (u.pathname === '/prices-history') {
      const a = +u.searchParams.get('startTs'), b = +u.searchParams.get('endTs');
      const h = []; for (let t = a; t < b; t += 1800) h.push({ t, p: u.searchParams.get('market') === 'w' ? 0.5 : 0.5 });
      return send({ history: h });
    }
    if (u.pathname === '/markets') return send(u.searchParams.get('closed') === 'true' ? [{ conditionId: '0xc', closed: true, clobTokenIds: '["w","l"]', outcomePrices: '["1","0"]' }] : []);
    res.writeHead(404).end();
  });
  await new Promise((r) => server.listen(0, r));
  const base = `http://127.0.0.1:${server.address().port}`;
  process.env.PM_CLOB_API = base; process.env.PM_GAMMA_API = base;
  try {
    const { backtest } = await import('../src/backtest-run.js');
    const r = await backtest({ dataDir: dir, log: () => {} });
    const by = Object.fromEntries(r.strategies.map((s) => [s.id, s]));
    assert.equal(by.top20.walletCount, 3);
    assert.ok(by.top20.byDelay['0'].n > 0 && by.top20.byDelay['0'].roi > 0.9, 'followed winners make ~+96%');
    assert.ok(by.fade20.byDelay['2h'].roi > 0.9, 'fading losers who back the losing side also wins');
    assert.equal(by.consensus.byDelay['0'].n, 5, 'one consensus entry per outcome per 7 days (days 46, 55, 64, 73, 82)');
    assert.equal(r.coverage.resolvedFromMarket, 2);
  } finally {
    server.close();
    await fs.rm(dir, { recursive: true, force: true });
  }
});
