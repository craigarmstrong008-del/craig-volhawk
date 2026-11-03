// Logs what Polymarket's Data API answers for each endpoint the tool uses, to diagnose API changes.
// Usage: node src/probe.js [walletAddress]
const BASE = (process.env.PM_DATA_API || 'https://data-api.polymarket.com').replace(/\/$/, '');
const user = process.argv[2] || '0x56687bf447db6ffa42ffe2204a05edaa20f55839';
const paths = [
  '/v2', '/v2/',
  '/v2/leaderboard?timePeriod=MONTH&orderBy=PNL&limit=2',
  '/v2/leaderboard?time_period=month&order_by=pnl&limit=2',
  `/v2/activity?user=${user}&limit=2`,
  `/v2/activity?user=${user}&type=TRADE&limit=2&sortBy=TIMESTAMP&sortDirection=DESC`,
  `/v2/trades?user=${user}&limit=2`,
  `/v2/positions?user=${user}&limit=2`,
  `/v2/closed-positions?user=${user}&limit=2`,
  `/v2/value?user=${user}`,
  `/v2/user-pnl?user=${user}&interval=all&fidelity=1d`,
  `/activity?user=${user}&limit=2`,
];
for (const p of paths) {
  try {
    const res = await fetch(BASE + p, { headers: { accept: 'application/json', 'user-agent': 'polymarket-wallets/1.0' } });
    const text = await res.text();
    console.log(`PROBE ${p.replace(user, 'USER')} -> HTTP ${res.status} ${res.headers.get('content-type') || ''}\n  ${text.slice(0, 700).replace(/\s+/g, ' ')}`);
  } catch (e) {
    console.log(`PROBE ${p.replace(user, 'USER')} -> ERROR ${e.message}`);
  }
}
