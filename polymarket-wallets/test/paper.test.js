import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fillFromBook, decide, emptyState, summarizePaper } from '../src/paper.js';

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

test('decide: copies, dedupes for 24h, respects size and daily cap', () => {
  const st = emptyState(20);
  const w1 = decide(st, buy('a', 1000), watch).map((x) => x.strategy).sort();
  assert.deepEqual(w1, ['slow20', 'top20']);
  assert.equal(decide(st, buy('a', 2000), watch).length, 0, 'same wallet+outcome within 24h');
  assert.equal(decide(st, buy('a', 3000, { asset: 'tok2', conditionId: 'c2', usd: 100 }), watch).length, 0, 'below minimum size');
  const st2 = emptyState(20);
  st2.daily['top20|1970-01-01'] = 1;
  assert.ok(!decide(st2, buy('a', 1000), watch, { maxBetsPerDay: 1 }).some((x) => x.strategy === 'top20'));
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

test('decide: no second open position on the same market', () => {
  const st = emptyState(20);
  st.positions.push({ strategy: 'top20', status: 'open', conditionId: 'c1' });
  assert.ok(!decide(st, buy('a', 1000), watch).some((x) => x.strategy === 'top20'));
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
      polls++;
      const since = +u.searchParams.get('start');
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
    const state = await runPaper({ dataDir: dir, minutes: 0.06, pollSec: 1, settleEveryMin: 0, log: () => {} });
    assert.ok(polls >= 2);
    const top = state.positions.filter((p) => p.strategy === 'top20');
    const fade = state.positions.filter((p) => p.strategy === 'fade20');
    assert.equal(top.length, 1, 'one bet despite repeated polls');
    assert.equal(top[0].status, 'won');
    assert.ok(Math.abs(top[0].pnl - (20 / 0.45 - 20)) < 1e-6);
    assert.equal(fade.length, 1);
    assert.equal(fade[0].token, 'no1');
    assert.equal(fade[0].status, 'lost');
    assert.equal(fade[0].pnl, -20);
    const sum = summarizePaper(state);
    assert.equal(sum.top20.won, 1);
    const saved = JSON.parse(await fs.readFile(path.join(dir, 'paper', 'state.json'), 'utf8'));
    assert.equal(saved.positions.length, 2, 'state persisted');
  } finally {
    server.close();
    await fs.rm(dir, { recursive: true, force: true });
  }
});
