import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fillFromBook, decide, emptyState, summarizePaper, stakeFor, ensureBooks, bookCheck, PAPER_BOOKS, typicalBuy } from '../src/paper.js';

test('fills walk the order book', () => {
  const asks = [{ price: 0.5, size: 10 }, { price: 0.6, size: 100 }];
  const f = fillFromBook(asks, 20); // $5 at 50¢ (10 shares) + $15 at 60¢ (25 shares)
  assert.ok(Math.abs(f.shares - 35) < 1e-9);
  assert.ok(Math.abs(f.avg - 20 / 35) < 1e-9);
  assert.equal(fillFromBook([{ price: 0.5, size: 1 }], 20), null, 'thin book is refused');
});

const watch = {
  top20: [{ address: 'a' }], slow20: [{ address: 'a' }],
  consensus: [{ address: 'a' }, { address: 'b' }, { address: 'c' }], fade20: [{ address: 'z' }],
};
const buy = (wallet, t, extra = {}) => ({ wallet, t, asset: 'tok1', conditionId: 'c1', outcome: 'Yes', price: 0.4, usd: 2000, ...extra });

test('decide: copies, dedupes for 24h, respects minimum size', () => {
  const st = emptyState(20);
  const w1 = decide(st, buy('a', 1000), watch).map((x) => x.strategy).sort();
  assert.deepEqual(w1, ['slow20', 'top20']);
  assert.equal(decide(st, buy('a', 2000), watch).length, 0, 'same wallet+outcome within 24h');
  assert.equal(decide(st, buy('a', 3000, { asset: 'tok2', conditionId: 'c2', usd: 100 }), watch).length, 0, 'below minimum size');
});

test('sized stakes scale with conviction: $10 at a typical trade, up to $50', () => {
  assert.equal(stakeFor('flat', 99999, 100), 20);
  assert.equal(stakeFor('sized', 1000, 1000), 10);
  assert.equal(stakeFor('sized', 500, 1000), 10, 'smaller than usual still bets the minimum');
  assert.equal(stakeFor('sized', 3000, 1000), 30);
  assert.equal(stakeFor('sized', 1e6, 1000), 50, 'capped');
  assert.equal(stakeFor('sized', 5000, undefined), 10, 'unknown typical size bets the minimum');
});

test('typical buy ignores the small fills a big order is split into', () => {
  const fills = [...Array(40)].map(() => ({ side: 'BUY', usdcSize: 15 }));
  const big = [600, 800, 1000, 1200, 5000].map((u) => ({ side: 'BUY', usdcSize: u }));
  assert.equal(typicalBuy([...fills, ...big, { side: 'SELL', usdcSize: 9000 }], 500), 1000);
  assert.equal(typicalBuy(fills, 500), null, 'no qualifying buys -> unknown (minimum stake)');
  assert.equal(stakeFor('sized', 1000, typicalBuy(big, 500)), 10, 'a typical-sized copy bets $10, not $50');
  assert.equal(stakeFor('sized', 3000, typicalBuy(big, 500)), 30);
});

test('paper wallets: $500 each, existing bets are folded in, checks per book', () => {
  const st = emptyState(20);
  st.positions.push({ strategy: 'top20', status: 'open', conditionId: 'c1', cost: 20, shares: 40 });
  st.positions.push({ strategy: 'top20', status: 'won', conditionId: 'c0', cost: 20, shares: 50, exit: 1, pnl: 30 });
  ensureBooks(st, 500);
  assert.equal(Object.keys(st.books).length, PAPER_BOOKS.length);
  assert.equal(st.books.top20.cash, 500 - 40 + 50);
  assert.equal(st.books['top20-sized'].cash, 500);
  assert.equal(bookCheck(st, 'top20', 'c1', '2026-01-01', 20), 'already holding');
  assert.equal(bookCheck(st, 'top20-sized', 'c1', '2026-01-01', 20), null, 'the sized book can still take it');
  st.daily['top20-sized|2026-01-01'] = 40;
  assert.equal(bookCheck(st, 'top20-sized', 'c9', '2026-01-01', 20), 'daily cap');
  st.books.slow20.cash = 15;
  assert.equal(bookCheck(st, 'slow20', 'c9', '2026-01-01', 20), 'out of cash');
});

test('decide: consensus needs 3 distinct wallets in 24h, fade targets the other side', () => {
  const st = emptyState(20);
  assert.ok(!decide(st, buy('a', 0), watch).some((x) => x.strategy === 'consensus'));
  assert.ok(!decide(st, buy('b', 600), watch).some((x) => x.strategy === 'consensus'));
  const c = decide(st, buy('c', 1200), watch).find((x) => x.strategy === 'consensus');
  assert.ok(c);
  assert.deepEqual(c.wallets.sort(), ['a', 'b', 'c']);
  const f = decide(emptyState(20), buy('z', 0), watch);
  assert.equal(f.length, 1);
  assert.equal(f[0].target, 'opposite');
});

test('agent loop: detects a new buy, prices it from the book, settles it', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'pmpaper-'));
  await fs.writeFile(path.join(dir, 'watchlist.json'), JSON.stringify({ strategies: { top20: [{ address: '0xa' }], slow20: [], consensus: [], fade20: [{ address: '0xa' }] } }));
  const start = Math.floor(Date.now() / 1000);
  let polls = 0;
  const server = http.createServer((req, res) => {
    const u = new URL(req.url, 'http://x');
    const send = (j) => res.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify(j));
    if (u.pathname === '/activity') {
      const since = +u.searchParams.get('start');
      if (since < start - 86400) return send([1, 2, 3].map((k) => ({ type: 'TRADE', side: 'BUY', timestamp: start - k * 86400, asset: 'old', price: 0.5, usdcSize: 1000 }))); // 30-day history: typical $1,000
      polls++;
      const t = start + 1;
      return send(t >= since ? [{ type: 'TRADE', side: 'BUY', timestamp: t, asset: 'yes1', conditionId: 'c9', outcome: 'Yes', title: 'Test market', price: 0.4, usdcSize: 5000 }] : []);
    }
    if (u.pathname === '/book') return send({ asks: [{ price: '0.45', size: '1000' }], bids: [] });
    if (u.pathname === '/markets') return send([{ conditionId: 'c9', closed: true, clobTokenIds: '["yes1","no1"]', outcomes: '["Yes","No"]', outcomePrices: '["1","0"]' }]);
    if (u.pathname === '/midpoint') return send({ mid: '0.5' });
    res.writeHead(404).end();
  });
  await new Promise((r) => server.listen(0, r));
  const base = `http://127.0.0.1:${server.address().port}`;
  Object.assign(process.env, { PM_DATA_API: base, PM_CLOB_API: base, PM_GAMMA_API: base });
  try {
    const { runPaper } = await import('../src/paper.js');
    // Two short runs on the same saved state: deterministic "repeated polls" without relying on timing.
    await runPaper({ dataDir: dir, minutes: 0.01, pollSec: 1, settleEveryMin: 0, log: () => {} });
    const state = await runPaper({ dataDir: dir, minutes: 0.01, pollSec: 1, settleEveryMin: 0, log: () => {} });
    assert.ok(polls >= 2, 'the wallet was polled again after the bet');
    const top = state.positions.filter((p) => p.book === 'top20');
    const topSized = state.positions.filter((p) => p.book === 'top20-sized');
    const fade = state.positions.filter((p) => p.book === 'fade20');
    assert.equal(top.length, 1, 'one bet despite repeated polls');
    assert.equal(top[0].status, 'won');
    assert.ok(Math.abs(top[0].pnl - (20 / 0.45 - 20)) < 1e-6);
    assert.equal(topSized.length, 1);
    assert.equal(topSized[0].cost, 50, '$5,000 vs a typical $1,000 buy -> capped at $50');
    assert.equal(fade.length, 1);
    assert.equal(fade[0].token, 'no1');
    assert.equal(fade[0].status, 'lost');
    assert.equal(fade[0].pnl, -20);
    const sum = summarizePaper(state);
    assert.equal(sum.top20.won, 1);
    assert.ok(Math.abs(sum.top20.equity - (500 + 20 / 0.45 - 20)) < 1e-6, 'winnings paid back into the $500 wallet');
    assert.equal(sum.fade20.equity, 480);
    const saved = JSON.parse(await fs.readFile(path.join(dir, 'paper', 'state.json'), 'utf8'));
    assert.equal(saved.positions.length, 4, 'state persisted (flat + sized for each strategy)');
  } finally {
    server.close();
    await fs.rm(dir, { recursive: true, force: true });
  }
});
