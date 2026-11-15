# SYNTHESIS: crypto majors (perps/spot) + Polymarket, cross-examination of six workstreams

Date: 2026-11-15. Scope: find where we lose and narrow it; build our own testable hypotheses. This is NOT a trade recommendation and promises no win.

**Hard limits on everything below.** The six agents saw only WebSearch snippets. No primary document was read and no market data was analysed, by them or by me. My own spot-checks (section 1) were also snippet-level. Every number is "as reported by a source", not verified. Probabilities in section 9 are my subjective priors, not measurements.

---

## 0. Bottom line (read this if nothing else)

1. **The best-evidenced finding is about how people lose, not how to win.** Costs (taker fee + spread), forced liquidation from leverage, longshot overpayment, and being the taker on Kalshi/Polymarket are the only loss channels backed by large datasets (grade B). Everything "predictive" (funding, ETF flows, M2, cycles, heatmaps, CME gaps, seasonality, sentiment) is grade C/D, small-N or in-sample.
2. **Our best realistic plan is defensive first**: cap leverage and liquidation exposure, stay maker/limit, avoid thin windows and subjective Polymarket markets, and stand aside in hostile regimes. These rules reduce loss without needing any predictive edge, so they are far more likely to pass testing than any alpha idea.
3. **Our Polymarket wallet copy-trading shows no demonstrated edge.** 16 books, ~4,600 bets, 13 days: no ROI band excludes zero, and the best book (+8.4%) is below what pure noise produces as the maximum of 16 draws. It is under-powered, not refuted, and should be frozen and re-specified (section 7).

Of the 40 key claims graded in section 2, **4 are A, 18 are B, and 18 (45%) are only C or D.** The 4 A-grade items are volatility clustering, calendar non-persistence, deflated-Sharpe method papers and an FX stop-clustering result, so no crypto "edge" claim is grade A.

---

## 1. CONFLICT LOG

Resolution status: R = resolved (with grade of the resolving source), P = partly, U = unresolved.

| # | Conflict | Where | Best resolution | Status | What would resolve it |
|---|---|---|---|---|---|
| 1 | **BTC price today.** 03 says ~$62-68k on 2026-11-14/15, broke the 200-week MA on Nov 14, -14% on the week, -50.7% from ATH. 01 says ~$73-76k early Nov, weekly close Nov 7 ~$75.9k, below $73k on Nov 10, could not confirm today | 01 vs 03 | My search: Fortune daily page shows ~$74.3k on Nov 10 and ~$73.9k at 7:30 ET Nov 11; a futures page showed ~$73.8k (undated). A tracker shows weekly close Nov 1 of $78.4k with the 200WMA at ~$67.5k. I found NO report of a 200WMA break in Nov 2026 (only Jun and Aug 2026). 03's Nov 14-15 figures are unconfirmed. A -14% week from ~$74k lands at ~$64k, so 03 is arithmetically possible but unsupported. Treat spot as "$74k on Nov 11, unknown since" | U | Exchange 1-min OHLC (Coinbase/Binance/Kraken) for Nov 11-15 |
| 2 | **Fed path.** 01: "held at 3.50-3.75% or hiked to 3.75-4.00%, unresolved". 03: held 3.75-4.00% on Oct 28, 10-2 with two hike dissents; one summary says Sept hike | 01 vs 03 | My search returned federalreserve.gov press-release snippets: Sept 16 2026 hike 25bp to 3.75-4.00% (12-0); Oct 28 hold, 10-2, Cook and Hammack dissent for a hike. 01 and 03 are reconcilable: hike in Sept, hold in Oct. Snippet-level but from the primary domain | R (B) | Read the two Fed statements in full |
| 3 | **Dec hike odds and yields.** 39% mid-Oct vs 75-80% now vs "near-certain"; 10y 4.86% vs >5.3% | 03 internal | Sources disagree; none primary | U | CME FedWatch, FRED DGS10 |
| 4 | **Cycle low.** 01: ~$64k Feb 2026 (some ~$60k) and "around $60k" Jul. 03: Jul 2026 low ~$57.8k. My search: early-summer low ~$57k, 200WMA lost Jun/Aug 2026 | 01 vs 03 | Consistent with a low in ~$57-58k in Jun/Jul 2026 and a $60-64k Feb dip. Exact levels unknown | P | Daily OHLC |
| 5 | **Drawdown size.** 01: 45-50% drawdown. 03: 50.7% (at $62k). If spot is ~$74k the drawdown is ~41% | 01 vs 03 | Follows from conflict 1 | U | as #1 |
| 6 | **10 Oct 2025 cascade size.** $19B (CoinGlass) vs Amberdata BTC-only $2.3B on the day / $31.4B for 2025 vs "possibly under-counted" (CoinShares) | 01, 04, 05, 06 | Different scopes. My search: $19B+ is a CoinGlass all-asset figure over 24h, ~1.6M traders; CoinGlass itself says it is probably higher because Binance reports 1 order/sec; venue split reported Hyperliquid $10.31B, Bybit $4.65B, Binance $2.41B. Do not compare the $2.3B (BTC only) to $19B (all assets) | R (C/B: vendor, press-confirmed) | Raw forced-order data (Tardis) |
| 7 | **Depth collapse on 10-10.** ">90%" (FTI) vs "-98% in 40 min, $1.2M to $27K" (one memo) | 05 | Magnitude unverified; both single non-primary | U | Recorded/Tardis L2 |
| 8 | **Cause of 10-10.** Tariff post (01, 04) vs CoinShares mispricing before the post, unverified Hyperliquid-short rumour (01), Binance says low preceded USDe depeg while Ethena blames Binance's own thin-book collateral pricing (05) | 01, 04, 05 | Trigger plus venue-specific plumbing. Causal split not resolvable from snippets. Practical conclusion (venue/collateral/ADL risk is real) is robust either way | U | Post-mortems, Binance/Ethena statements |
| 9 | **OI drop on 10-10.** $50-65B (04) vs Amberdata BTC OI $54.7B to $31.9B (05) | 04 vs 05 | Different scope (all assets vs BTC) | R (scope) | - |
| 10 | **Is 10%/yr funding "elevated"?** 04: funding rose "from ~10% to ~30% annualized" before 10-10. 02: 0.01%/8h floor = ~11%/yr and BTC funding sat at the floor 78% of Q3 2025 | 02 vs 04 | 10-11% annualized is the neutral default (the interest-rate floor), not elevated. The real warning was the move to ~30%; "elevated" must be measured relative to the 0.01%/8h baseline, not zero | R (arithmetic, C source) | Binance/Bybit funding history |
| 11 | **Carry Sharpe.** 02/04: ~1.8 retail, 3.5 MM (He et al.). 06: 6.45 full sample, 4.06 from 2024, negative 2025 (arXiv 2510.14435) | 02/04 vs 06 | Different strategy definitions; direction agrees (large, compressing). Cannot compare magnitudes. 06's own scoring flags it as eroding | P | Own replication |
| 12 | **Trend following post-2021.** Coinbase: TSMOM underperformed buy-and-hold in all but 2 quarters since 2021 (no costs). Kaiko: momentum index beat BTC since 2021. Springer 2025: no consensus, 1 outlier = 37% of return. 06 scores it 62/100 | 02 vs 06 | Unresolved; the high score reflects "least bad", not strong evidence | U | Own test on 2021-2026 only |
| 12b | **MA-rule Sharpe numbers.** Grayscale 50d Sharpe 1.9 vs 1.3 (02); 20d MA gross 1.68, net 1.25 (06) | 02 vs 06 | Different rules, samples (2012-23 vs short), all in a bull-dominated sample. Not contradictory, not comparable | P | - |
| 13 | **ETF flows: lead or lag.** DWF: follow price (corr 0.54 prior-5d, 0.09 next-day); FalconX and Mazur-Polyzos: flows predict; IOSG: basis-hedge driven | 01, 04 | Unresolved. Vendor on both sides. Timestamp misalignment (UTC vs 16:00 ET) can fake predictiveness | U | Own Granger on aligned data |
| 14 | **US-session returns.** Kaiko: US session beats APAC/London 2023-25 (03). Parafi: big moves still print outside NYSE hours (03). Baur et al.: time-specific return anomalies do not persist (02, 03, 04) | within 03, across 02/03/04 | Peer-reviewed evidence says no persistent return pattern; what persists is activity/depth (weekend share 24% to 16-17%, 05/03) | P (return = no; liquidity = yes) | Own hourly test, ETF-era only |
| 15 | **Polymarket calibration.** 04: "decent in aggregate" (Princeton thesis). 01: same thesis says prices compressed toward 0.50, worse at long horizons | 01 vs 04 | Compatible: decent on average, systematically compressed at the tails and long horizons (consistent with longshot bias). Whether the bias is exploitable net of spread is the open question | P | Own calibration test |
| 16 | **Polymarket-specific favourite-longshot evidence.** 01 cites the 292M-trade Kalshi+Polymarket paper; 06 says Polymarket-specific evidence not confirmed and one arXiv ID returned only references | 01 vs 06 | Cross-venue evidence exists; Polymarket-only unconfirmed. 01 and 06 cite the same underlying paper (not independent) | P | Own Polymarket calibration |
| 17 | **Polymarket arbitrage.** 04: "strong (within PM)". 01: low-med. 06: large in 2024-25 but a speed/capital game, probably decaying | 01/04/06 | $40M is one paper's estimate for Apr 2024-Apr 2025 (grade B). Current capacity for us is unknown and probably small | U | Recorded books (H-O6) |
| 18 | **Polymarket fee levels.** Up to ~3% vs 1.56% on 15-min crypto markets (06); "dynamic fee, highest near 50%" | 06 | Conflicting outlets | U | docs.polymarket.com fee page |
| 19 | **Polymarket rate limits.** /prices-history 1000/10s (official) vs 100/10s (third-party) (05) | 05 | Official docs beat third-party | P | Test live |
| 20 | **Binance forceOrder semantics.** "latest" vs "largest" per second (05, changelog 2026-04-09 via Chinese text) | 05 | Unknown. Either way it is lossy (max 1 event/symbol/sec; CoinGlass confirms undercount) | U | Binance official changelog |
| 21 | **Kalshi taker/maker losses.** 01 attributes to Buergi et al. 2025; 06 to Whelan/VoxEU | 01 vs 06 | Likely the same study with different author spellings. Single-venue, pre-2025 fee schedule | P | Read the paper |
| 22 | **Share of losing Polymarket wallets.** 69.2% (Galaxy), 84.1% (Sergeenkov), ~70% (defioasis); "top 3% capture 27%" (06 Yale) vs "~3% skilled capture ~30%" (01/04) | 01, 04, 06 | Definitional (realized vs total, window, multi-wallet users). Order of magnitude: most lose, profit concentrated | P | Own on-chain computation |
| 23 | **Arbitrage/copy-trading latency evidence.** 06: one project page says most edge survives seconds-to-minute delay; its sibling note says the lag probe measured the assumed lag | within 06 | Unresolved, vendor/blog | U | Our own markout logging |
| 24 | **Hack effect.** 01: BTC -1.51% on incident day (attribution unconfirmed) vs 44 thefts show no BTC effect | within 01 | Newer and larger sample says no BTC effect; stablecoin/victim token yes | P | - |
| 25 | **Macro sensitivity.** NY Fed SR1052: BTC "orthogonal" to macro news intraday. Bundesbank, arXiv 2302.10252, Block Scholes: significant negative response | within 01 | Likely sample period and surprise definition. Sign probably right for 2022-26, tradability unproven | U | Own event study |
| 26 | **Halving bottom timing.** 777-912 days after 2024-04-20 = 2026-06-06 to 2026-10-19 (my arithmetic). Today is day 939. Whether the cycle bottom is in (Jul low ~$57.8k) or the cycle is being "re-drawn" | 03 | Non-falsifiable by construction (N=3). Not a basis for sizing | U | Cannot be resolved with N=3 |
| 27 | **Fear & Greed predictive?** Weekly Granger says it predicts (52 obs); others say price leads sentiment | within 01, 04 | Short, fragile; price-leads is better supported | P | Own test |
| 28 | **Evidence-letter inconsistency across files.** 01 grades NY Fed paper "A" from a snippet; 06 grades a Dagstuhl extended abstract "A"; 02 and 03 use High/Med/Low | all | Re-graded uniformly in section 2 | R | - |

Unresolved after my checks: **#1, #3, #5, #7, #8, #12, #13, #17, #18, #20, #23, #25, #26**.

---

## 2. EVIDENCE GRADING

Scale: **A** peer-reviewed or primary data, replicated. **B** single credible study, preprint with disclosed sample, or exchange/regulator data. **C** vendor, blog or secondary summary. **D** folklore, anecdote, or unsourced. All grades are based on snippets, so every A/B has an extra caveat: "abstract not read". I downgraded sources whose own authors sell the product.

| ID | Claim relied on | Grade | Why |
|---|---|---|---|
| E1 | Retail front-end traders lost $1.11B net on Hyperliquid, fees $725M, 96% of liquidation volume (Dagstuhl AFT) | B | Single on-chain study, extended abstract, one venue |
| E2 | Kalshi takers lose ~32%, makers ~10% | B | One working paper, one venue, pre-2025 fees |
| E3 | Favourite-longshot bias across 292M Kalshi+Polymarket trades | B | Single preprint, summary only |
| E4 | Most Polymarket wallets lose (69-84%), profit concentrated | C | Media summaries, definitions differ |
| E5 | Volatility clusters/regime-switches; vol forecastable, direction not | A | Several peer-reviewed MS-GARCH papers |
| E6 | Calendar return anomalies do not persist; activity patterns do | A | Peer-reviewed (15M obs) plus DOW literature agreeing |
| E7 | Daily TS momentum in BTC is best-supported directional effect | B | In-sample, bull-dominated, conflicting post-2021 notes |
| E8 | Trend parameters are fragile | B | One hourly study, zero costs |
| E9 | 15-min reversal exists but gross 1.3 bp vs 5 bp round trip | B | Single non-peer-reviewed preprint |
| E10 | Funding sits at 0.01%/8h floor most of the time, ~11%/yr | B | BitMEX exchange data, one venue |
| E11 | Funding carry is real but compressing; negative in 2025 | B | Preprint + He et al.; magnitudes disagree |
| E12 | Oct 10 2025: ~$19B liquidated, liquidity vanished, ADL fired | B | CoinGlass vendor data, press-confirmed, undercount likely |
| E13 | Free liquidation feeds are lossy (Binance 1 event/sym/sec) | B | Exchange docs (via summary) |
| E14 | Polymarket low-probability deciles have 650-900 bps half-spread | B | Single preprint, 600 markets |
| E15 | UMA/Polymarket resolution disputes occurred (Ukraine, Zelenskyy, UFO, MSTR) | B | Multiple news reports; frequency unknown |
| E16 | ~$40M arbitrage extracted on Polymarket Apr 2024-Apr 2025 | B | One paper, decay unknown |
| E17 | Exchange hacks do not move BTC | B | One preprint, 44 events |
| E18 | Token unlocks produce negative drift, mostly before the date | C | Vendor research, correlational |
| E19 | Listing announcements: positive but front-run | B | Old sample (pre-2020) |
| E20 | Monetary surprises move BTC/ETH (negative) | B | Contradicted by NY Fed SR1052 |
| E21 | Fear and Greed, Google attention, stablecoin mints follow price | B | Several peer-reviewed/working papers, some disputed |
| E22 | ETF flows confirm rather than predict | C | Vendors on both sides |
| E23 | Weekend/off-hours depth is thin; weekend volume share fell 24% to ~16-17% | C | Kaiko via secondary press |
| E24 | Depth swings up to 87% intraday, trough ~21:00 UTC | C | One pair, one venue, vendor |
| E25 | Heatmaps are modelled estimates; vendors disagree | C | Vendor documentation, no benchmark |
| E26 | Liquidations act as a "magnet" | D | No data |
| E27 | Stops cluster at round numbers (FX) | A | Osler, J. Finance 2003; FX only |
| E28 | Deflated-Sharpe / Harvey-Liu haircut methods | A | Method papers |
| E29 | Four-year halving cycle timing | D | N=3, retrospective, non-falsifiable |
| E30 | MVRV/realized-price bottom indicators | C | In-sample vendor claims |
| E31 | Global M2 leads BTC ~10 weeks | D | Lag tuned after the fact |
| E32 | BTC-Nasdaq/DXY/gold correlations (and their instability) | C | Vendor charts |
| E33 | CME gaps "fill" | D | No time bound or study |
| E34 | Coinbase premium predicts BTC | D | No test |
| E35 | Dealer gamma/GEX moves spot | C | Vendor model, dealer sign unobservable |
| E36 | Month-of-year seasonality (Oct/Nov) | C | 13 obs per month, outlier mean |
| E37 | Fed hiked Sept 16 2026 to 3.75-4.00%, held Oct 28 | B | federalreserve.gov snippets (my search); statements not read |
| E38 | CPI surprise explains ~80% of first-hour BTC move | C | 12 events, vendor |
| E39 | Polymarket wallet copy trading has edge after latency | D | No study found; our own data shows none |
| E40 | Informed wallets trade ahead of news on Polymarket | C | Press and think-tank estimates, flagged as inference |

**Tally (40 claims): A = 4 (E5, E6, E27, E28), B = 18, C = 12, D = 6. So 18 of 40 (45%) rest only on C/D sources, including every claim about cycles, M2, heatmaps, CME gaps, Coinbase premium, gamma, seasonality and wallet copy trading. No crypto alpha claim is A; the A items are about volatility, calendar non-persistence, methods and FX.**

**Independence warning.** Many "independent" workstream claims trace to the same few underlying studies (Kalshi/Whelan, arXiv 2602.19520, He et al. perps, Baur et al., Dagstuhl, K33 funding n=7, DWF/FalconX on ETF). Convergence across files is therefore weaker than it looks.

---

## 3. CONVERGENCE

### Supported independently by 3 or more workstreams (and how independent the sources really are)

| Conclusion | Files | Source independence |
|---|---|---|
| Costs (taker fee, spread, slippage) are the dominant, best-measured loss; many "edges" are gross-only | 02, 04, 05, 06, 01 | Medium: Hyperliquid, Kalshi, 15-min reversal studies are distinct |
| Leverage + thin liquidity cause cascades and ADL; stops fill badly; venue-specific plumbing risk | 01, 03, 04, 05, 06, 02 | Low: all lean on the same 10-10-2025 event (N=1) plus Jan-31-2026 |
| Calendar/seasonal return effects are unstable; liquidity/activity patterns are not | 02, 03, 04, 05 | Low: mostly Baur et al. |
| Sentiment, flows, stablecoin mints, Google attention mostly follow price | 01, 03, 04 | Medium |
| Small-N vendor "signals" (funding n=7, CME gaps 79/80, M2 lag, MVRV zero false signals, max pain 5/8) are not tradeable evidence | 01, 02, 03, 04, 05 | High: independent cases of the same flaw |
| Overfitting/multiple testing is the default failure; keep a trial ledger | 01, 02, 03, 04, 06 | High (method literature) |
| Polymarket resolution risk is real and non-hedgeable; thin books and wide low-probability spreads | 01, 03, 05, 06, 04 | Medium |
| Volatility/liquidity state is forecastable, direction is not; use regimes for sizing and stand-aside | 02, 03, 05, (01 event vol) | Medium |
| Regime change (ETF era, post-2024, fee changes) makes older studies unreliable | 02, 03, 04, 05, 06 | Medium |

### Supported by only one or two workstreams (treat as leads)

| Conclusion | Files | Note |
|---|---|---|
| Daily trend following is the best-supported directional rule | 02, 06 | Shared sources (Liu-Tsyvinski, Han-Kang-Ryu); bull-dominated sample |
| Favourite-longshot bias is exploitable (net) | 01, 06 (05 for spreads) | Same Kalshi/arXiv papers; net-of-fee exploitability untested |
| Funding extremes as contrarian signal | 01, 02, 04 | n=7 base; K33 |
| Token unlock timing (short at T-30, not T-0) | 01 only | Vendor data |
| Listing/hack/regulatory event effects | 01 only | Old samples |
| Stablecoin supply contraction (-$14.2B) as risk-off | 03 (04 H5 tests) | Lead/lag unknown |
| Polymarket odds lead underlying crypto | 04 only (found nothing) | Pure speculation |
| Wallet copy-trading survivorship | 06 only | Plus our own data |
| Combinatorial arbitrage capacity for small accounts | 04, 06 | Likely bots-first |
| Hyperliquid stress leads Binance | 05 only | Untested |

---

## 4. LOSS MAP (ranked by evidence strength times how often it hits us)

| Rank | Way we lose | Evidence (grade) | Concrete rule to reduce it |
|---|---|---|---|
| 1 | **Taker fees + spread + slippage** | E1 (B): fees $725M of $1.11B loss, front-end crosses spread on 85% of volume. E2 (B): takers -32% vs makers -10%. E9 (B): 1.3 bp gross vs 5 bp cost | R1. No hypothesis is accepted unless pre-registered net edge per trade >= 2x measured round-trip cost, and it survives at 2x costs. R2. Default to limit/maker orders; taker only to exit a risk rule. R3. Measure realised cost per fill from day one |
| 2 | **Leverage, liquidation, ADL, cross-margin, collateral priced by thin books** | E1 (B): 96% of liquidation volume; E12 (B) | R4. Isolated margin; liquidation distance >= 3x stop distance; leverage is an output of risk-per-trade <= 1% equity. R5. No collateral priced by the same venue's thin book (10-10 USDe/BNSOL/WBETH). R6. Max one venue holds >X% of capital (set X before live). R7. Hedged does not equal safe: carry legs sized for ADL |
| 3 | **Overfitting, multiple testing, small N** | E28 (A); 02 Harvey-Liu haircut: SR<0.4 loses >50% | R8. Trial ledger (section 5.2); one-shot holdout; drop any result with deflated Sharpe < 0.5 or fewer than 30 independent events |
| 4 | **Thin books / off-hours / stress "phantom liquidity"** | E12, E23, E24 (B/C) | R9. No new leveraged entries or adds on weekends and ~20:00-23:00 UTC; size to a live book walk, not top-of-book. R10. Stand-aside when 10 bp depth falls >70% vs 1h median and spread widens >3x (to be tested, D2) |
| 5 | **Longshot overpayment and wide Polymarket spreads** | E3, E14 (B) | R11. Never buy < 10c as a taker; assume 6-9% half-spread there; trade only if edge >= 2x (spread + fee) |
| 6 | **Polymarket resolution/oracle risk** | E15 (B, frequency unknown) | R12. No size in subjective-resolution markets; max loss per market <= 1% equity; no holding of "99c" contracts as free money; read rules and UMA history before entry |
| 7 | **Copy-trading: survivorship + lag + fees + crowding** | E39 (D), our own results (section 7) | R13. Select wallets only point-in-time (leaderboard snapshots as of the decision date); log book at signal and at +5s/30s/2m; drop if pooled 30s-delay net ROI <= 0 at n >= 1,500 independent bets |
| 8 | **Edge decay and regime change** | E11 (B); fee changes on Polymarket (06); ETF era | R14. Every edge must hold in the post-2024 subsample; live kill-switch on rolling 60-day performance |
| 9 | **Unstable correlations, lag mining** | E31 (D), E32 (C) | R15. No correlation-based hedging or sizing unless out-of-sample R^2 > 0 vs constant baseline; one pre-registered lag only |
| 10 | **Trading headlines after the move / against informed flow** | E40 (C), 01 leakage evidence | R16. Do not fade sudden jumps in government/military Polymarket markets; do not chase post-announcement crypto headline moves |
| 11 | **Funding bleed on long leveraged perps** | E10 (B) | R17. Budget ~11%/yr floor as holding cost; no multi-week levered long without a trend filter |
| 12 | **Hostile-regime trading (trend in chop, carry in funding flips, knife-catching in cascades)** | E7, E11 (B) | R18. Regime gate: flat when trend filter off; no dip-buying inside a cascade window; no cycle-based "bottom" sizing (N=3) |
| 13 | **Data errors / wrong narratives** | 01 Fed conflict (resolved only by primary domain), E12 undercount | R19. Two-source rule for any number that triggers an action; use primary domains |

---

## 5. OWN HYPOTHESES

### 5.0 Deduplication: 56 source hypotheses into 11 selected

The files contain 56 hypotheses (01:11, 02:9, 03:10, 04:10, 05:7, 06:9). Overlaps merged:

| Selected | Merges | 
|---|---|
| D1 Sizing/leverage rules | 06-H7, 05 checklist, 02 trap 13 |
| D2 Stress stand-aside | 05-H4, 05-H5, 02-H8 (as flag), 04-H2 (as test of continuation vs snapback) |
| D3 Execution windows | 05-H3, 03-H6/H7, 02-H6, 04 session notes |
| D4 Polymarket venue rules | 05-H6, 01-H9 (cost side), 06 cost points |
| D5 Event-window blackout | 01-H1/H2 (vol only), 03-H5 (vol only), 03 Dec 8-9 |
| O1 Trend ensemble + regime gate | 02-H1/H2/H3/H9, 06-H5, 03-H4 |
| O2 Polymarket longshot/favourite | 01-H9, 06-H4, 03-H10 (as a conditioner) |
| O3 Funding-extreme contrarian | 01-H8, 02-H8, 04-H1 |
| O4 Delta-neutral carry viability | 06-H6 |
| O5 Wallet copy trading, narrow | 06-H1/H2/H3 |
| O6 Polymarket logical-arb feasibility | 04-H10, 06-H9 |

Parked or rejected (with reason): CME gap (D grade, needs CME data, 02-H7/04-H9); CPI/FOMC directional (01-H1/H2, 03-H5: needs paid consensus data; the blackout rule tests only vol); token unlock, listing, hack (01-H3/H4/H5: need paid/vendor event data, old samples; revisit later); Fear and Greed (01-H6, n<15 episodes); ETF flow (01-H7, 04-H4: confirm-only, short sample); stablecoin impulse (03-H3, 04-H5: lead/lag unknown, revisit with DefiLlama data in week 4+ as exploratory, not in the ledger's confirmatory family); Coinbase premium, M2, gamma, month-of-year, halving time (03-H1/H8, 04-H6/H8, 02-H6): D/C grade, expected FAIL; MVRV floor (03-H2): N=3; dominance/alt-season (03-H9): use only as "stay out of alt beta" note; heatmap magnet and round-number sweeps (05-H1/H2): need paid Coinglass Pro data (see data plan), low prior, possible later; BTC-leads-alts (04-H3), short-horizon reversal (06-H8): net edge below costs by published numbers (1.3 vs 5 bp), only revisit as maker with measured fills; Hyperliquid venue lead (05-H7): later; Polymarket calendar (03-H10): fold into O2 as a covariate; macro gating (04-H7, 03-H4): useful only as vol filter, folded into D2.

### 5.1 The 11 hypotheses

Common protocol for every item: data split into design (first 60%), validation (next 15%), and a final 25% locked holdout touched once; costs: perp taker 5 bp/side assumed (03; replace with our actual fee tier) plus measured half-spread and slippage by size, plus actual funding on the position; re-run at 2x costs; Polymarket costs from the recorded book (walk the book for our clip), fee per current docs (conflict: 1.56-3% on 15-min crypto; stress at 2%), capital lock at a T-bill hurdle; report n, mean, median, hit rate, cluster-bootstrap 95% CI (cluster by event or day), deflated Sharpe with the ledger's trial count, and the result with the top 2 events removed.

#### DEFENSIVE (avoid-loss filters, sizing, venue rules)

**D1. Leverage and sizing cap reduces ruin and drawdown.**
- Statement: sizing at <= 0.25 Kelly of a conservatively estimated edge, risk per trade <= 1% equity, isolated margin, liquidation >= 3x stop distance, vol-targeted, cuts median max drawdown without cutting net Sharpe > 20%.
- Mechanism / other side: removes the liquidation channel (96% of liquidation volume is retail front-end, E1); the counterparty is the liquidation engine and MMs who absorb forced flow.
- Evidence: B for the loss channel (E1), D for the specific multipliers (06: no crypto Kelly evidence).
- Pass: on bootstrapped trade streams (1,000 paths) from O1/O2/O3, median max drawdown lower by >= 25% AND 5th-percentile terminal equity higher; ruin probability under full-Kelly-with-estimation-error shown to be materially worse. Fail otherwise.
- Data: our own trade streams (paper and backtest); venue margin rules from docs.
- Costs: as protocol; leverage cost = funding.
- Holdout: apply frozen parameters to the final 25% of each stream.
- Kill: if the cap lowers net Sharpe > 20% on holdout or does not lower drawdown >= 25%, drop the multiplier (keep isolated margin and liquidation-distance rules, which are structural).

**D2. Stress-state stand-aside (cascade early warning).**
- Statement: when (OI percentile in top decile) AND (3-day mean funding in top decile vs expanding window) AND/OR depth collapse (10 bp depth < 30% of 1h median with spread > 3x), the following 24h has a higher rate of >=5% BTC drops in 60 min and higher realised vol, enough that a "cut leverage/flat" rule saves more than it costs.
- Mechanism / other side: leveraged longs forced out; we stop being the forced seller. Counterparty is whoever buys cheap after.
- Evidence: C (post-hoc blogs, N=1: Oct 2025), plus B for liquidity-vanishes-in-stress (E12). Honest prior low: few true cascades (Oct 2025, Jan 31 2026, a handful more).
- Pass: precision >= 2x base rate in the next 24h with >= 15 cascade events (state power honestly); the "reduce" rule's cost (missed upside plus fees) < losses avoided on holdout.
- Data: Binance/Bybit/OKX/Hyperliquid funding, OI, 1-min klines (history), plus our recorded L2 depth and forced-order streams (forward only, see section 6). For events before recording starts, use funding/OI/price only.
- Costs: cost of standing aside = missed return; model as lost P&L.
- Holdout: events after the design cutoff; given few events, also run leave-one-event-out.
- Kill: < 15 events in holdout means "inconclusive, keep as risk rule on judgment, do not claim validated"; precision < 1.5x base rate means drop the funding/OI trigger, keep the depth trigger only if D3 supports it.

**D3. Execution windows: thin hours cost more and stop us out more.**
- Statement: weekend and 20:00-23:00 UTC windows have >= 30% lower 10 bp depth and >= 1.5x slippage for a fixed clip; a fixed-ATR stop is hit more often there.
- Mechanism: depth is structurally lower off-hours (E23/E24); the other side is market makers who widen.
- Evidence: C (Kaiko, Amberdata secondaries) but mechanism strong; E6 (A) says return anomalies do not persist, so this tests cost not direction.
- Pass: median depth and realised slippage thresholds met on >= 8 weeks of our own recording in both halves; if met, adopt R9 (no leveraged entries in those windows).
- Data: our own L2 snapshots (binance fapi depth, bybit, hyperliquid l2Book), aggTrades from data.binance.vision for realised slippage proxies.
- Costs: n/a (measures cost).
- Holdout: second half of the recorded period.
- Kill: effect < 15% or not stable across halves means no time-of-day rule; keep size-to-live-book-walk only.

**D4. Polymarket venue rules: cost and resolution traps.**
- Statement: effective cost of a $500 clip within 48h of resolution > 2x mid-life cost, and > 5% of subjective-resolution markets show disputes or >20-point jumps without public news; so a no-size rule for those markets is net-positive.
- Mechanism: wide low-probability spreads (650-900 bps, E14) and UMA token-weighted voting (E15). Other side: informed wallets and whales near resolution.
- Evidence: B (E14, E15), frequency unknown.
- Pass: both measured effects on >= 200 resolved markets (resolution/dispute flags via Gamma metadata), with market-clustered CI.
- Data: gamma-api.polymarket.com/markets (end dates, resolution fields, UMA status), clob.polymarket.com/prices-history, plus our recorded /book snapshots.
- Costs: measured from books.
- Holdout: markets resolved after the design cutoff.
- Kill: cost ratio < 1.3x and dispute rate < 2% means relax to a plain "check rules" checklist.

**D5. Macro-event blackout (vol/liquidity only, no direction).**
- Statement: in the window [-5, +60] min around FOMC statement (14:00 ET), FOMC presser, and CPI (08:30 ET), realised vol and spread are >= 2x same-clock windows on non-event days, so no new leveraged exposure there reduces loss.
- Mechanism: event vol and liquidity withdrawal; other side: fast MMs.
- Evidence: C/B (01 and 03 mention spikes and whipsaws; vol response is the safer claim than direction, and E5 supports vol forecastability).
- Pass: ratio >= 2x with bootstrap CI excluding 1 across >= 25 events per type, positive in ETF-era subset.
- Data: 1-min klines (Coinbase/Binance), Fed and BLS calendars (federalreserve.gov, bls.gov). Next live test: **FOMC Dec 8-9 2026**; write the rule before Dec 1.
- Costs: cost of abstaining = missed moves (reported, not hidden).
- Holdout: 2025-2026 events.
- Kill: ratio < 1.3x means drop the blanket blackout; keep only for leveraged positions near stop.

#### OFFENSIVE (alpha)

**O1. Ensemble daily trend, long/flat, vol-targeted, with regime gate (BTC, ETH, SOL).**
- Statement: equal-weight Donchian breakout lookbacks {20,50,100,200}, long/flat, vol target 20%, beats buy-and-hold on net risk-adjusted terms with materially smaller drawdown; works when efficiency ratio is high, not in chop.
- Mechanism / other side: slow information diffusion and herding; counterparties are late contrarians and forced sellers. Weak long-run reason to expect persistence; mostly drawdown avoidance.
- Evidence: B- (E7, E8; conflicting post-2021).
- Pass (all): holdout net Sharpe > buy-and-hold net Sharpe AND max DD <= 60% of buy-and-hold AND net Sharpe >= 0.5 AND positive in >= 2 of 3 coins AND shifted lookbacks (+/-20%) keep >= 70% of baseline Sharpe AND Sharpe >= 0.5 at 2x costs AND best 3 months < 50% of total return. Regime claim: top-tercile efficiency-ratio Sharpe exceeds bottom by > 0.5 in both design and holdout.
- Data: daily OHLC and funding history, BTC/ETH/SOL perps (data.binance.vision klines and fundingRate, or api.bybit.com, api.hyperliquid.xyz).
- Costs: taker 5 bp/side plus funding paid (~11%/yr floor on levered long), 2x stress.
- Holdout: last 25% in time (roughly 2025-2026, which is a bear/chop phase: a good test of the long/flat claim); also report the 2021-2026 subsample alone.
- Kill: fails the >=2-of-3-coins rule or holdout net Sharpe < buy-and-hold's AND DD benefit < 30%: drop. Note: current state (price below long MAs per 03, hike risk) means the model is probably flat today; that is a valid output.

**O2. Polymarket: avoid/sell longshots, buy favourites, as maker, in crypto, macro and politics markets.**
- Statement: contracts priced 0.85-0.97 at 7 days to close realise a win rate at least 2 pp above price after fees; contracts below 0.10 realise less than price. Excluded categories where bias is reportedly absent (Fed/rates).
- Mechanism / other side: optimistic retail takers overpay for longshots (E3); counterparty is longshot buyers. Prices compress toward 0.50 (Princeton). Edge pays makers more than takers (E2).
- Evidence: B (E3, E2); Polymarket-only confirmation open (conflict #16).
- Pass: net realised edge > 2 pp after fees, spread (or maker fills) and T-bill capital cost; cluster bootstrap by event (correlated strikes); disputes and delayed resolutions counted as losses; edge in >= 3 categories and in both halves; at least 300 resolved markets per bucket; max loss per event <= 1% equity.
- Data: gamma-api.polymarket.com (markets, outcomes), clob.polymarket.com/prices-history (fixed snapshots at 7d/1d before close), recorded /book for fill realism.
- Costs: maker with fill-probability haircut (assume 30-50% non-fill; unfilled = no trade, not a win), taker case at stressed 2% fee.
- Holdout: markets closing after the design cutoff (last 25% by close date).
- Kill: only one category carries it, or net <= 0 after capital cost and disputes, or maker fill rate < 20%: drop.

**O3. Funding-extreme contrarian (BTC, ETH, SOL perps).**
- Statement: funding 7d mean above the expanding-window 90th percentile (AND OI rising) predicts lower 3-7d returns; below 10th percentile the reverse.
- Mechanism: crowded leverage unwinds; other side: crowded longs.
- Evidence: D/C (K33 n=7, Presto 12.5% variance, E10 notes funding is mostly pinned at the floor, so extremes are rare).
- Pass: net mean > 0, block-bootstrap (3-day blocks) CI excludes zero, >= 30 independent episodes, positive in >= 3 of 4 calendar-year blocks; also pass if used as a flag that cuts O1 drawdown without lowering net Sharpe.
- Data: funding history and OI (fapi.binance.com/fapi/v1/fundingRate; OI history lookback may be only ~30 days on the API, unverified, so use data.binance.vision "metrics" bulk files or record forward), klines.
- Costs: funding paid/received, taker, 2x stress.
- Holdout: final 25%.
- Kill: < 30 independent episodes means "inconclusive" and parked, never traded as alpha; fails year-stability: drop.

**O4. Delta-neutral carry (spot long / perp short) viability for our size.**
- Statement: entering when trailing 7d annualised funding > cost of capital + 5pp yields net return above cost of capital over the last 12 months, worst 30-day drawdown < 5%, surviving a 10-10-style stress replay.
- Mechanism / other side: leveraged longs pay funding; counterparty is leveraged retail long.
- Evidence: B (E11), but compressed and negative in 2025 per one preprint.
- Pass: as stated plus survival of the 2025-10-10 ADL/collateral replay (forced reduction of the short leg) and "edge not only pre-2024".
- Data: funding history, spot and perp prices, venue margin rules (Binance data.binance.vision, Bybit, Hyperliquid info API).
- Costs: 2 legs x fees, borrow/margin, 10% margin-stress haircut.
- Holdout: last 12 months untouched.
- Kill: edge only before 2024, or net below cost of capital in holdout: drop. Prior of passing is modest and the return, even if real, is small.

**O5. Polymarket wallet copy trading, narrow version only.**
- Statement: (a) point-in-time top-N wallets do not beat size-matched random wallets (null); (b) a narrow specialist subset (>= 50 trades, >= 80% in one category, median hold > 24h, not news-reactive) has positive copy return at a 2-minute delay while the generic set does not.
- Mechanism / other side: persistent skill or information in a few wallets (E4: profit concentrated, 3% capture ~27-30%); but the leader's counterparty is also followed by us at a worse price.
- Evidence: D/C. Our own data: no book excludes zero.
- Pass: net return (after fee, spread, book walk) > 0 with cluster-bootstrap CI excluding 0 at delays 5s, 30s, 2m; n >= 300 per subset; return at 2m >= 50% of return at 0 delay; point-in-time selection only; top-N forward ROI minus random-set ROI > 0 in >= 3 of 4 non-overlapping windows.
- Data: data-api.polymarket.com (already in use), historical leaderboard snapshots (record daily from now), recorded /book at signal time and +5s/30s/2m markouts (record from now).
- Costs: as measured fills, not 1c flat.
- Holdout: wallets chosen on earlier data, evaluated only on later trades; one shot.
- Kill: pooled 30s-delay net ROI <= 0 at n >= 1,500 independent bets (or > 90 days), or specialist subset fails holdout: stop wallet copying as a strategy, keep the wallet feed only as a data source.

**O6. Polymarket logical/crypto-ladder arbitrage: fillable for a small account?**
- Statement: monotonicity and sum violations in linked markets (for example BTC "above X by date" ladders) exceeding spread + fee + 2c are executable at >= $200 with >= 80% of legs filled at displayed size, and persist several seconds.
- Mechanism / other side: slow or fragmented quoting; competitors are bots (E16: $40M extracted 2024-25).
- Evidence: B for existence (E16), unknown for current capacity.
- Pass: from recorded books (not mid), >= 80% of flagged opportunities fully fillable for >= $200 with leg risk, net return after gas/fees and capital lock above hurdle, persistence >= measured latency. Secondary: does a Polymarket crypto-threshold odds change lead futures at 1-60 min (cross-correlation peak at positive lag, p < 0.005, net positive trade)? Prior: low.
- Data: our recorded CLOB books for linked markets plus spot/perp 1-s to 1-min prices.
- Costs: displayed depth, fees, gas.
- Holdout: second half of recorded period.
- Kill: fillable share < 50%: drop.

### 5.2 Hypothesis-trial ledger (multiple-testing control)

File: `market-research/ledger/trials.csv`, committed to git before any data pull for the test (git timestamp is the pre-registration). One row per variant tried, never deleted.

| Field | Content |
|---|---|
| id, family | e.g. O1-v3; family = DEFENSIVE / OFFENSIVE-crypto / OFFENSIVE-PM |
| parent hypothesis, commit hash | pre-registration commit |
| frozen params | lookbacks, thresholds, coins, horizons, venues |
| split dates | design/validation/holdout boundaries fixed before the run |
| status | registered, design, validation, holdout-burned, paper, live-small, killed |
| N_trials_cumulative | running count of every variant touching the same data (parameters x coins x horizons x regimes all count) |
| result | n, net mean, CI, deflated Sharpe at current N, holdout outcome |
| kill criterion + date | copied from section 5.1 |

Rules: (1) alpha budget: offensive family tested at total alpha 0.05 with Holm correction across the 6 offensive hypotheses (per-test 0.0083 for the primary comparison), defensive family reported separately because failing them costs nothing; (2) the holdout is touched once per hypothesis; a burned holdout cannot be reused for a modified version (a new version needs fresh forward data); (3) any parameter or filter change after seeing validation results counts as a new trial and increments N; (4) exploratory ideas (stablecoin impulse, ETF flows, etc.) live in a separate "exploratory" table, never traded, never counted as confirmation; (5) forward paper results are a separate holdout that is stronger than any historical one; (6) a hypothesis is "alive" only if it passes with deflated Sharpe > 0.5 at current N.

### 5.3 Honest assessment of our existing Polymarket wallet paper trading

Numbers as given by the user (13 days, ~4,600 settled bets, 16 books; consensus4 +8.4% ±12.5%, top20-sized +5.0% ±8.5%, consensus -5.1% ±9.8%, slow20 -18.3% ±16.8%). The README does not itself contain these figures.

- **No evidence of edge, no evidence of no edge.** No ROI band excludes zero. The widest-picture read: bands of ±8 to ±17 pp are huge relative to any plausible edge (O2-class edge is 2-5 pp).
- **The "winners" are consistent with selection from noise.** Out of 16 books, the expected best result under zero true edge is roughly the 1.8-sigma level (expected max of 16 standard normals ~1.77). With standard errors around 4-9 pp (the ± bands look like 95% intervals), noise alone gives a best book of roughly +7 to +16 pp. The best observed book, +8.4%, sits inside that range. The worst book (-18.3%) is similarly within noise. Also several books are overlapping variants of the same consensus rule, so they are strongly correlated: effective number of independent books is far below 16, which makes the max slightly less extreme but also means the books are not independent confirmation of each other.
- **The bands are probably too narrow.** Bets are correlated (same market, same event, esports clusters, several wallets betting the same side, favourites near resolution), so independent n is smaller than 4,600. Use a cluster bootstrap by market/event.
- **Power arithmetic (assumption: per-bet stake-normalised ROI has standard deviation near 1, true for roughly mid-price binary bets; longshots are higher).** A ±12.5 pp 95% band implies ~245 independent bets; detecting a true +5% edge needs a band of about ±5 pp, which is ~1,500 independent bets per book (about 6x more than consensus4 has), roughly 80+ days at that book's current rate of ~19 bets/day. Halving a band needs 4x data. So 13 days could never settle the question.
- **Fill realism is the unknown that matters most.** The paper agent walks the live book at detection time, which is better than the flat 1c slippage in the backtest. But detection delay vs the wallet's own trade time, queue/own-impact, fees at live schedule, and resolution/dispute losses are not evidenced as modelled. The only external measurements of copy trading are vendor-grade (CEX leaders 97% profitable vs followers ~44-48%, no decomposition, E39 D).
- **Structural reasons for scepticism (not proof):** 70-84% of wallets lose (E4, C) so any top-N list contains lucky wallets by construction; leaderboards drop blown-up wallets (survivorship); price moves after a visible wallet trade are unmeasured; informed wallets exist (E40) so copying them can work, but they are also the ones whose trades move prices fastest.
- **What to do:** (1) freeze the book set now, no new variants without a ledger entry (each new book is a new trial); (2) add markout logging: book mid at wallet trade time, at our detection time, and +5s/30s/2m/10m after; (3) compute pooled and per-delay ROI with market-clustered bootstrap, and compare to a random-wallet placebo book; (4) snapshot the leaderboard daily so selection is point-in-time; (5) apply kill criterion in O5. Keep the infrastructure: it is a free tick-level data collector for D4, O2, O5, O6.

---

## 6. DATA PLAN

### 6.1 Minimum data needed

| Need | For | Free source / endpoint | History |
|---|---|---|---|
| BTC/ETH/SOL 1-min and daily OHLC, spot and perp | O1, O3, D2, D3, D5 | data.binance.vision (bulk klines, fundingRate, aggTrades, metrics incl. OI); fapi.binance.com `/fapi/v1/klines`; api.bybit.com `/v5/market/kline`; api.exchange.coinbase.com `/products/BTC-USD/candles`; api.hyperliquid.xyz `/info` (candleSnapshot, fundingHistory) | 2019/2020 onward |
| Funding history | O3, O4, D2 | `/fapi/v1/fundingRate` (Binance), `/v5/market/funding/history` (Bybit), Hyperliquid `fundingHistory` | multi-year |
| Open interest | D2, O3 | data.binance.vision "metrics" bulk; API OI history may be limited (~30 days, unverified); otherwise record forward | partial |
| Depth / forced orders | D2, D3 | Not available historically for free. Record forward: Binance `wss://fstream.binance.com` depth and forceOrder, Bybit and Hyperliquid websockets. Paid history (Tardis, Amberdata, Coinglass Hobbyist $29/mo) only if a test needs pre-recording data | forward only |
| Polymarket resolved markets and prices | O2, D4 | gamma-api.polymarket.com (markets), clob.polymarket.com `/prices-history`, `/book`; data-api.polymarket.com (trades/activity; already used by our repo) | 2022 onward |
| Polymarket books | D4, O5, O6 | record forward (CLOB websocket/REST) | forward only |
| Fed/BLS calendars | D5 | federalreserve.gov, bls.gov | complete |
| Rates/USD/credit | vol-filter in D2 (exploratory) | fred.stlouisfed.org / api.stlouisfed.org (DFII10, DGS10, DTWEXBGS, BAMLH0A0HYM2) | decades |
| Fear and Greed, stablecoin supply | exploratory only | api.alternative.me/fng, stablecoins.llama.fi | 2018 / 2017 onward |
| CPI/FOMC consensus (surprises) | directional event tests (parked) | no reliable free source; park | - |
| ETF flows | parked/exploratory | farside.co.uk (scrape, may block) | 2024 onward |
| Paper full-text reading (verify graded claims) | all | arxiv.org, nber.org, newyorkfed.org, docs.polymarket.com, developers.binance.com | - |

### 6.2 Minimal host set to re-request (the earlier network change was declined; this is the smallest list that unlocks testing)

**Tier 1, needed to run any test (11 hosts):**
`data.binance.vision`, `fapi.binance.com`, `api.bybit.com`, `api.hyperliquid.xyz`, `api.exchange.coinbase.com`, `gamma-api.polymarket.com`, `clob.polymarket.com`, `data-api.polymarket.com`, `fred.stlouisfed.org`, `api.stlouisfed.org`, `api.alternative.me`.

**Tier 2, for exploratory work and verification (optional, ask only if Tier 1 is granted):** `stablecoins.llama.fi`, `ws-subscriptions-clob.polymarket.com` and `fstream.binance.com` (websocket recording), `arxiv.org`, `docs.polymarket.com`, `developers.binance.com`, `www.federalreserve.gov`, `www.bls.gov`, `www.nber.org`.

Caveats: (1) Binance futures endpoints are geo-restricted for some regions; if the sandbox egress is blocked, use Bybit, Hyperliquid and Coinbase instead and treat Binance as a bonus. (2) Hosts must be exact names (wildcards are refused). (3) Continuous recording should run on an always-on small VM or on the existing GitHub Actions workflow, not in this sandbox (sessions end). Actions jobs are time-limited (the existing paper workflow runs ~5.5 h stretches), so a cheap VM is better for 24/7 L2 recording.

### 6.3 What to start recording going forward (every day of delay is lost history)

1. **Polymarket:** /book snapshots for all crypto-related markets and any market a watchlist wallet trades (every 5-10 s for active ones, at least every 60 s for others); at each paper-bet detection, store book at wallet-trade time, at detection, and +5s/30s/2m/10m; daily leaderboard snapshots; market metadata and resolution/dispute fields.
2. **Perps (BTC, ETH, SOL):** top-20 depth every 1-5 s on Binance, Bybit, Hyperliquid; forceOrder/liquidation streams (accept lossy); funding (each interval); OI every 5 min; mark/index/last prices; trades.
3. **Own fills (even paper):** timestamp, intended price, book walk, realised cost. This builds the cost model from our own execution, not vendor claims.
4. **Event calendar log:** FOMC, CPI, big scheduled items, with 1-min price/vol/spread around them.
5. **Source snapshots:** archive any vendor number we use in a decision (price, odds, liquidation total) with timestamp, to settle future conflicts like #1 and #3.

---

## 7. TIMELINE

Dates relative to today, 2026-11-15. Calendar anchor: FOMC Dec 8-9, 2026 (03; confirm); next CPI release date to confirm on bls.gov.

| Window | Do | Output / gate |
|---|---|---|
| **Weeks 0-2 (to Nov 29)** | Re-request Tier 1 hosts. Stand up recorder (VM or Actions) for section 6.3. Create ledger and commit pre-registrations for D3, D4, D5, O1, O2 (rules above, frozen). Freeze wallet books; add markout logging and daily leaderboard snapshots. Settle conflicts #1, #3 from primary price/rates data on first successful pull. Apply defensive rules R1-R19 as manual discipline immediately (they cost nothing to test) | Hosts granted; recorder running; ledger committed |
| **Weeks 2-4 (to Dec 13)** | Pull history; run O1 (daily, cheap), D5 vol ratio, O3 and O2 design-period tests. Write the D5 blackout rule by Dec 1, live-observe FOMC Dec 8-9 (vol/spread vs blackout assumption; no directional bet). Wallet analysis with clustered bootstrap and placebo. Begin D3 depth stats from recorded data (needs 8 weeks for firm result; early look only) | First pass/fail on O1, O2, D5; wallet verdict "inconclusive vs null" |
| **Weeks 4-8 (to Jan 10, 2027)** | One-shot holdout runs for survivors only. Forward paper for any survivor. D3 and D2 and D4 with recorded data. O5 kill decision at n or time limit. O4/O6 feasibility from recorded books. Decide go/no-go on tiny live size | Decision memo: which defensive rules adopted (expect D1 structural parts, D3, D4, D5), which offensive hypotheses alive or dead, with deflated Sharpe at final trial count |

Decision rule at week 8: go live (small, maker-first, risk per trade <= 1%) only for a hypothesis that passed validation and holdout net of 2x costs, AND has >= 4 weeks of forward paper agreeing in sign. Otherwise stay on defensive rules only.

---

## 8. REGIME CONTEXT (as reported, unverified; do not trade from it)

Fed hiked Sept 16 2026 and held Oct 28 with two hawkish dissents (B, primary-domain snippets); inflation re-accelerating per October CPI +0.4% m/m (C); strong ISM (C); Dec hike odds unknown (conflict #3); stablecoin supply contracting by ~$14B, largest since 2022 (C, lead/lag untested); Fear and Greed 13 (C); BTC about $74k on Nov 11 (B-) and possibly lower since (03, unconfirmed); BTC 200-week MA near $67k. This resembles a tightening-against-risk regime, but the 2022 analogue is N=1 and cannot support sizing. Practical use: a trend model like O1 would likely be flat or defensive here; hold off on any contrarian or "bottom" bets (E29, E30 are D/C).

---

## 9. VERDICT: the realistic probability-of-edge picture

These are my subjective priors from reading snippets, not measured. They are calibrated to be modest.

| Item | Prior that it passes its pre-registered holdout net of 2x costs |
|---|---|
| D1 structural parts (isolated margin, liquidation distance, risk per trade) | ~90% (it is arithmetic, not alpha); multiplier tuning ~50% |
| D5 event-window vol/spread ratio >= 2x | ~70% |
| D3 thin-window cost premium | ~65% |
| D4 Polymarket cost/resolution rules | ~60% |
| D2 cascade early warning | ~30% to pass, ~60% likely "inconclusive" for lack of events |
| O1 ensemble trend (relative to buy-and-hold, risk-adjusted) | ~30% |
| O2 Polymarket FLB net of costs, as maker | ~25-30% |
| O4 delta-neutral carry above cost of capital | ~20% |
| O3 funding extremes | ~10% |
| O6 small-account logical arb | ~10% |
| O5 wallet copy trading generic | ~5%; narrow specialist ~10-15% |
| Chance at least one offensive hypothesis is a real, durable, net-positive edge usable at our size | ~35% over the full programme; ~10% that we can confirm one within 8 weeks given sample sizes |

Candid read:
- **Where odds are meaningfully higher is not in prediction, it is in position structure:** be the maker, avoid the long-tail contracts you would otherwise buy, keep leverage and liquidation exposure small, avoid thin windows and event minutes, and stay flat when the regime filter says so. These shrink loss channels that have large-sample evidence (E1, E2, E3, E14).
- **No directional crypto signal in these six files is strong enough to trade today.** Even the best (daily trend) is B- and mostly valuable as drawdown control.
- **The wallet book is not evidence of skill** and may be net negative after realistic lag; the cost of keeping it as a data feed is low.
- **Biggest risk to this whole plan** is not a missing indicator; it is us over-testing a small dataset. The ledger and one-shot holdouts exist to prevent that.
- 18 of 40 key claims rest only on C/D sources, and many apparent confirmations share the same underlying studies; the next step with the highest information value is to read the primary papers (E1, E2, E3, E14, E16) once the hosts are allowed.
