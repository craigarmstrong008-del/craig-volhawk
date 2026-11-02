#!/usr/bin/env node
// Usage: node src/cli.js <collect|analyze|build|backtest|all|serve> [--days 90] [--per-board 100] [--concurrency 4] [--wallets file.txt] [--port 8090]
import fs from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import { collect } from './collect.js';
import { analyzeWallet, slimRaw, buildReportFrom } from './analyze.js';
import { backtest } from './backtest-run.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA = path.join(ROOT, 'data');
const DASH = path.join(ROOT, 'dashboard');

function args(argv) {
  const o = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith('--')) { const k = argv[i].slice(2); const v = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true; o[k] = v; } else o._.push(argv[i]);
  }
  return o;
}

async function runCollect(o) {
  const extra = o.wallets ? (await fs.readFile(o.wallets, 'utf8')).split(/\s+/).filter((x) => /^0x[0-9a-fA-F]{40}$/.test(x)) : [];
  return collect({ dataDir: DATA, days: Number(o.days || 90), perBoard: Number(o['per-board'] || 100), concurrency: Number(o.concurrency || 4), maxAgeHours: Number(o['max-age'] ?? 12), extraWallets: extra });
}

async function runAnalyze() {
  const rawDir = path.join(DATA, 'raw');
  const files = (await fs.readdir(rawDir).catch(() => [])).filter((f) => f.endsWith('.json'));
  if (!files.length) throw new Error('No raw wallet data. Run `npm run collect` first.');
  // One wallet at a time: full histories can be hundreds of MB in total.
  const analyses = [], slim = [];
  for (const f of files) {
    let raw = JSON.parse(await fs.readFile(path.join(rawDir, f), 'utf8'));
    analyses.push(analyzeWallet(raw));
    slim.push(slimRaw(raw));
    raw = null;
  }
  const report = buildReportFrom(analyses, slim);
  await fs.writeFile(path.join(DATA, 'report.json'), JSON.stringify(report));
  await writeCsv(report);
  const official = report.wallets.filter((w) => w.pnlSource === 'polymarket');
  console.log(`analysed ${report.wallets.length} wallets → data/report.json, data/wallets.csv`);
  console.log(`Polymarket PnL history used for ${official.length}/${report.wallets.length} wallets`);
  // Sanity check: sign agreement with Polymarket's own 30-day leaderboard.
  const month = report.wallets.map((w) => ({ w, b: w.boards.find((b) => b.timePeriod === 'MONTH' && b.orderBy === 'PNL') })).filter((x) => x.b);
  const last30 = (w) => w.equity.slice(-30).reduce((a, e) => a + e.pnl, 0);
  const agree = month.filter(({ w, b }) => (b.pnl > 0) === (last30(w) > 0)).length;
  console.log(`last-30-day PnL sign matches Polymarket's monthly board for ${agree}/${month.length} wallets`);
  month.slice(0, 8).forEach(({ w, b }) => console.log(`  ${(w.name || w.address).slice(0, 20).padEnd(20)} board ${Math.round(b.pnl)}  ours(30d) ${Math.round(last30(w))}  source ${w.pnlSource}`));
  return report;
}

async function writeCsv(report) {
  const cols = ['rank', 'score', 'address', 'name', 'totalPnl90', 'pnlSource', 'positionPnl90', 'realizedPnl', 'unrealizedPnl', 'volume', 'trades', 'closedCount', 'winRate', 'profitFactor', 'roi', 'sharpe', 'maxDrawdown', 'avgTrade', 'avgBuyPrice', 'uniqueMarkets', 'portfolioValue', 'archetypes'];
  const esc = (v) => { const s = Array.isArray(v) ? v.join('; ') : v == null ? '' : String(v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  const lines = [cols.join(','), ...report.wallets.map((w) => cols.map((c) => esc(w[c])).join(','))];
  await fs.writeFile(path.join(DATA, 'wallets.csv'), lines.join('\n') + '\n');
}

async function runBacktest(o) {
  const res = await backtest({ dataDir: DATA, trainDays: Number(o['train-days'] || 45), maxAssets: Number(o['max-assets'] || 6000) });
  const json = JSON.stringify(res);
  await fs.writeFile(path.join(DATA, 'backtest.json'), json);
  await fs.writeFile(path.join(DASH, 'backtest.js'), `window.BACKTEST = ${json};\n`);
  const pct = (x) => `${(x * 100).toFixed(1)}%`.padStart(7);
  console.log(`\nReturn on stake by entry delay (n = bets):`);
  console.log('strategy'.padEnd(30) + res.delays.map((d) => d.id.padStart(16)).join(''));
  for (const s of res.strategies) console.log(s.name.slice(0, 29).padEnd(30) + res.delays.map((d) => { const r = s.byDelay[d.id]; return `${pct(r.roi)} n=${String(r.n).padEnd(5)}`.padStart(16); }).join(''));
  console.log('\nwrote data/backtest.json and dashboard/backtest.js');
}

async function runBuild() {
  const report = await fs.readFile(path.join(DATA, 'report.json'), 'utf8').catch(() => null);
  if (!report) throw new Error('No data/report.json. Run `npm run analyze` first.');
  await fs.writeFile(path.join(DASH, 'report.js'), `window.REPORT = ${report};\n`);
  console.log('dashboard/report.js written — open dashboard/index.html');
}

function serve(port) {
  const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json' };
  http.createServer(async (req, res) => {
    const rel = decodeURIComponent(new URL(req.url, 'http://x').pathname).replace(/^\/+/, '') || 'index.html';
    const file = path.join(DASH, rel);
    if (!file.startsWith(DASH)) { res.writeHead(403).end(); return; }
    try { res.writeHead(200, { 'content-type': types[path.extname(file)] || 'application/octet-stream' }).end(await fs.readFile(file)); }
    catch { res.writeHead(404).end('not found'); }
  }).listen(port, () => console.log(`dashboard on http://localhost:${port}`));
}

const o = args(process.argv.slice(2));
const cmd = o._[0] || 'all';
try {
  if (cmd === 'collect') await runCollect(o);
  else if (cmd === 'analyze') await runAnalyze();
  else if (cmd === 'build') await runBuild();
  else if (cmd === 'backtest') await runBacktest(o);
  else if (cmd === 'all') { await runCollect(o); await runAnalyze(); await runBuild(); }
  else if (cmd === 'serve') serve(Number(o.port || 8090));
  else throw new Error(`unknown command ${cmd}`);
} catch (err) {
  console.error(err.message);
  process.exit(1);
}
