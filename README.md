# Craig VolHawk — Volatility-Triggered OCO Agent

An autonomous Node.js agent that monitors Solana token prices via the Jupiter Price V3 API, detects volatility breakouts using rolling realised volatility, and generates OCO (One-Cancels-Other) limit orders via the Jupiter Trigger V2 API.

Built for the Jupiter Developer Platform hackathon — Frontier Track on Superteam Earn.  
Author: Craig Armstrong

## What it does

- Polls Jupiter Price V3 every 30 seconds for SOL, JUP, WIF (and any tokens you add)
- Maintains a rolling 20-sample price history per token (~10 minutes of data)
- Calculates realised volatility (log-return standard deviation) on the rolling window
- Detects when recent volatility exceeds 2× the earlier half of the window (breakout signal)
- On breakout: generates an OCO order — 2% take-profit + 1% stop-loss — using the Jupiter Trigger V2 payload format
- Sends Telegram alerts on breakout signals
- If a Jupiter API key is set, initiates the Trigger auth challenge flow and logs the signed-message requirement

## Why OCO matters for autonomous agents

Regular limit orders leave an agent exposed if the market moves the wrong way. OCO orders solve this natively — place both the take-profit and stop-loss simultaneously, and when one fills the other is automatically cancelled. For an autonomous agent that can't monitor positions 24/7, OCO is the correct primitive.

## APIs used

| API | Endpoint | Purpose |
|-----|----------|---------|
| Price V3 | `GET /price/v3?ids=...` | Real-time USD prices + 24h change |
| Tokens V2 | `GET /tokens/v2/search` | Token metadata + organic scores |
| Trigger V2 | `POST /trigger/v2/auth/challenge` | Auth challenge for order placement |
| Trigger V2 | `POST /trigger/v2/orders/price` | OCO order submission |

## Setup

```bash
# No npm install required — zero external dependencies
node agent.js
```

Add to `crypto_bot.env` (or environment):
```
JUPITER_API_KEY=your_key   # optional — improves rate limits from 0.5 to 1 RPS
TELEGRAM_TOKEN=...          # optional — Telegram alerts on breakout
TELEGRAM_CHAT_ID=...
```

## Configuration

Edit the top of `agent.js`:

```js
const POLL_MS    = 30_000;  // price poll interval
const WINDOW_SIZE = 20;     // rolling samples (20 × 30s = 10 min)
const VOL_MULT   = 2.0;     // breakout = recent vol > 2× earlier vol
const TP_PCT     = 0.02;    // 2% take-profit
const SL_PCT     = 0.01;    // 1% stop-loss
```

## Extending to live order execution

The current implementation generates and logs the OCO payload. To submit live orders:

1. Get a Jupiter Developer Platform API key at `developers.jup.ag/portal`
2. Add `JUPITER_API_KEY` to your env
3. Implement ed25519 wallet signing for the auth challenge (see `trigger.js`)
4. Call `submitOrder(ocoPayload, apiKey)` after signing

The auth challenge flow is fully implemented in `trigger.js`. The only remaining step is the wallet signature, which requires access to the Solana keypair.

## DX Report

See `DX-REPORT.md` for a detailed developer experience report covering what worked, what's broken, and what should be built next.

## Structure

```
jupsignal/
├── agent.js       — main loop: price polling + volatility detection + order generation
├── price.js       — Jupiter Price V3 API client
├── tokens.js      — Jupiter Tokens V2 API client
├── trigger.js     — Jupiter Trigger V2 API client (auth + order building)
├── README.md      — this file
└── DX-REPORT.md   — developer experience report
```
