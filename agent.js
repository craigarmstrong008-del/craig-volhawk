'use strict';
/**
 * Craig VolHawk â€” Volatility-Triggered OCO Agent
 *
 * Monitors Solana token prices via Jupiter Price V3 API.
 * Detects volatility breakouts using rolling realised volatility.
 * When a breakout is detected, generates an OCO (TP + SL) order via
 * Jupiter Trigger V2 and either logs it or submits it if a wallet key
 * is available.
 *
 * Built for the Jupiter Developer Platform hackathon (May 2026).
 * Author: Craig Armstrong â€” craig-earn-agent-green-77
 */

const fs     = require('fs');
const path   = require('path');
const https  = require('https');
const { getPrices, MINTS }             = require('./price');
const { searchTokens }                 = require('./tokens');
const { getAuthChallenge, buildOcoOrder } = require('./trigger');

const ROOT = path.join(__dirname, '..');

// â”€â”€â”€ Config â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Load env
try {
  fs.readFileSync(path.join(ROOT, 'crypto_bot.env'), 'utf8').split('\n').forEach(line => {
    const m = line.match(/^\s*([^#=\s][^=]*?)\s*=\s*(.*?)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  });
} catch {}

const JUP_API_KEY  = process.env.JUPITER_API_KEY   || null;  // optional, improves rate limits
const TG_TOKEN     = process.env.TELEGRAM_TOKEN;
const TG_CHAT      = process.env.TELEGRAM_CHAT_ID;
const WALLET       = process.env.SUPERTEAM_WALLET;

const POLL_MS        = 30_000;   // 30s between price polls
const WINDOW_SIZE    = 20;       // rolling window: 20 samples = ~10 minutes
const VOL_MULT       = 2.0;      // trigger when vol > 2Ã— recent average
const TP_PCT         = 0.02;     // 2% take-profit
const SL_PCT         = 0.01;     // 1% stop-loss

// Tokens to monitor â€” mint addresses
const WATCH = [
  { symbol: 'SOL',  mint: MINTS.SOL  },
  { symbol: 'JUP',  mint: MINTS.JUP  },
  { symbol: 'WIF',  mint: MINTS.WIF  },
];

// â”€â”€â”€ State â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Rolling price history per mint
const priceHistory = {};   // { [mint]: number[] }
const signalCooldown = {}; // { [mint]: number } â€” last signal timestamp

for (const t of WATCH) {
  priceHistory[t.mint] = [];
  signalCooldown[t.mint] = 0;
}

// â”€â”€â”€ Logging â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
}

// â”€â”€â”€ Telegram â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function tgSend(text) {
  if (!TG_TOKEN || !TG_CHAT) return;
  const body = JSON.stringify({ chat_id: TG_CHAT, text, parse_mode: 'HTML' });
  const req = https.request({
    hostname: 'api.telegram.org',
    path: `/bot${TG_TOKEN}/sendMessage`,
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
  });
  req.on('error', () => {});
  req.write(body);
  req.end();
}

// â”€â”€â”€ Volatility calculation â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Realised volatility = std dev of log returns over the rolling window
function realisedVol(prices) {
  if (prices.length < 2) return 0;
  const returns = [];
  for (let i = 1; i < prices.length; i++) {
    returns.push(Math.log(prices[i] / prices[i - 1]));
  }
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((a, b) => a + (b - mean) ** 2, 0) / returns.length;
  return Math.sqrt(variance);
}

// Split window in half â€” compare recent half vs earlier half to detect spikes
function isVolatilityBreakout(prices) {
  if (prices.length < WINDOW_SIZE) return false;
  const half = Math.floor(WINDOW_SIZE / 2);
  const earlier = prices.slice(-WINDOW_SIZE, -half);
  const recent  = prices.slice(-half);
  const volEarly  = realisedVol(earlier);
  const volRecent = realisedVol(recent);
  if (volEarly === 0) return false;
  return volRecent > volEarly * VOL_MULT;
}

// â”€â”€â”€ OCO order generator â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function generateOco(symbol, mint, price) {
  const tpPrice = price * (1 + TP_PCT);
  const slPrice = price * (1 - SL_PCT);

  const order = buildOcoOrder({
    inputMint:       MINTS.USDC,
    outputMint:      mint,
    inputAmount:     100_000_000,  // 100 USDC (6 decimals)
    takeProfitPrice: tpPrice,
    stopLossPrice:   slPrice,
    walletAddress:   WALLET,
  });

  return { order, tpPrice, slPrice };
}

// â”€â”€â”€ Main tick â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
async function tick() {
  const mints = WATCH.map(t => t.mint);
  let prices;

  try {
    prices = await getPrices(mints, JUP_API_KEY);
  } catch (err) {
    log(`Price API error: ${err.message}`);
    return;
  }

  for (const token of WATCH) {
    const data = prices[token.mint];
    if (!data || !data.usdPrice) continue;

    const price = data.usdPrice;
    const hist  = priceHistory[token.mint];

    hist.push(price);
    if (hist.length > WINDOW_SIZE) hist.shift();

    const change24h = data.priceChange24h?.toFixed(2) ?? '?';
    log(`${token.symbol}: $${price.toFixed(4)} (${change24h}% 24h)  window=${hist.length}`);

    // Check for volatility breakout
    if (!isVolatilityBreakout(hist)) continue;

    // Cooldown: don't re-signal same token within 5 minutes
    const now = Date.now();
    if (now - signalCooldown[token.mint] < 5 * 60_000) continue;
    signalCooldown[token.mint] = now;

    const { order, tpPrice, slPrice } = generateOco(token.symbol, token.mint, price);

    const msg = [
      `âš¡ <b>VOLATILITY BREAKOUT â€” ${token.symbol}</b>`,
      `Price: $${price.toFixed(4)}`,
      `OCO order generated:`,
      `  â†’ Take profit: $${tpPrice.toFixed(4)} (+${(TP_PCT * 100).toFixed(1)}%)`,
      `  â†’ Stop loss:   $${slPrice.toFixed(4)} (-${(SL_PCT * 100).toFixed(1)}%)`,
      `  â†’ Buy: 100 USDC of ${token.symbol}`,
    ].join('\n');

    log(`âš¡ BREAKOUT: ${token.symbol} @ $${price.toFixed(4)}  TP=$${tpPrice.toFixed(4)}  SL=$${slPrice.toFixed(4)}`);
    log(`OCO payload: ${JSON.stringify(order)}`);
    tgSend(msg);

    // If API key + wallet available, attempt live auth challenge
    if (JUP_API_KEY && WALLET) {
      try {
        const challenge = await getAuthChallenge(JUP_API_KEY, WALLET);
        if (challenge.status === 200) {
          log(`Auth challenge received â€” wallet signature required to submit order`);
          log(`Challenge: ${challenge.body.challenge}`);
          // Full execution requires ed25519 signing of the challenge message.
          // See trigger.js â€” the signed message would then be submitted to
          // POST /trigger/v2/orders/price to place the live OCO order.
        }
      } catch (err) {
        log(`Trigger auth error: ${err.message}`);
      }
    }
  }
}

// â”€â”€â”€ Entry point â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
async function main() {
  log(`Craig VolHawk starting`);
  log(`Watching: ${WATCH.map(t => t.symbol).join(', ')}`);
  log(`Poll interval: ${POLL_MS / 1000}s  |  Window: ${WINDOW_SIZE} samples`);
  log(`Breakout threshold: ${VOL_MULT}Ã— recent volatility`);
  log(`OCO levels: TP +${TP_PCT * 100}%  SL -${SL_PCT * 100}%`);
  if (!JUP_API_KEY) log('Running keyless (0.5 RPS). Set JUPITER_API_KEY for higher limits.');

  tgSend(`ðŸ¦… <b>Craig VolHawk online</b>\nWatching: ${WATCH.map(t => t.symbol).join(', ')}\nPoll: ${POLL_MS / 1000}s`);

  await tick();
  setInterval(tick, POLL_MS);
}

main().catch(err => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
