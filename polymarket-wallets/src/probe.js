// Logs what Polymarket's Data API answers for each endpoint the tool uses, to diagnose API changes.
// Usage: node src/probe.js [walletAddress]
const BASE = (process.env.PM_DATA_API || 'https://data-api.polymarket.com').replace(/\/$/, '');
const user = process.argv[2] || '0x56687bf447db6ffa42ffe2204a05edaa20f55839';
const now = Math.floor(Date.now() / 1000);
async function hit(p, max = 1800) {
  try {
    const res = await fetch(BASE + p, { headers: { accept: 'application/json', 'user-agent': 'polymarket-wallets/1.0' } });
    const text = await res.text();
    let json = null; try { json = JSON.parse(text); } catch {}
    const items = Array.isArray(json?.data) ? json.data : null;
    const ts = items ? items.map((x) => x.timestamp ?? x.closed_at ?? x.updated_at).join(',') : '';
    console.log(`PROBE ${p.replace(user, 'USER')} -> HTTP ${res.status}${items ? ` items=${items.length} ts=[${ts}] pagination=${JSON.stringify(json.pagination)}` : ''}\n  ${text.slice(0, max).replace(/\s+/g, ' ')}`);
    return json;
  } catch (e) { console.log(`PROBE ${p} -> ERROR ${e.message}`); return null; }
}
await hit(`/v2/positions?user=${user}&limit=1`, 2500);
for (const s of ['CLOSED', 'closed', 'RESOLVED', 'ALL']) await hit(`/v2/positions?user=${user}&status=${s}&limit=2`, 2500);
await hit(`/v2/positions?user=${user}&limit=2&sortBy=TIMESTAMP&sortDirection=DESC&status=CLOSED`, 600);
await hit(`/v2/activity?user=${user}&type=TRADE&limit=1`, 2500);
await hit(`/v2/activity?user=${user}&type=TRADE&limit=3&start=${now - 6 * 86400}&end=${now - 4 * 86400}`, 300);
await hit(`/v2/activity?user=${user}&type=TRADE&limit=2&offset=2`, 300);
const first = await hit(`/v2/activity?user=${user}&type=TRADE&limit=2`, 300);
const cur = first?.pagination?.next_cursor;
if (cur) {
  await hit(`/v2/activity?user=${user}&type=TRADE&limit=2&cursor=${encodeURIComponent(cur)}`, 300);
  await hit(`/v2/activity?cursor=${encodeURIComponent(cur)}`, 300);
}
await hit(`/v2/activity?user=${user}&type=TRADE&limit=600`, 200);
await hit(`/v2/leaderboard?timePeriod=ALL&orderBy=VOL&limit=2&offset=2`, 400);
await hit(`/v2/leaderboard?timePeriod=WEEK&orderBy=PNL&limit=60`, 200);
await hit(`/v2/user-pnl?user=${user}&interval=all&fidelity=1d`, 1500);
