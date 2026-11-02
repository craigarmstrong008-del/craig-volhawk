// Step 1: find the top wallets and download their last-N-days history into data/raw/.
import fs from 'node:fs/promises';
import path from 'node:path';
import * as api from './api.js';
import { DAY, pool, num } from './util.js';

// Polymarket's leaderboard has no 90-day window, so candidates come from several
// boards and the real 90-day ranking is computed later from each wallet's own history.
const MAX_EVENTS = Number(process.env.PM_MAX_EVENTS || 25000);

const BOARDS = [
  { timePeriod: 'MONTH', orderBy: 'PNL' },
  { timePeriod: 'MONTH', orderBy: 'VOL' },
  { timePeriod: 'ALL', orderBy: 'PNL' },
  { timePeriod: 'WEEK', orderBy: 'PNL' },
];

export async function collect({ dataDir, days = 90, perBoard = 100, concurrency = 4, maxAgeHours = 12, extraWallets = [], log = console.log }) {
  const rawDir = path.join(dataDir, 'raw');
  await fs.mkdir(rawDir, { recursive: true });
  const end = Math.floor(Date.now() / 1000);
  const start = end - days * DAY;

  const candidates = new Map();
  for (const b of BOARDS) {
    const rows = await api.leaderboard({ ...b, total: perBoard });
    log(`leaderboard ${b.timePeriod}/${b.orderBy}: ${rows.length} wallets`);
    rows.forEach((r, i) => {
      const addr = String(r.proxyWallet || r.address || r.user || '').toLowerCase();
      if (!addr) return;
      const c = candidates.get(addr) || { address: addr, name: r.userName || r.name || '', xUsername: r.xUsername || '', verified: !!r.verifiedBadge, profileImage: r.profileImage || '', boards: [] };
      c.boards.push({ ...b, rank: num(r.rank) || i + 1, pnl: num(r.pnl), vol: num(r.vol) });
      candidates.set(addr, c);
    });
  }
  for (const w of extraWallets) {
    const addr = w.toLowerCase();
    if (!candidates.has(addr)) candidates.set(addr, { address: addr, name: '', boards: [], manual: true });
  }
  const list = [...candidates.values()];
  log(`${list.length} unique wallets to analyse (window ${days}d)`);

  let done = 0;
  const failures = [];
  await pool(list, concurrency, async (c) => {
    const file = path.join(rawDir, `${c.address}.json`);
    try {
      const st = await fs.stat(file).catch(() => null);
      if (st && Date.now() - st.mtimeMs < maxAgeHours * 3600e3) {
        const cached = JSON.parse(await fs.readFile(file, 'utf8'));
        if (cached.window?.days === days) { cached.profile = c; await fs.writeFile(file, JSON.stringify(cached)); return; }
      }
      const [pnl, activity, closed, open, value] = await Promise.all([
        api.pnlSeries(c.address).catch(() => null),
        api.activity(c.address, start, end, { maxEvents: MAX_EVENTS }),
        api.closedPositions(c.address, start),
        api.positions(c.address),
        api.portfolioValue(c.address).catch(() => 0),
      ]);
      const truncated = activity.length >= MAX_EVENTS * 0.98;
      await fs.writeFile(file, JSON.stringify({ profile: c, window: { start, end, days }, fetchedAt: end, truncated, pnl, activity, closed, open, value }));
    } catch (err) {
      failures.push({ address: c.address, error: err.message });
    } finally {
      done++;
      if (done % 10 === 0 || done === list.length) log(`  ${done}/${list.length} wallets fetched (${api.stats().requests} requests)`);
    }
  });
  if (failures.length) log(`${failures.length} wallets failed:`, failures.slice(0, 5));
  await fs.writeFile(path.join(dataDir, 'candidates.json'), JSON.stringify({ generatedAt: end, days, wallets: list, failures }, null, 2));
  return { wallets: list.length, failures };
}
