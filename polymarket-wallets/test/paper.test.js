import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fillFromBook, decide, emptyState, summarizePaper, stakeFor, ensureBooks, bookCheck, PAPER_BOOKS, typicalBuy, recordError, pctStake, bookEquity, splitBook, isEsports, PAPER_STRATEGIES, parseGameStart } from '../src/paper.js';

test('fills walk the order book', () => {
  const asks = [{ price: 0.5, size: 10 }, { price: 0.6, size: 100 }];
  const f = fillFromBook(asks, 20); // $5 at 50¢ (10 shares) + $15 at 60¢ (25 shares)
  assert.ok(Math.abs(f.shares - 35) < 1e-9);
  assert.ok(Math.abs(f.avg - 20 / 35) < 1e-9);
  assert.equal(fillFromBook([{ price: 0.5, size: 1 }], 20), null, 'thin book is refused');
});

const watch = {
  top20: [{ address: 'a' }], slow20: [{ address: 'a' }],
  consensus: [{ address: 'a' }, { address: 'b' }, { address: 'c' }, { address: 'd' }],
  consensus4: [{ address: 'a' }, { address: 'b' }, { address: 'c' }, { address: 'd' }],
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

test('decide: consensus needs 3 distinct wallets in 24h, consensus 4+ needs 4', () => {
  const st = emptyState(20);
  const fires = (w, t) => decide(st, buy(w, t), watch).map((x) => x.strategy);
  assert.ok(!fires('a', 0).includes('consensus'));
  assert.ok(!fires('b', 600).includes('consensus'));
  const third = fires('c', 1200);
  assert.ok(third.includes('consensus') && !third.includes('consensus4'));
  assert.ok(fires('d', 1800).includes('consensus4'));
});

test('one bet per game and no favourites above 85 cents', () => {
  const st = emptyState(20);
  ensureBooks(st, 500);
  st.positions.push({ book: 'consensus', strategy: 'consensus', status: 'open', conditionId: 'spread-4.5', eventSlug: 'nba-tor-lac', cost: 20, shares: 40 });
  assert.equal(bookCheck(st, 'consensus', 'spread-5.5', '2026-01-01', 20, { event: 'nba-tor-lac' }), 'already on this game');
  assert.equal(bookCheck(st, 'consensus', 'other', '2026-01-01', 20, { event: 'nfl-chi-sea' }), null);
  assert.equal(bookCheck(st, 'consensus-sized', 'spread-5.5', '2026-01-01', 20, { event: 'nba-tor-lac' }), null, 'per book');
  assert.equal(PAPER_BOOKS.includes('fade20'), false, 'fade the bottom 20 is retired');
  assert.equal(PAPER_BOOKS.includes('consensus4-sized'), true);
});

test('retired books with bets stay in the summary', () => {
  const st = emptyState(20);
  st.books = { fade20: { start: 500, cash: 480 } };
  st.positions.push({ book: 'fade20', strategy: 'fade20', status: 'lost', cost: 20, shares: 30, exit: 0, pnl: -20, entry: 0.6, theirPrice: 0.4, lagSec: 5 });
  ensureBooks(st, 500);
  const sum = summarizePaper(st);
  assert.equal(sum.fade20.retired, true);
  assert.equal(sum.fade20.equity, 480);
  assert.equal(sum.consensus4.retired, false);
});

test('agent loop: detects a new buy, prices it from the book, settles it', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'pmpaper-'));
  await fs.writeFile(path.join(dir, 'watchlist.json'), JSON.stringify({ strategies: { top20: [{ address: '0xa' }], slow20: [], consensus: [], consensus4: [] } }));
  const start = Math.floor(Date.now() / 1000);
  let polls = 0;
  const server = http.createServer((req, res) => {
    const u = new URL(req.url, 'http://x');
    const send = (j) => res.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify(j));
    if (u.pathname === '/activity') return res.writeHead(410).end('{"error":"Data API v1 has been retired"}');
    if (u.pathname === '/v2/activity') {
      // Data API v2 shape: {data:[snake_case items], pagination}.
      const since = +u.searchParams.get('start');
      const v2 = (items) => send({ data: items, pagination: { has_more: false, next_cursor: null } });
      if (since < start - 86400) return v2([1, 2, 3].map((k) => ({ type: 'TRADE', side: 'BUY', timestamp: start - k * 86400, token_id: 'old', price: 0.5, usdc_size: 1000 }))); // 30-day history: typical $1,000
      polls++;
      const t = start + 30; // ahead of the agent's start, however slow the machine, so it counts as new
      return v2(t >= since ? [{ type: 'TRADE', side: 'BUY', timestamp: t, token_id: 'yes1', condition_id: 'c9', event_slug: 'ev9', outcome: 'Yes', title: 'Test market', price: 0.4, usdc_size: 5000 }] : []);
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
    assert.equal(top.length, 1, 'one bet despite repeated polls');
    assert.equal(top[0].status, 'won');
    assert.ok(Math.abs(top[0].pnl - (20 / 0.45 - 20)) < 1e-6);
    assert.equal(topSized.length, 1);
    assert.equal(topSized[0].cost, 50, '$5,000 vs a typical $1,000 buy -> capped at $50');
    const sum = summarizePaper(state);
    assert.equal(sum.top20.won, 1);
    assert.ok(Math.abs(sum.top20.equity - (500 + 20 / 0.45 - 20)) < 1e-6, 'winnings paid back into the $500 wallet');
    const saved = JSON.parse(await fs.readFile(path.join(dir, 'paper', 'state.json'), 'utf8'));
    assert.equal(saved.positions.length, 2, 'state persisted (flat + sized)');
  } finally {
    server.close();
    await fs.rm(dir, { recursive: true, force: true });
  }
});

test('errors are kept with counts, addresses masked, at most 8 distinct', () => {
  const st = emptyState(20);
  recordError(st, 'poll', new Error('GET https://x/activity?user=0x' + 'a'.repeat(40) + ' -> HTTP 403 blocked'));
  recordError(st, 'poll', new Error('GET https://x/activity?user=0x' + 'b'.repeat(40) + ' -> HTTP 403 blocked'));
  const keys = Object.keys(st.errors);
  assert.equal(keys.length, 1, 'same error for different wallets is one entry');
  assert.equal(st.errors[keys[0]].count, 2);
  assert.ok(keys[0].includes('HTTP 403') && !keys[0].includes('aaaa'));
  for (let i = 0; i < 20; i++) recordError(st, 'poll', new Error(`err ${i}`));
  assert.equal(Object.keys(st.errors).length, 8);
});

test('3% of wallet: stakes follow the wallet value, with a $5 floor and 10% cap', () => {
  assert.equal(pctStake(500, 500, 0.03), 15);
  assert.equal(pctStake(1000, 1000, 0.03), 30, 'grows with the wallet');
  assert.equal(pctStake(400, 400, 0.03), 12, 'shrinks after losses');
  assert.equal(pctStake(100, 100, 0.03), 5, 'never below $5');
  assert.equal(pctStake(1000, 8, 0.03), 8, 'never more than the cash');
  assert.equal(pctStake(1000, 1000, 0.2), 100, 'at most 10% of the wallet');
  assert.ok(PAPER_BOOKS.includes('consensus-pct') && PAPER_BOOKS.includes('consensus4-pct'));
  assert.ok(!PAPER_BOOKS.includes('top20-pct'), 'only consensus strategies get a % version');
  assert.deepEqual(splitBook('consensus4-pct'), { strategy: 'consensus4', sizing: 'pct' });
  const st = emptyState(20);
  ensureBooks(st, 500);
  st.books['consensus-pct'].cash = 470;
  st.positions.push({ book: 'consensus-pct', status: 'open', cost: 30, shares: 60, mark: 0.75 });
  assert.equal(bookEquity(st, 'consensus-pct'), 470 + 45, 'cash plus open bets at their latest price');
});

test('experiment books: no esports, fast consensus, limit bids; each is flat $20 only', () => {
  for (const b of ['consensus-noesports', 'consensus-limit', 'consensus-fast']) assert.ok(PAPER_BOOKS.includes(b), b);
  assert.ok(!PAPER_BOOKS.includes('consensus-limit-sized') && !PAPER_BOOKS.includes('consensus-fast-pct'), 'flat only');
  assert.deepEqual(splitBook('consensus-noesports'), { strategy: 'consensus-noesports', sizing: 'flat' });
  assert.ok(isEsports({ title: 'Counter-Strike: FURIA vs FaZe - Map 1 Winner' }));
  assert.ok(isEsports({ title: 'Total Kills Over/Under 24.5 in Game 1?', eventSlug: 'lol-dk-blg-2026-11-03' }));
  assert.ok(!isEsports({ title: 'Rolex Paris Masters: Arthur Fils vs Taylor Fritz', eventSlug: 'atp-fils-fritz-2026-11-03' }));

  // Wallets 1 hour apart: plain consensus (24h window) fires, the 1-hour version does not.
  const st = emptyState(20);
  const fires = (w, t, extra) => decide(st, buy(w, t, extra), watch).map((x) => x.strategy);
  fires('a', 0); fires('b', 3600);
  const third = fires('c', 7200);
  assert.ok(third.includes('consensus') && third.includes('consensus-noesports') && third.includes('consensus-limit'));
  assert.ok(!third.includes('consensus-fast'), 'needs all 3 within 1 hour');
  assert.ok(fires('d', 7300).includes('consensus4'), 'the short window does not drop buyers the 24h strategies still need');

  // Esports never counts for the no-esports book.
  const st2 = emptyState(20);
  const esp = { asset: 'tokE', conditionId: 'cE', eventSlug: 'cs2-furia-faze-2026-11-02', title: 'Counter-Strike: FURIA vs FaZe (BO3)' };
  const f2 = ['a', 'b', 'c'].map((w, i) => decide(st2, buy(w, i * 60, esp), watch).map((x) => x.strategy)).at(-1);
  assert.ok(f2.includes('consensus') && !f2.includes('consensus-noesports'));
  assert.ok(st2.skipped['consensus-noesports: esports'] >= 3);
  assert.ok(PAPER_STRATEGIES.indexOf('consensus') < PAPER_STRATEGIES.indexOf('consensus-fast'));
});

test('agent loop: limit book bids at their price, fills only when the asks come down to it', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'pmlimit-'));
  const wallets = ['0xa', '0xb', '0xc'];
  await fs.writeFile(path.join(dir, 'watchlist.json'), JSON.stringify({ strategies: { top20: [], slow20: [], consensus: wallets.map((address) => ({ address })), consensus4: [] } }));
  const start = Math.floor(Date.now() / 1000);
  let ask = '0.45';
  const server = http.createServer((req, res) => {
    const u = new URL(req.url, 'http://x');
    const send = (j) => res.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify(j));
    if (u.pathname === '/v2/activity') {
      const since = +u.searchParams.get('start');
      const i = wallets.indexOf(u.searchParams.get('user'));
      const t = start + 30 + i;
      const items = since > start - 86400 && t >= since ? [{ type: 'TRADE', side: 'BUY', timestamp: t, token_id: 'yes1', condition_id: 'c9', event_slug: 'ev9', outcome: 'Yes', title: 'Test market', price: 0.4, usdc_size: 2000 }] : [];
      return send({ data: items, pagination: { has_more: false, next_cursor: null } });
    }
    if (u.pathname === '/book') return send({ asks: [{ price: ask, size: '1000' }], bids: [] });
    if (u.pathname === '/markets') return send([{ conditionId: 'c9', closed: false, clobTokenIds: '["yes1","no1"]', outcomes: '["Yes","No"]', outcomePrices: '["0.5","0.5"]', gameStartTime: '2020-01-01 00:00:00+00' }]);
    if (u.pathname === '/midpoint') return send({ mid: '0.5' });
    res.writeHead(404).end();
  });
  await new Promise((r) => server.listen(0, r));
  const base = `http://127.0.0.1:${server.address().port}`;
  Object.assign(process.env, { PM_DATA_API: base, PM_CLOB_API: base, PM_GAMMA_API: base });
  try {
    const { runPaper } = await import('../src/paper.js');
    const run = () => runPaper({ dataDir: dir, minutes: 0.01, pollSec: 1, settleEveryMin: 0, log: () => {} });
    let state = await run();
    const plain = state.positions.filter((p) => p.book === 'consensus');
    assert.equal(plain.length, 1, 'plain consensus takes the 45c ask');
    assert.ok(Math.abs(plain[0].entry - 0.45) < 1e-9);
    assert.equal(plain[0].gameStart, Date.UTC(2020, 0, 1) / 1000, 'game start recorded on the bet');
    assert.equal(plain[0].inPlay, true);
    assert.equal(state.positions.filter((p) => p.book === 'consensus-pregame').length, 0, 'pre-game book skips a game in progress');
    assert.equal(state.skipped['consensus-pregame: game already started'], 1);
    assert.equal(state.positions.filter((p) => p.book === 'consensus-limit').length, 0, 'no fill above their 40c');
    assert.equal(state.pending.length, 1, 'bid waits');
    assert.equal(summarizePaper(state)['consensus-limit'].waiting, 1);
    assert.equal(bookCheck(state, 'consensus-limit', 'c9', '2026-01-01', 20), 'bid already waiting');

    // An expired bid elsewhere is cancelled; ours fills once the ask drops to 40c.
    const file = path.join(dir, 'paper', 'state.json');
    const saved = JSON.parse(await fs.readFile(file, 'utf8'));
    saved.pending.push({ ...saved.pending[0], token: 'zz', conditionId: 'cz', eventSlug: 'evz', limit: 0.3, expiresAt: start - 1 });
    await fs.writeFile(file, JSON.stringify(saved));
    ask = '0.40';
    state = await run();
    const lim = state.positions.filter((p) => p.book === 'consensus-limit');
    assert.equal(lim.length, 1);
    assert.ok(Math.abs(lim[0].entry - 0.4) < 1e-9 && lim[0].limit === 0.4);
    assert.equal(state.pending.length, 0, 'filled and expired bids are both gone');
    assert.equal(state.skipped['consensus-limit: bid not filled'], 1);
    assert.ok(Math.abs(state.books['consensus-limit'].cash - 480) < 1e-9);
  } finally {
    server.close();
    await fs.rm(dir, { recursive: true, force: true });
  }
});

test('game start times parse from Gamma formats', () => {
  assert.equal(parseGameStart({ gameStartTime: '2026-11-03 19:00:00+00' }), Date.UTC(2026, 10, 3, 19) / 1000);
  assert.equal(parseGameStart({ gameStartTime: '2026-11-03T19:00:00Z' }), Date.UTC(2026, 10, 3, 19) / 1000);
  assert.equal(parseGameStart({ events: [{ startTime: '2026-11-03T19:30:00Z' }] }), Date.UTC(2026, 10, 3, 19, 30) / 1000);
  assert.equal(parseGameStart({ question: 'Will X win the election?' }), null, 'non-sports market has no game time');
  assert.equal(parseGameStart({ gameStartTime: 'TBD' }), null);
  assert.ok(PAPER_BOOKS.includes('consensus-pregame') && !PAPER_BOOKS.includes('consensus-pregame-sized'));
});
