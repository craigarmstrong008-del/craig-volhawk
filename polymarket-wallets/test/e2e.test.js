// Runs the full collect → analyse pipeline against a local fake Data API.
import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { makeWallet } from './fixtures.js';

test('collect paginates, retries and feeds analysis', async () => {
  const now = Math.floor(Date.now() / 1000);
  const wallets = Array.from({ length: 6 }, (_, i) => makeWallet(i + 1, { trades: 1200, start: now - 90 * 86400 }));
  // Burst of same-timestamp events to exercise the offset fallback.
  wallets[0].activity.push(...Array.from({ length: 700 }, (_, k) => ({ type: 'TRADE', side: 'BUY', timestamp: now - 86400, conditionId: '0xburst', title: 'Burst', size: 1, price: 0.5, usdcSize: 0.5, transactionHash: `0xb${k}`, asset: 'b' })));
  const by = new Map(wallets.map((w) => [w.address, w]));
  let first429 = true;
  const seen = { activityPages: 0 };
  // Emulates Data API v2: {data, pagination}, snake_case fields, cursor-only paging (offset -> 400).
  const snake = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`), v]));
  const v2Activity = (e) => { const { asset, ...rest } = e; return snake({ ...rest, tokenId: asset }); };
  const v2Open = (p) => { const { asset, size, curPrice, cashPnl, ...rest } = p; return snake({ ...rest, tokenId: asset, currentSize: size, currentPrice: curPrice, unrealizedPnl: cashPnl, status: 'OPEN' }); };
  const v2Closed = (p) => { const { asset, timestamp, totalBought, ...rest } = p; return snake({ ...rest, tokenId: asset, lastEventAt: timestamp, totalSize: totalBought, currentSize: 0, status: 'CLOSED' }); };
  const page = (list, q, res) => {
    if ('offset' in q) return res.writeHead(400).end(JSON.stringify({ error: "'offset' is not a query param on this API: pages are cursor-only" }));
    const off = q.cursor ? JSON.parse(Buffer.from(q.cursor, 'base64').toString()).o : 0;
    const lim = +q.limit || 100;
    const more = off + lim < list.length;
    res.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify({
      data: list.slice(off, off + lim),
      pagination: { limit: lim, offset: off, has_more: more, next_cursor: more ? Buffer.from(JSON.stringify({ o: off + lim })).toString('base64') : null },
    }));
  };
  const server = http.createServer((req, res) => {
    const u = new URL(req.url, 'http://x');
    const q = Object.fromEntries(u.searchParams);
    const send = (j) => res.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify(j));
    if (u.pathname.startsWith('/v1/') || ['/activity', '/positions', '/closed-positions', '/value'].includes(u.pathname)) {
      return res.writeHead(410).end(JSON.stringify({ error: 'Data API v1 has been retired' }));
    }
    if (u.pathname === '/v2/leaderboard') {
      if (first429) { first429 = false; res.writeHead(429, { 'retry-after': '0' }).end(); return; }
      return page(wallets.map((w, i) => ({ rank: i + 1, user_id: w.address, user_name: `t${i}`, pnl: 1, volume: 1, verified: false })), q, res);
    }
    if (u.pathname === '/v2/user-pnl') {
      if (u.searchParams.get('interval') !== 'all') return send({ data: { interval: '1d', points: [{ timestamp: now, economic_pnl: 1 }] } });
      return send({ data: { proxy_wallet: q.user, interval: 'all', fidelity: '1d', points: [
        { timestamp: now - 100 * 86400, realized_market_pnl: 0, economic_pnl: 0 },
        { timestamp: now - 89 * 86400, realized_market_pnl: 5, economic_pnl: 10 },
        { timestamp: now, realized_market_pnl: 999, economic_pnl: 1234 },
      ] } });
    }
    const w = by.get(q.user);
    if (!w) return send({ data: [], pagination: { has_more: false } });
    if (u.pathname === '/v2/activity') {
      seen.activityPages++;
      const list = w.activity.filter((e) => (!q.start || e.timestamp >= +q.start) && (!q.end || e.timestamp <= +q.end) && (!q.type || e.type === q.type))
        .sort((x, y) => y.timestamp - x.timestamp).map(v2Activity);
      return page(list, q, res);
    }
    if (u.pathname === '/v2/positions') {
      if (q.status === 'CLOSED') return page([...w.closed].sort((x, y) => y.timestamp - x.timestamp).map(v2Closed), q, res);
      return page(w.open.map(v2Open), q, res);
    }
    if (u.pathname === '/v2/value') return send({ data: { proxy_wallet: w.address, value: w.value } });
    res.writeHead(404).end();
  });
  await new Promise((r) => server.listen(0, r));
  process.env.PM_DATA_API = `http://127.0.0.1:${server.address().port}`;
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'pmw-'));
  try {
    const { collect } = await import('../src/collect.js');
    const { buildReport } = await import('../src/analyze.js');
    const res = await collect({ dataDir: dir, perBoard: 100, log: () => {} });
    assert.equal(res.wallets, 6);
    assert.equal(res.failures.length, 0);
    const raw1 = JSON.parse(await fs.readFile(path.join(dir, 'raw', `${wallets[0].address}.json`), 'utf8'));
    const expected = wallets[0].activity.filter((e) => e.timestamp >= raw1.window.start).length;
    assert.equal(raw1.activity.length, expected, 'every activity event fetched exactly once');
    assert.ok(seen.activityPages > 6, 'activity was paginated');
    const raws = await Promise.all((await fs.readdir(path.join(dir, 'raw'))).map(async (f) => JSON.parse(await fs.readFile(path.join(dir, 'raw', f), 'utf8'))));
    const report = buildReport(raws);
    assert.equal(report.wallets.length, 6);
    assert.equal(report.consensus[0].holderCount, 6);
    assert.ok(report.wallets.every((w) => w.pnlSource === 'polymarket' && w.totalPnl90 === 1234), 'uses economic_pnl, not realized_market_pnl');
    // Cached second run makes no per-wallet requests.
    const before = seen.activityPages;
    await collect({ dataDir: dir, perBoard: 100, log: () => {} });
    assert.equal(seen.activityPages, before);
  } finally {
    server.close();
    await fs.rm(dir, { recursive: true, force: true });
  }
});
