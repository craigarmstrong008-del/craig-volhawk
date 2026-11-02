// Synthetic TEST data only — used to exercise the pipeline offline. Not real wallets.
export const NOW = 1_800_000_000;
const DAY = 86400;

export function makeWallet(i, { trades = 30, winBias = 0.6, start = NOW - 90 * DAY } = {}) {
  const address = `0x${String(i).padStart(40, '0')}`;
  const activity = [];
  const closed = [];
  for (let t = 0; t < trades; t++) {
    const ts = start + Math.floor(((t + 1) / (trades + 1)) * 90 * DAY);
    const price = 0.1 + ((t * 37 + i * 11) % 85) / 100;
    const size = 100 + ((t * 13 + i) % 20) * 50;
    const cid = `0xmarket${t % 7}`;
    const title = ['Will BTC close above $100k?', 'Lakers vs Celtics', 'Fed rate cut in December?', 'Who wins the 2028 election?', 'Will it rain in NYC?', 'Oscars Best Picture', 'Russia x Ukraine ceasefire?'][t % 7];
    activity.push({ type: 'TRADE', side: t % 4 === 3 ? 'SELL' : 'BUY', timestamp: ts, conditionId: cid, title, slug: `m-${t % 7}`, eventSlug: `e-${t % 7}`, outcome: t % 2 ? 'Yes' : 'No', size, price, usdcSize: size * price, transactionHash: `0x${i}-${t}`, asset: `a${t % 7}` });
    if (t % 3 === 0) {
      const win = ((t * 7 + i) % 10) / 10 < winBias;
      closed.push({ conditionId: cid, title, slug: `m-${t % 7}`, outcome: 'Yes', avgPrice: price, totalBought: size, realizedPnl: win ? size * (1 - price) : -size * price, timestamp: ts + 3600 });
      if (win) activity.push({ type: 'REDEEM', timestamp: ts + 3600, conditionId: cid, title, usdcSize: size, size, transactionHash: `0xr${i}-${t}`, asset: `a${t % 7}` });
    }
  }
  const open = [
    { conditionId: '0xshared', asset: 'sh1', title: 'Shared consensus market', slug: 'shared', eventSlug: 'shared', outcome: 'Yes', size: 1000, avgPrice: 0.4, curPrice: 0.55, currentValue: 550, cashPnl: 150 },
    { conditionId: `0xsolo${i}`, asset: `so${i}`, title: 'Solo market', outcome: 'No', size: 500, avgPrice: 0.5, curPrice: 0.5, currentValue: 250, cashPnl: 0 },
    { conditionId: '0xresolved', asset: 'rs', title: 'Resolved', outcome: 'Yes', size: 100, avgPrice: 0.5, curPrice: 1, currentValue: 100, cashPnl: 50, redeemable: true },
  ];
  return { address, activity, closed, open, value: 900 };
}

export function makeRaw(i, opts) {
  const w = makeWallet(i, opts);
  return { profile: { address: w.address, name: `tester${i}`, boards: [{ timePeriod: 'MONTH', orderBy: 'PNL', rank: i }] }, window: { start: NOW - 90 * DAY, end: NOW, days: 90 }, fetchedAt: NOW, activity: w.activity, closed: w.closed, open: w.open, value: w.value };
}
