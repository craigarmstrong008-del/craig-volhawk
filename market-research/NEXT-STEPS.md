# NEXT STEPS (one page) - 2026-11-15

Goal: narrow the ways we lose; find where odds are higher. No trade promises. Detail: SYNTHESIS.md.

## Verdict in three lines
1. Best-evidenced facts are about losing: costs (taker fee/spread), leverage/liquidation, longshot overpayment, being the Polymarket/Kalshi taker. Every "predictive" signal in the files is C/D grade or small-N (18 of 40 key claims are C/D; none of the crypto alpha claims is A).
2. Plan = defensive first (cheap to test, structural), then 3-4 offensive tests under a trial ledger with one-shot holdouts.
3. Wallet copy-trading: no demonstrated edge (best of 16 books +8.4% is inside the noise range for a max of 16). Freeze, add markout logging, apply kill rule.

## Rules to apply today (manual discipline, no testing needed)
- Maker/limit by default; trade only if expected edge >= 2x measured round-trip cost.
- Isolated margin; liquidation distance >= 3x stop distance; risk per trade <= 1% of equity; leverage is an output.
- No new leveraged entries on weekends or ~20-23 UTC; none in [-5,+60] min around FOMC/CPI (next: FOMC Dec 8-9).
- Polymarket: no taker buys below 10c; no size in subjective-resolution markets; max loss per market <= 1% equity; do not treat 99c as free money.
- No dip-buying inside a cascade; no cycle/"bottom" or M2/CME-gap/heatmap-based sizing.
- Two-source rule for any number that triggers an action (BTC price and Fed path were contradictory across our own files).

## This week (weeks 0-2)
1. Re-request Tier-1 hosts (exact names): data.binance.vision, fapi.binance.com, api.bybit.com, api.hyperliquid.xyz, api.exchange.coinbase.com, gamma-api.polymarket.com, clob.polymarket.com, data-api.polymarket.com, fred.stlouisfed.org, api.stlouisfed.org, api.alternative.me. Optional Tier 2: arxiv.org, docs.polymarket.com, developers.binance.com, www.federalreserve.gov, www.bls.gov, stablecoins.llama.fi, plus websocket hosts.
2. Start recording NOW (always-on VM or Actions): Polymarket /book for crypto markets and watchlist-wallet markets, wallet-trade markouts (+5s/30s/2m/10m), daily leaderboard snapshots; perps top-20 depth, funding, OI, forced orders on Binance/Bybit/Hyperliquid; our own fill costs.
3. Create `ledger/trials.csv`; commit pre-registrations for D3, D4, D5, O1, O2 before pulling data.
4. Freeze wallet books (no new variants); compute pooled ROI with market-clustered bootstrap and a random-wallet placebo.
5. Resolve conflicts #1 (BTC price since Nov 11) and #3 (Dec hike odds, 10y) from primary data.

## Weeks 2-4 (to Dec 13)
Run O1 trend, D5 event vol ratio, O2 Polymarket longshot calibration, O3 funding extremes on history. Write D5 blackout rule by Dec 1; observe FOMC Dec 8-9 (vol/spread only, no directional bet).

## Weeks 4-8 (to Jan 10, 2027)
One-shot holdouts for survivors; D2/D3/D4 on recorded data; O4/O6 feasibility from recorded books; O5 kill decision. Decision memo at week 8. Go live (tiny, maker-first) only if a hypothesis passed validation and holdout net of 2x costs AND has >= 4 weeks of agreeing forward paper.

## Kill criteria (headline)
- Wallet copying: pooled 30s-delay net ROI <= 0 at >= 1,500 independent bets, or specialist subset fails holdout.
- Trend: fails >= 2-of-3 coins or holdout Sharpe < buy-and-hold with < 30% drawdown benefit.
- Polymarket longshot: one category only, or net <= 0 after fees, capital lock, disputes.
- Any hypothesis: deflated Sharpe < 0.5 at current trial count, or fails at 2x costs.

## Candid odds (subjective, not measured)
Defensive rules likely pass (60-90%). Any single offensive idea 5-30%. At least one real, durable, usable edge over the full programme ~35%; confirmable within 8 weeks ~10%.

## Unresolved conflicts to chase
BTC spot since Nov 11 and 200WMA break claim; Dec hike odds and 10y level; Oct 10 depth collapse magnitude and cause; trend-following post-2021; ETF flow lead/lag; Polymarket 15-min fee level; Binance forceOrder semantics; Polymarket arbitrage capacity; copy-trading latency evidence.
