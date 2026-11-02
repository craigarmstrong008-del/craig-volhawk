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
  const server = http.createServer((req, res) => {
    const u = new URL(req.url, 'http://x');
    const q = Object.fromEntries(u.searchParams);
    const send = (j) => res.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify(j));
    if (u.pathname === '/v1/leaderboard') {
      if (first429) { first429 = false; res.writeHead(429, { 'retry-after': '0' }).end(); return; }
      const off = +q.offset;
      return send(wallets.slice(off, off + 50).map((w, i) => ({ rank: off + i + 1, proxyWallet: w.address, userName: `t${i}`, pnl: 1, vol: 1 })));
    }
    if (u.pathname === '/user-pnl') return send([{ t: now - 100 * 86400, p: 0 }, { t: now - 89 * 86400, p: 10 }, { t: now, p: 1234 }]);
    const w = by.get(q.user);
    if (!w) return send([]);
    if (u.pathname === '/activity') {
      seen.activityPages++;
      const list = w.activity.filter((e) => e.timestamp >= +q.start && e.timestamp <= +q.end).sort((a, b) => b.timestamp - a.timestamp);
      return send(list.slice(+q.offset, +q.offset + +q.limit));
    }
    if (u.pathname === '/closed-positions') return send([...w.closed].sort((a, b) => b.timestamp - a.timestamp).slice(+q.offset, +q.offset + +q.limit));
    if (u.pathname === '/positions') return send(w.open.slice(+q.offset, +q.offset + +q.limit));
    if (u.pathname === '/value') return send([{ user: w.address, value: w.value }]);
    res.writeHead(404).end();
  });
  await new Promise((r) => server.listen(0, r));
  process.env.PM_DATA_API = `http://127.0.0.1:${server.address().port}`;
  process.env.PM_PNL_API = process.env.PM_DATA_API;
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
    assert.ok(report.wallets.every((w) => w.pnlSource === 'polymarket' && w.totalPnl90 === 1234));
    // Cached second run makes no per-wallet requests.
    const before = seen.activityPages;
    await collect({ dataDir: dir, perBoard: 100, log: () => {} });
    assert.equal(seen.activityPages, before);
  } finally {
    server.close();
    await fs.rm(dir, { recursive: true, force: true });
  }
});
