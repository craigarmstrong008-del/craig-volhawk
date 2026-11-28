# CLAUDE.md

Two independent projects live in this repo. Neither shares code with the other.

## 1. Craig VolHawk (repo root)
Volatility-triggered OCO agent for Solana tokens (Jupiter Developer Platform hackathon, Frontier Track).

- Files: `agent.js` (main loop), `price.js` (Price V3), `tokens.js` (Tokens V2), `trigger.js` (Trigger V2: auth + order building).
- Run: `node agent.js`. **Zero npm dependencies. Keep it that way** (plain `https`, CommonJS, `'use strict'`).
- Flow: poll every 30s -> rolling 20-sample window per token (SOL, JUP, WIF) -> log-return stdev -> breakout when recent vol > 2x earlier half -> build OCO (2% take-profit, 1% stop-loss) -> Telegram alert.
- Config constants are at the top of `agent.js` (`POLL_MS`, `WINDOW_SIZE`, `VOL_MULT`, `TP_PCT`, `SL_PCT`). Change them there, and update README to match.
- Env (loaded from `../crypto_bot.env`, one directory above the repo): `JUPITER_API_KEY` (optional; 0.5 -> 1 RPS), `TELEGRAM_TOKEN`, `TELEGRAM_CHAT_ID`, `SUPERTEAM_WALLET`.
- **Currently paper-only.** The agent builds and logs OCO payloads and requests the auth challenge, but does NOT sign or submit. Live submission needs an ed25519 wallet signature (not implemented).
- Price history is in memory only; a restart loses it.
- `DX-REPORT.md` documents Jupiter API friction. Add new findings there.

### Money-safety rules
- Never add live order submission (`submitOrder`, `/trigger/v2/orders/*`) without an explicit opt-in flag defaulting to off, and ask the user first.
- Check any change to TP/SL math: take-profit must be above entry and stop-loss below entry for a long. Percentages are fractions (0.02 = 2%).
- Never read, print, copy, or commit `crypto_bot.env`, `.env*`, or any keypair/private key. Use placeholder values in docs.
- Don't log API keys or the Telegram token.

## 2. polymarket-wallets/
Analyses top Polymarket wallets (90-day window), builds a static dashboard, and runs a paper-trading agent. No real orders, ever.

- ESM, Node >= 18, no dependencies. Run from inside `polymarket-wallets/`.
- `npm run all` (collect -> analyse -> build), `npm run paper`, `npm run backtest`, `npm run serve` (port 8090), `npm test` (`node --test test/*.test.js`).
- Raw downloads cache in `data/raw/` (gitignored).
- Public API only (`data-api.polymarket.com`), no key needed.

### CI
- `.github/workflows/polymarket-paper.yml` runs the paper agent in 30-min chunks, commits `data/paper/state.json` and `dashboard/paper.js` with `[skip ci]`, and re-queues itself. Those frequent bot commits are expected; don't treat them as noise to clean up.
- Pull/rebase before pushing, since the bot pushes to the same branch.
- It only touches `polymarket-wallets/data/paper` and `dashboard/paper.js`; keep it that way.

## Subagents (`.claude/agents/`)
- `risk-reviewer`: read-only reviewer for TP/SL math, breakout logic, and live-order gating. Run it after any change to `agent.js`, `trigger.js` or `price.js`.

## Hooks (`.claude/`)
- `guard.js` (PreToolUse): denies access to secrets/keypairs, denies live Jupiter order submission unless `VOLHAWK_ALLOW_LIVE=1`, asks before an edit adds a `submitOrder(` call.
- `check-syntax.js` (PostToolUse): runs `node --check` on edited `.js` files.
