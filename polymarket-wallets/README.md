# polymarket-wallets

A standalone tool that finds the top Polymarket wallets, analyses their **last 90 days** of on-chain activity, and builds a dashboard from the results. It's separate from everything else in this repo: no shared code, no npm dependencies, Node 18+ only.

## What it produces

| Output | What's in it |
|---|---|
| `dashboard/index.html` | Static dashboard (open the file directly or run `npm run serve`). It has four tabs: Overview, Wallets, Smart money and Method. |
| `data/report.json` | The full analysis: every wallet, every metric, consensus and fresh-flow signals. |
| `data/wallets.csv` | One row per wallet, ranked by score. |

**For each wallet (90-day window):** realised and unrealised PnL, win rate, profit factor, ROI, annualised Sharpe from daily PnL, max drawdown, volume, trade count, average/median/max trade size, entry-price mix (longshot → near-certain), category mix, trading hours (UTC), best and worst closes, most-traded markets, open book, and an equity curve.

**Archetypes** (rule-based tags): Whale, High-frequency, Market-maker-like, *Category* specialist, Favourite grinder, Longshot hunter, Hold-to-resolution, Sharp, Sniper, Generalist.

**Score (0–100):** percentile ranks within the cohort. Weights: 90-day PnL 25%, realised PnL 20%, win rate (shrunk toward 50%) 15%, profit factor 15%, ROI 15%, Sharpe 10%. Wallets with fewer than 15 closed positions are pulled toward 50.

**Cross-wallet signals:**
- *Consensus positions*: live outcomes held by two or more top wallets, with a conviction figure that accounts for top wallets on the opposite side.
- *Fresh flow*: outcomes that two or more top wallets net-bought in the last 7 days.

## Run it

```bash
cd polymarket-wallets
npm run all            # collect → analyse → build dashboard
npm run serve          # http://localhost:8090
```

Options: `node src/cli.js all --days 90 --per-board 100 --concurrency 4 --wallets extra.txt --max-age 12`

- `--per-board`: how many wallets to take from each of the four leaderboards (30-day PnL, 30-day volume, all-time PnL, 7-day PnL). Polymarket has no 90-day board, so the real 90-day ranking is computed from each wallet's own history.
- `--wallets`: a file of extra `0x…` addresses to include.
- Raw downloads are cached in `data/raw/` (gitignored) for `--max-age` hours.

You need network access to `data-api.polymarket.com`. No API key is required.

## Automated

`.github/workflows/polymarket-wallets.yml` runs on every push to this folder, daily at 06:17 UTC, and on demand from the Actions tab. Each run tests, collects and analyses, uploads the ready-to-open dashboard as a build artifact named `polymarket-wallets-dashboard`, and commits the refreshed `dashboard/report.js`, `data/wallets.csv` and `data/candidates.json` back to the branch. Those are the only files it writes.

## Backtest

`npm run backtest` tests copy-trading rules without hindsight. Wallets are ranked on the first 45 days of the window, and their buys are followed only in the last 45. Each bet stakes $100 and is entered at Polymarket's recorded price at seven delays: the wallet's own price, 1 min, 5 min, 30 min, 2 h, 6 h and 24 h. The 1- and 5-minute delays use minute-by-minute prices. Each entry pays 1¢ of slippage, and every bet is valued at the market's real result.

Strategies: copy the top 20, copy the top 20 slow traders (20 trades a day or fewer), consensus of 3+ of the top 50, fade the bottom 20, and a copy-everyone baseline. Results are shown in the dashboard's **Backtest** tab. The step also writes `data/watchlist.json`: the wallets each strategy would follow today, ranked on the most recent 45 days.

## Paper trading

`npm run paper -- --minutes 60 --stake 20` runs the paper-trading agent. **It never places real orders.** Every 30 seconds it checks the watchlist wallets for new buys. When a strategy's rule fires, it records the bet it would have made at the live order-book price, walking the book for the full stake. It settles the bet when the market resolves.

- Limits: one open bet per strategy per market, and at most 40 bets per strategy per day.
- Only trades made after the agent starts count. After a gap of more than 10 minutes, the backlog is skipped rather than traded late.
- State is kept in `data/paper/state.json`, and results appear in the **Paper trading** tab.

`.github/workflows/polymarket-paper.yml` runs the agent in roughly 5.5-hour stretches, saving progress every 30 minutes. Scheduled runs only fire once the workflow is on the repository's default branch. Until then it runs when its files change, or locally with the command above.

## Caveats

- Unrealised PnL includes positions opened before the window, so "90-day PnL" is an estimate.
- Categories are inferred from market-title keywords.
- Very active wallets are capped at 25k activity events (`PM_MAX_EVENTS`). The dashboard flags capped wallets, whose volume is understated.
- This is not financial advice.

## Tests

`npm test` runs unit tests on the metrics and an end-to-end run against a local fake API. The end-to-end test covers pagination, the 429 retry, same-timestamp bursts and caching. Test data is synthetic.
