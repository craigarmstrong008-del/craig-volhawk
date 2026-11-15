# 06 - Existing Systems, Hypotheses and How Traders Lose

Workstream 6 of 6. Date of research: 2026-11-15. Method: web search only. Market-data APIs are blocked in the sandbox, and several hosts also failed to resolve for WebFetch (drops.dagstuhl.de, levandor-docs.pages.dev, www.ifo.de, thedefiant.io). Every number below therefore comes from search-result summaries of the cited page, not from a full read of the primary document. Treat each figure as "reported by the source", and re-verify against the primary before relying on it. No numbers here are mine and none are simulated.

Evidence tiers used throughout:
- A = academic or on-chain dataset with a stated sample (still preprint/working-paper in most cases)
- B = practitioner write-up with some method disclosed
- C = vendor, blog or media summary with no method (marketing-grade)

## 1. Key findings

1. **The best-measured fact in this whole space is that retail loses, and mostly through costs and liquidations rather than bad "signals".** On Hyperliquid (Mar 2025 to Jun 2026), manual front-end traders lost $1.11B net of fees, market makers gained $208M, and algorithmic takers roughly broke even. Fees were the largest channel ($725M); front-end traders cross the spread on 85% of volume vs 20% for market makers and account for 96% of liquidation volume. Source: https://drops.dagstuhl.de/entities/document/10.4230/LIPIcs.AFT.2026.36 (via search summary; tier A, extended abstract). The report gives dollar transfers, not the share of traders who lose.
2. **Prediction markets show the same maker/taker asymmetry.** On Kalshi (300k+ contracts), takers lose about 32% on average and makers about 10%; average return before fees is about -20%. Longshots are the worst-priced. Source: https://cepr.org/index%2Ephp/voxeu/columns/economics-kalshi-prediction-market and working paper https://www.karlwhelan.com/Papers/Kalshi.pdf (tier A; numbers from the VoxEU summary, not re-read in the paper). Kalshi's pre-2025 fee schedule is what was modelled.
3. **Most Polymarket wallets lose; profit is concentrated.** Reported shares of losing wallets range from about 69% to 84% depending on study and definition (2.9M wallets, Galaxy: 69.2% below break-even; 2.5M wallets, Sergeenkov April 2026: 84.1% lost; defioasis ~1.7M addresses: ~70% realized losses). Concentration: a Yale study reportedly found 3% of traders captured 27% of profits. Sources (all media summaries of the studies): https://beincrypto.com/polymarket-retail-traders-losses-galaxy-study/ , https://www.kucoin.com/news/flash/84-of-polymarket-traders-report-losses-new-research-reveals , https://yellow.com/news/polymarket-data-70-of-traders-lose-money-while-elite-004-captures-dollar37b-in-profits , https://www.financemagnates.com/fintech/100000-polymarket-wallets-lost-at-least-1000-bloomberg-analysis-shows/ . The spread is likely definitional (realized vs total, time window, small-account inclusion); the sources do not explain it. Also unaddressed: one person using many wallets, and unrealized or never-redeemed losing positions.
4. **Evidence for crypto trend following is the best of the directional strategies, but still thin.** Han, Kang and Ryu report strong time-series momentum and weak cross-sectional momentum in crypto, concentrated in bull markets (reported via https://acfr.aut.ac.nz/__data/assets/pdf_file/0009/918729/Time_Series_and_Cross_Sectional_Momentum_in_the_Cryptocurrency_Market_with_IA.pdf, tier A, abstract-level). A 20-day MA rule on BTC reports gross Sharpe 1.68, net 1.25 at 0.5% frictions, short sample, paywalled (https://www.cxoadvisory.com/?p=46798, tier B). A Quantpedia out-of-sample check found the long (MAX) rule held up and the short (MIN) rule did not (https://quantpedia.com/revisiting-trend-following-and-mean-reversion-strategies-in-bitcoin/, tier B). Long-only trend in a market with a strong secular uptrend flatters the result.
5. **Funding/basis carry is real, but the risk-adjusted return has compressed.** One 2025 paper reports the Schmeling-Schrimpf-Todorov carry portfolio at a full-sample (2020-2025) Sharpe of about 6.45, about 4.06 from 2024, and negative in 2025 (https://arxiv.org/pdf/2510.14435). He and Manela find perp deviations from no-arbitrage are larger than in traditional currency markets and that funding arbitrage is not risk-free (https://arxiv.org/pdf/2212.06888). A single-author blog argues a level funding harvest is a Sharpe artifact of smooth returns plus a fat left tail (https://bryanvine.github.io/alpha-research/paper2.html, tier C, do not rely on it).
6. **Short-horizon mean reversion exists statistically but costs eat it.** A preprint reports significant 15-minute reversal in 90% of 183 Binance pairs, but gross edge peaks near 1.3 bp per trade against 5 bp round-trip cost (https://arxiv.org/pdf/2608.21888, tier A-, non-peer-reviewed). Copula pairs trading at 0.08% round-trip cost had drawdowns under 20% but negative net returns (https://www.aimspress.com/aimspress-data/qfe/2026/2/PDF/QFE-10-02-016.pdf). Several pairs-trading theses underperformed buy-and-hold (see search summary, tier B-C, e.g. https://repositorio.ucp.pt/bitstreams/e0abbbf7-96a1-4333-88ae-a6f05fb7fcce/download).
7. **Polymarket arbitrage was large in 2024-25 but is a speed/capital game.** arXiv 2508.03474 reports 7,051 of 17,218 conditions with at least one within-market opportunity and about $40M realized arbitrage profit extracted, April 2024 to April 2025 (https://arxiv.org/abs/2508.03474, tier A). Decrypt reported the same figure and speculated on other platforms (https://decrypt.co/339958/40-million-free-money-glitch-crypto-prediction-markets).
8. **Latency edges get repriced by the venue.** Polymarket added taker fees to its 15-minute crypto markets in January 2026 explicitly to blunt latency arbitrage, with fees highest near 50% odds and redistributed to makers (https://www.financemagnates.com/cryptocurrency/polymarket-introduces-dynamic-fees-to-curb-latency-arbitrage-in-short-term-crypto-markets/ , https://www.theblock.co/post/384461/polymarket-adds-taker-fees-to-15-minute-crypto-markets-to-fund-liquidity-rebates). Reported fee levels conflict across outlets (up to about 3% vs 1.56%); check Polymarket's current fee docs.
9. **There is no credible published measurement of copy-trading edge after latency for Polymarket wallets.** See section 5. The only quantitative copy-trading evidence found is a vendor study of Binance/Bybit/MEXC with contradictory write-ups (tier C).
10. **Liquidity vanishes exactly in stress.** The 2025-10-10 event: about $19B of liquidations (the official figure; CoinShares suggests it is understated), market makers pulled bids, auto-deleveraging hit even hedged shorts (https://coinshares.com/be/insights/knowledge/billions-in-liquidations-what-happened , https://www.tradingview.com/news/coinpedia:a9beb70ce094b:0-19-billion-crypto-crash-shows-market-makers-can-also-break-the-market/ , https://www.fticonsulting.com/insights/articles/crypto-crash-october-2025-leverage-met-liquidity). Any strategy that assumes it can exit at the quoted price in a cascade is untested for that regime.

## 2. Strategy catalogue

Score = rubric in section 6 (0-100, my judgement from the cited evidence; not a measured result). "Evidence" tier A/B/C per above.

| Strategy | Mechanism | Counterparty | Evidence | Costs | Decay | Fails when | Score |
|---|---|---|---|---|---|---|---|
| Time-series trend following (BTC/ETH, daily+) | Slow information diffusion, retail herding, leverage-driven continuation | Late contrarians, forced liquidations | A/B: strong TSMOM, concentrated in bull regimes; Sharpe 1.25 net on 20d MA, short sample (cxoadvisory, acfr links above) | Low if daily, 0.5% friction assumed in the one cited test | Unknown; short-leg already failed OOS in the Quantpedia check | Choppy ranges, sharp V reversals, bull-only dependence | 62 |
| Cross-sectional momentum (alts) | Rank winners/losers | Same | A: weak (acfr link); higher max drawdown of 55% in a 2025 paper (https://arxiv.org/pdf/2511.13239v2) | Higher: alt spreads, borrow | Unknown | Most periods per source | 30 |
| Funding/basis carry (delta-neutral) | Long spot, short perp, collect funding paid by leveraged longs | Leveraged long speculators | A: arXiv 2510.14435, 2212.06888; B vendor guides | Fees, margin, exchange counterparty risk | Sharpe 6.45 full sample, 4.06 from 2024, negative 2025 (arXiv 2510.14435) | Funding flips negative, exchange failure or ADL, margin squeeze in cascades | 55 |
| CME/dated-futures basis | Same, with convergence at expiry | Hedgers/levered longs | C: "10-15% annualized" from a vendor (https://www.sharpe.ai/learn/futures-basis-explained) | Futures margin | Unknown | Basis collapse in bear markets; large minimum size | 35 (low evidence, low capacity fit) |
| Short-horizon mean reversion / liquidity provision proxy | Temporary price pressure reverts | Impatient takers | A-: preprint arXiv 2608.21888; CERGE-EI wp (https://www.cerge-ei.cz/pdf/wp/Wp730.pdf) | 1.3 bp gross vs 5 bp cost | Unknown | Trending moves, cost > edge (it already does for spot takers) | 20 |
| Pairs / stat arb (cointegration) | Mean-reverting spread between related coins | Noise traders | B/C theses and working papers; mixed (links in finding 6) | 0.08%-1% assumed; net often negative | Distance-method returns deteriorated per a 2026 Frontiers paper (https://www.frontiersin.org/articles/10.3389/fams.2026.1749337/full) | Regime/structural break in the pair; costs | 22 |
| Cross-exchange arbitrage | Price gaps across venues | Slow venue/market makers | No rigorous crypto-specific source found | Transfer latency, fees, inventory | Speed race, not retail | Always competitive for retail | 10 (no evidence found) |
| Market making, crypto perps | Capture spread; Hyperliquid MMs +$208M | Retail takers (who lose $1.11B) | A: Dagstuhl link above | Inventory/adverse selection, infrastructure | Unknown | Cascades (10-10) pull liquidity and cause losses | 25 for a small account (strong evidence, poor fit) |
| Market making, Polymarket | Spread plus rewards/rebates | Takers (Kalshi analogue: takers lose 32% vs makers 10%) | B: a microstructure note (https://avdheshcharjan.github.io/notes/polymarket-mm.html) says positive markouts, but computed against trades not resting book; docs https://docs.polymarket.com/developers/rewards/overview ; C: DEV post $5-30/day on $5-20k (unverified) | Inventory risk near 50%; resolution risk | Unknown | Informed flow on news/resolution; a single adverse event can erase weeks of income (guide, tier C) | 45 |
| Liquidation-sweep / stop-run | Price drawn to liquidation clusters; fade or front-run | Over-leveraged traders | Event write-ups only (10-10 links above); no systematic test found | Slippage extreme in the event | n/a | Liquidity gap; ADL; fading a real regime change | 12 |
| Breakout / range | Volatility expansion | Range traders | Folded into trend evidence; no standalone source | Moderate | Unknown | False breakouts | 25 |
| Event-driven (news/tariff/macro) | Fast repricing | Slow participants | Event narratives only; no systematic evidence found | Slippage, gaps | n/a | Retail is slowest; 10-10 shows gap risk | 10 |
| Polymarket within-market / combinatorial arbitrage | Sum-of-prices violations, logically linked markets | Mis-pricing flow | A: arXiv 2508.03474, about $40M, 2024-25 | Gas, fees, capital lock until resolution, execution risk on multi-leg | Presumably decaying with bots; not measured | Legs not filled; resolution rules differ across linked markets | 50 |
| Favourite-longshot (sell longshots / buy favourites) | Overpricing of small probabilities | Optimistic takers | A: Kalshi 300k contracts; cross-platform 292M trades (https://arxiv.org/html/2602.19520v1); Polymarket-specific evidence not confirmed (arXiv 2609.12878 returned only references) | Spread, fee; capital lock | Unknown | Tail events; thin favourites yield small edge | 58 |
| Polymarket 15-min crypto latency arb | Prediction lag vs Binance spot | Slow quoters | C: anecdotal "30-90s lag" (https://dev.to/pmtraderadam/farming-15-minute-polymarket-crypto-markets-momentum-lag-arbitrage-1of2) | Dynamic taker fees from Jan 2026 | Venue actively countering it | Fees, co-located bots | 8 |
| Polymarket wallet copy trading | Follow "smart money" | The leader's counterparties, plus you pay the latency | C only; see section 5 | Slippage, fees, crowding | Unmeasured | Leader luck (survivorship), lag, reflexivity | 15 |
| CEX copy-trading (leaders on Binance/Bybit) | Same | Same | C: 90-day vendor study, leaders 97% profitable vs followers 43.6% or 48.48% depending on write-up, and no cost decomposition (https://www.ainvest.com/news/leader-copying-losing-point-2608/) | Slippage, performance fees | Unmeasured | Leader takes tail risk | 10 |
| Retail discretionary leveraged perp trading (baseline) | None in particular | Market makers, algos | A: Dagstuhl: net loser | Fees about 3 bp/side-volume | n/a | Typically | 0 |

## 3. Why traders lose (ranked by strength of evidence)

1. **Paying the spread and fees as a taker, repeatedly.** Hyperliquid: fees are the largest loss channel ($725M of $1.11B); front-end traders cross the spread on 85% of volume. Kalshi: takers lose about 32% vs makers about 10%. Sources above (tier A).
2. **Forced liquidation from leverage.** Front-end traders are 96% of liquidation volume on Hyperliquid (Dagstuhl link). 10-10 showed cross-margin and ADL turning hedges into losses (coinshares, FTI links).
3. **Overpaying for low-probability outcomes** (longshot bias): Kalshi study, cross-platform study (links above).
4. **Slippage from large aggressive orders** ($154M in the voluntary-trading channel of the Hyperliquid study).
5. **Backtest overfitting / selection bias in what you copy or build.** A reported example of a 5.59-Sharpe backtest with deflated Sharpe near 0.10 after about 47.5M candidates is a blog illustration (https://dev.to/rulyfi/we-ran-100-million-bitcoin-backtests-only-3130-beat-the-luck-bar-3ma2, tier C); the underlying DSR method is from Bailey et al. (not independently fetched). I found no systematic study of OOS degradation for crypto strategies.
6. **Trading against better-informed flow**: suspected insider wallets on Polymarket (e.g. a cluster allegedly making $8M on US military markets, https://cryptobriefing.com/polymarket-wallets-military-insider-trading/; flags are inferences, not findings).
7. **Taking the opposite side in the regimes where the edge fails** (e.g., trend followers in chop, carry in funding flips).
8. **Generic day-trader loss statistics (70-97%)** are widely quoted for crypto but originate from traditional-market studies (e.g. Brazilian futures); do not use as a crypto perp loss rate (https://cryptobriefing.com/us-day-traders-crypto-perpetual-futures/ , https://coincub.com/blog/crypto-trading-traps/).

Cannot rank by effect size: I found no source that decomposes loss by cause on Polymarket.

## 4. Risk management rules (what is and is not evidenced)

- **Evidenced (tier B only):** Volatility targeting and momentum timing lowered drawdown in backtests: a BTC/gold dual momentum with 20% vol cap had max drawdown of -49.4% (so "cut" is relative), and it failed when both assets fell in 2022 (https://quantpedia.com/dual-momentum-allocation-between-physical-gold-and-bitcoin-digital-gold/). Grayscale reported lower vol vs buy-and-hold from momentum signals with some return give-up (https://research.grayscale.com/reports/the-trend-is-your-friend-managing-bitcoins-volatility-with-momentum-signals; issuer of crypto products, so conflicted). One illustrative drawdown shift from 45% to 29% is not a full OOS test (https://www.advisorperspectives.com/commentaries/2025/11/02/client-portfolios-cant-stomach-ride-considered-crypto?firm=modelist).
- **Not found:** Any source testing fractional Kelly on crypto or prediction markets. Kelly is mathematically standard but I have no crypto-specific evidence for the "half or quarter Kelly" multiplier. Treat it as a hypothesis (H7 below).
- **Mechanically justified by the Hyperliquid result (not a risk-rule test):** Low leverage and no cross-margin reliance avoid the liquidation channel (96% share, Dagstuhl link). The 10-10 event shows hedged books suffering ADL, so "hedged" is not "safe" on a single venue.
- **Correlation limits:** No crypto-specific evidence located. Alts are highly correlated in stress as a general fact, but I do not have a sourced figure.

## 5. Polymarket wallet copy trading: assessment

What exists: tool vendors, blogs and project notes. No peer-reviewed or on-chain study of follower returns was found.
- Survivorship: a project note says blown-up wallets drop off leaderboards so aggregates look better than they were, and proposes using historical leaderboard snapshots (https://levandor-docs.pages.dev/projects/polymarket-fetch/copy-trade-algorithm; tier C, fetch failed so this is via search summary). Aggregate means far above medians show heavy polarisation (https://www.mexc.com/news/465345). Structurally: with 2.5M+ wallets and a loss-heavy distribution (finding 3), a top-N list will contain lucky wallets by construction. How many is unknown; testing it is H1.
- Latency: sources conflict. One notes a short-term-accuracy page claims most of the edge survives seconds-to-a-minute copy delay, while the same project's top-trader-edge note says its lag probe measured the lag it had assumed was the edge (https://levandor-docs.pages.dev/projects/polymarket-fetch/short-term-accuracy , https://levandor-docs.pages.dev/projects/polymarket-fetch/top-trader-edge). A copy platform argues copiers always enter worse and lack timing information (https://startpolymarket.com/strategies/copy-trading/; vendor). Tools poll at minute-scale vs claimed seconds (https://skills.sh/spartanlabsxyz/simmer-sdk/polymarket-copytrading).
- Informed-trader angle: analyses flag "Orca" wallets (specialised, 75%+ win rate on longshots) that professionals reportedly follow (see search summary around https://pm.wiki/uk/learn/polymarket-insider-trading-whale-tracker and https://tradersunion.com/news/editors-picks/show/3232570-million-dollar-secrets/). Nobody measured how fast the price moves after such a wallet trades, so edge-after-latency is unknown.
- Other: whales analysis covered only two weeks (https://predictionlabs-blog.pages.dev/posts/whales-of-polymarket); reflexivity and taker fees/slippage often omitted from backtests (https://dev.to/fatherson/why-95-of-people-copying-the-1m-polymarket-bot-still-go-broke-84d).
- Analogue: in CEX copy trading, leaders appear profitable far more often than followers (97% vs 43.6-48.5%), but this vendor study did not decompose fees/funding/slippage and the two write-ups disagree on the number (https://www.ainvest.com/news/leader-copying-losing-point-2608/). Another summary of academic work says copied trades are more likely to be positive but with lower ROI than the leader's (https://en.wikipedia.com/wiki/Copy_trading, unverified original).

Verdict: unproven, plausibly negative after lag for the generic "top leaderboard wallet" and potentially positive only for a narrow, point-in-time-selected subset (specialist, long-horizon, low-turnover wallets whose trades are not news-reactive). Can be tested cheaply with free public data if the data host is reachable (H1-H3).

## 6. Scoring rubric

Score each 0-5, weights in brackets, total scaled to 0-100.
1. Evidence quality [x5]: 5 = multiple independent OOS/live or large on-chain datasets net of costs; 3 = one academic/preprint with disclosed method; 1 = blog/vendor backtest; 0 = anecdote only.
2. Cost robustness [x4]: 5 = survives 2x the assumed round-trip cost; 3 = survives 1x; 1 = gross only; 0 = net negative after costs.
3. Decay evidence [x3]: 5 = stable across 2+ regimes and years incl. post-publication; 3 = unknown but mechanism structural; 1 = documented decay; 0 = venue has countered it.
4. Regime tail risk [x3]: 5 = bounded loss in cascades; 1 = ADL/liquidity-gap exposure.
5. Capacity [x2]: 5 = scales beyond account size trivially (not the binding constraint for a small account).
6. Small-account fit [x3]: no co-location, no large min size, no custody of big idle capital, executable by a person/low-cost bot.
Max raw = 5 x (5+4+3+3+2+3) = 100. Scores in section 2 were assigned by judgement from this rubric and are not computed from data; they should be re-scored as H1-H8 produce results.

## 7. Testable hypotheses (exact pass/fail rules + data required)

Common rules: pre-register parameters before looking at OOS; fixed split (train earliest 60%, validate 20%, final untouched 20%); cost assumption = measured fee + half-spread + 1x slippage proxy, then re-run at 2x costs; count all variants tried and report deflated Sharpe (Bailey et al. method); minimum 30 independent trades or 3 distinct regimes (bull, bear, range) per claim; strategy fails if it fails in any of them.

**H1. Leaderboard survivorship.** Claim: wallets in a point-in-time top-100 by trailing 90-day PnL do not outperform a size-matched random wallet set over the next 90 days.
Pass (the idea survives): top-100 forward median ROI minus random-set median ROI > 0 with 95% bootstrap CI excluding zero, in at least 3 of 4 non-overlapping windows. Fail otherwise.
Data: Polymarket on-chain CTF/CLOB trade history (Polygon) with timestamps, wallet, market, price, size; historical leaderboard or reconstructed rolling PnL. Cannot obtain in sandbox.

**H2. Copy edge after latency.** Claim: copying a qualifying wallet's new BUY with delay d earns positive net return per dollar.
Pass: for d = 5s, 30s, 2 min, mean net return after taker fee, spread and walking the book > 0, CI excluding 0, n >= 300 trades, and return at d = 2 min is >= 50% of return at d = 0 (theoretical). Fail if return at d = 30s <= 0.
Data: wallet trades plus order-book snapshots (or trade prints) around each trade.

**H3. Specialist subset.** Claim: wallets with >= 50 trades, >= 80% in one category and median hold > 24h have positive copy return at d = 2 min (same rule as H2) while the generic set does not.
Data: as H2 plus market category labels.

**H4. Longshot bias on Polymarket crypto/other markets.** Claim: contracts bought below 10c lose more than the fee-adjusted break-even.
Pass (bias exists and is exploitable): selling-longshot / buying-complement strategy with realized net return > 0, CI excluding 0, across >= 3 categories, with positions sized so max loss per event <= 1% of equity; stable in both halves of the sample. Fail if only one category drives it or net return <= 0 after fees/resolution lag capital cost (use T-bill-equivalent rate as a hurdle).
Data: resolved Polymarket markets with price history and outcomes.

**H5. Daily trend following on BTC/ETH/SOL.** Rule: long when close > 50-day (also test 20/100/200 to check robustness, not to pick) moving average, flat otherwise; vol-targeted to 20% annualized.
Pass: net Sharpe >= 0.8 AND max drawdown at least 30% lower than buy-and-hold AND positive in the last 20% untouched segment AND the Sharpe stays >= 0.5 at 2x costs, AND neighbouring parameters (20 to 200) all have Sharpe > 0.4. Fail otherwise. Also report % of return coming from the single best 3 months (flag if > 50%).
Data: daily OHLC for spot/perp, perp funding history, fees.

**H6. Funding carry.** Rule: long spot / short perp when trailing 7-day average annualized funding > X (set X before testing = cost of capital + 5%), exit when < cost of capital.
Pass: net return after fees, borrow/margin cost and a 10% margin-stress haircut > cost of capital in the last 12 months AND worst 30-day drawdown < 5% AND strategy survives replaying 2025-10-10 conditions (forced reduction of the short leg). Fail if edge exists only before 2024 (compression evidenced in arXiv 2510.14435).
Data: per-exchange funding rates, spot and perp prices, margin rules, ADL history.

**H7. Sizing.** Claim: sizing at 0.25 Kelly of the estimated edge, capped at 1-2% equity risk per trade, reduces max drawdown vs flat sizing without cutting net Sharpe by more than 20%.
Pass: on the H5 or H4 trade streams, bootstrap 1,000 paths: median max drawdown lower by >= 25% and 5th-percentile terminal equity higher. Fail otherwise. Also test full Kelly with estimation error to show ruin probability.
Data: trade-level return series from H4/H5.

**H8. Short-horizon reversion net of costs.** Claim: 15-minute reversal signal earns positive net after realistic costs when executed as a maker.
Pass: net per-trade return > 0 at maker fee with fill-probability haircut, adverse selection measured via post-fill markout at 1/5/15 minutes, n >= 1,000 fills. Fail if gross edge < 2x one-way cost (preprint shows 1.3 bp gross vs 5 bp round trip as taker).
Data: Binance (or target venue) trades/L2 snapshots; maker fee tiers.

**H9. Polymarket combinatorial arbitrage for a small account.** Pass: after reconstructing signals from historical books, >= 80% of flagged opportunities could have been fully filled for >= $200 at displayed size with leg-risk accounted for, and net return after gas and capital lock > hurdle. Fail if the fillable share is < 50% (bots take them first).
Data: historical L2 books for linked markets; not obtainable from public aggregates.

## 8. What we could NOT verify

- No primary documents were fully read: WebFetch to drops.dagstuhl.de, levandor-docs.pages.dev, www.ifo.de and thedefiant.io failed (blocked host). Those hosts need to be allowed in the session network settings to re-verify the Hyperliquid paper, the Kalshi paper and the Polymarket profitability report. All figures for them are from search summaries.
- Why the Polymarket losing share varies from 69% to 84%, and whether multi-wallet users bias it.
- Any measured edge of Polymarket wallet copying after latency; any published survivorship quantification for leaderboards.
- A Polymarket-specific favourite-longshot paper (arXiv 2609.12878 returned references only); the Kalshi macro-contract result is secondary.
- Fractional Kelly and correlation-limit evidence for crypto or prediction markets.
- Cross-exchange arbitrage, stop-run/liquidation-sweep and event-driven strategies: no rigorous performance evidence found.
- Live track records or audited performance for any of the strategies; every performance number above is a backtest or a cross-sectional dataset, not an audited live record.
- Percentage of retail perp traders who lose on crypto specifically (the Hyperliquid paper gives dollars not shares).
- Current Polymarket fee schedule (reports conflict: up to about 3% on 15-minute markets vs 1.56% extension).
- Capacity numbers for any strategy; none were found with a method.
- Exact current dates of several sources: some arXiv IDs and dates (e.g. 2608/2609) postdate my training and were taken as returned by search.
