# 02 - Charts, Technicals and Volatility Regimes (crypto majors, perps/spot)

Date compiled: 2026-11-15. Workstream: price-action evidence, regime identification, dead indicators, cost realities, decay/overfitting.

## Method and limits of this document (read first)
- Evidence was gathered through WebSearch result summaries only. WebFetch failed (DNS-blocked: arxiv.org, nber.org, quantpedia.com, abarbon.com, edgealchemy.robotwealth.com all unresolvable from the sandbox). So I did NOT read any paper's full text. Every figure below is what the search summaries reported from the abstract/secondary page; treat them as leads to verify, not as audited facts.
- Market-data APIs are blocked, so there is no own-data verification. No numbers here are invented; where a number is missing it is marked "not available".
- Confidence labels: High = replicated or structurally obvious; Medium = one credible source or mixed replications; Low = blog/vendor/single in-sample study.

## 1. Key findings

1. **Slow trend/time-series momentum in BTC has the best (but not clean) support.** Liu & Tsyvinski (NBER w24877) report time-series momentum at daily/weekly horizons in BTC, ETH, XRP, in-sample ([NBER](https://www.nber.org/system/files/working_papers/w24877/w24877.pdf); summary via [CXO Advisory](https://www.cxoadvisory.com/?p=31471) which stresses it is in-sample). Donchian-ensemble trend work reports Sharpe >1.5 and ~10.8% annualized alpha vs BTC ([Zarattini/Pagani/Barbon "Catching Crypto Trends", via IDEAS](https://ideas.repec.org/p/chf/rpseri/rp2580.html)); Grayscale reports a 50-day MA rule Sharpe 1.9 vs 1.3 buy-and-hold, Jan 2012-Jul 2023 ([Grayscale](https://research.grayscale.com/reports/the-trend-is-your-friend-managing-bitcoins-volatility-with-momentum-signals)). Much of that benefit is drawdown avoidance in 2022 and a sample dominated by BTC's 2012-2021 super-trend.
2. **Parameter fragility is the central trend-following risk.** A hourly BTC SMA/EMA/DEMA study (2011-2019, zero costs assumed) found small window changes cause large Sharpe swings ([arXiv 2009.12155](https://arxiv.org/pdf/2009.12155)). Use ensembles, not single "best" lookbacks.
3. **Post-2021 trend performance is contested, no clean decay measurement exists.** Coinbase (Sep 2022) said TSMOM underperformed buy-and-hold in all but two quarters since 2021 (costs omitted) ([Coinbase](https://www.coinbase.com/institutional/research-insights/research/monthly-outlook/trend-following-in-uncertain-times-september-2022)); Kaiko says a momentum index outperformed BTC since 2021 ([Kaiko](https://marketing.kaiko.com/hubfs/Research/VHASHMOM%20Index%20in%20Focus.pdf)). A 2025 Springer paper finds no consensus on crypto momentum profits and that one outlier is 37% of the compounded return ([Springer](https://link.springer.com/article/10.1007/s11408-025-00474-9)).
4. **Short-horizon (hours) behaviour: reversal after large moves, but momentum at the open/close intraday window.** Minute-data Bitstamp study found significant negative autocorrelation at 1, 2, 4-hour horizons, stronger reversals after bigger moves ([search lead, CORE](https://core.ac.uk/download/362651763.pdf), details unverified). Shen/Urquhart/Wang: first half-hour predicts last half-hour, strongest in high volume/volatility sessions ([Reading](https://centaur.reading.ac.uk/100181)). A 10-minute study of 26 assets found reversal after low-volume intervals with gross Sharpe up to 2.96 - gross, per CXO summary ([CXO](https://www.cxoadvisory.com/?p=31471)). These are high-turnover edges; costs decide them.
5. **Daily overreaction: tradeable-after-cost evidence is weak.** 2013-2017 daily study found bigger next-day moves after abnormal days but concluded the opportunities did not survive transaction costs ([Brunel GMC](https://www.brunel.ac.uk/economics-finance-and-accounting/research/pdf/1801-Jan-GMC-Price-Overreactions-In-The-Cryptocurrency-Market.pdf)). Momentum after one-day abnormal returns was found in a different sample (2013-2020) ([Brunel GMC](https://www.brunel.ac.uk/economics-finance-and-accounting/research/pdf/1917-Oct-GMC-Momentum-effect-in-the-Cryptocurrency-Market-after-One-day-Abnormal-Returns.pdf)). Sign flips with sample = do not trust either.
6. **Calendar effects are unstable.** Baur et al. (15m+ observations, 7 exchanges): time-specific return anomalies "do not persist"; volume/activity patterns do persist (lower at local evening and weekends) ([Finance Research Letters 2019](https://econpapers.repec.org/RePEc:eee:finlet:v:31:y:2019:i:c:p:78-92)). Reverse-Monday effect appears in 2010-2017 data but a 2013-2019 GARCH study found no classical DOW effect, only lower weekend risk ([Haifa](https://cris.haifa.ac.il/en/publications/bitcoin-and-the-day-of-the-week-effect/)). Quantpedia blog: 22:00-23:00 UTC strongest, 03:00-04:00 UTC weakest, hourly Gemini 2015-2022; a hold-only-that-window strategy reported ~33% annualized, vol ~20.9%, max DD ~-22.5% - blog, in-sample, costs not verified ([Quantpedia](https://quantpedia.com/are-there-seasonal-intraday-or-overnight-anomalies-in-bitcoin/)).
7. **Volatility clustering/regime switching is the most robust statistical feature.** Markov-switching GARCH beats single-regime GARCH in BTC VaR backtests ([Ardia et al., SSRN](https://papers.ssrn.com/abstract=3180830)); two-state (high/low vol) structure in Markov-switching AR ([Emerald](https://www.emerald.com/insight/content/doi/10.1108/S1569-376720190000020020)); MS-GARCH/component GARCH beat plain specs in a 2025 study ([Intellectual Economics](https://ojs.mruni.eu/ojs/intellectual-economics/article/view/8889/6176)). Volatility is forecastable; direction mostly is not. Use vol for sizing/filters, not as a direction signal.
8. **Vol compression -> expansion is plausible but untested as a trade.** Only news/analyst commentary found (Bollinger bandwidth articles, e.g. [CoinDesk 2023](https://www.coindesk.com/markets/2023/10/18/bitcoin-bollinger-bandwidth-signals-wild-price-swings-ahead/)); they say compression signals a bigger move, not direction, and a Glassnode researcher called it an observation with no predictive value. Structural vol decline confounds bandwidth thresholds: BTC 2025 realized daily vol ~2.24%, lowest annual on record (vs 3.34% 2022, 2.80% 2024) per K33 via [CryptoSlate](https://cryptoslate.com/bitcoin-turned-less-volatile-than-nvidia-as-institutional-rails-absorbed-570-billion-in-swings-during-a-boring-year/). Absolute-level vol thresholds from earlier eras will mis-classify; use rolling percentiles.
9. **CME gap fills: no rigorous study.** CoinDesk tally said all but one of previous 80 gaps eventually filled ([CoinDesk](https://hotfix.coindesk.com/markets/2025/03/11/bitcoin-fills-yet-another-cme-futures-gap-as-btc-price-dropped-to-usd76-700)); TradingView claims ~95% unsourced. "Eventually filled" has no time bound and is nearly guaranteed for a random walk over long horizons; the tradeable question (fill before adverse excursion) is unanswered. Fill claims are folklore until we measure it.
10. **Counter-trend indicators (RSI, Bollinger mean-reversion) have the worst evidence.** Gerritsen et al. (daily, Jul 2010-Jan 2019, no transaction costs per summary): trading-range-breakout rules beat buy-and-hold on Sharpe via bootstrap; counter-trend RSI/Bollinger generally underperformed, sometimes negative Sharpe; in calmer 2015-2016 rules showed no advantage ([UU portal](https://research-portal.uu.nl/en/publications/the-profitability-of-technical-trading-rules-in-the-bitcoin-marke/), summary [TradingView](https://my.tradingview.com/chart/BTCUSD/tK5t6vU6-The-profitability-of-TA-trading-rules-in-the-Bitcoin-market)). A 2024 thesis found Bollinger strategy negative across all coins tested ([UCLouvain](https://dial-mem.test.bib.ucl.ac.be/handle/2078.2/41508)).
11. **Funding/carry is a cost on leveraged longs and an (eroding) edge for delta-neutral.** BitMEX: BTC perp funding sat at the 0.01%/8h floor 78% of Q3 2025; extreme funding down ~90% since 2016 ([BitMEX Q3 2025](https://www.bitmex.com/blog/2025q3-derivatives-report), [DL News](https://www.dlnews.com/external/bitmex-study-reveals-90-drop-in-extreme-bitcoin-perpetual-futures-funding-rates-since-2016-signalling-market-maturation)). 0.01%/8h is ~11% annualized (simple, ~0.03%/day) - this is the structural drag on a levered perp long held for weeks. He/Manela/Ross/von Wachter: BTC perp carry Sharpe ~1.8 at retail costs, up to 3.5 for market makers, but not risk-free, and deviations shrink as markets mature ([arXiv 2212.06888](https://arxiv.org/pdf/2212.06888v5)). Robot Wealth: Hyperliquid carry more than double Binance pre-Mar 2024, later reversed with price moves wiping out funding ([Robot Wealth](https://edgealchemy.robotwealth.com/p/hyperliquid-carry-looks-trendy), single practitioner).
12. **Backtest overfitting is the default failure.** Bailey/Lopez de Prado Deflated Sharpe corrects for number of trials and non-normality ([SSRN 2460551](https://papers.ssrn.com/abstract=2460551)); Harvey & Liu show haircut is non-linear: gross SR <0.4 haircut almost always >50%, SR >1.0 haircut at most ~25% ([Duke](https://people.duke.edu/~charvey/Research/Published_Papers/P120_Backtesting.PDF), summary [CXO](https://www.cxoadvisory.com/?p=24128)). A secondary write-up of ~47.5m crypto backtests reports top DSR ~0.10 ([DEV](https://dev.to/rulyfi/we-ran-100-million-bitcoin-backtests-only-3130-beat-the-luck-bar-3ma2), unverified, illustrative only).

## 2. Evidence table

| Claim | Source | Sample / period | Effect size (as reported) | Confidence |
|---|---|---|---|---|
| Daily/weekly TS momentum in BTC/ETH/XRP | [NBER w24877](https://www.nber.org/system/files/working_papers/w24877/w24877.pdf) via [CXO](https://www.cxoadvisory.com/?p=31471) | 2011-2018 approx (not verified) | BTC top-quintile prior-week -> next-week 11.2% avg, Sharpe 0.45; in-sample | Medium-Low |
| Time-series momentum strong, cross-sectional weak, concentrated in bull markets | Han/Kang/Ryu via search summary | not available | not available | Low |
| Donchian ensemble trend, vol-targeted | [Zarattini et al.](https://ideas.repec.org/p/chf/rpseri/rp2580.html) | not verified | Sharpe >1.5; alpha 10.8%/yr vs BTC; cost-reduction portfolio technique | Medium-Low (abstract only) |
| 50d MA rule beats buy-hold | [Grayscale](https://research.grayscale.com/reports/the-trend-is-your-friend-managing-bitcoins-volatility-with-momentum-signals) | Jan 2012-Jul 2023 | Sharpe 1.9 vs 1.3 | Low (vendor, costs unclear) |
| Trend params unstable | [arXiv 2009.12155](https://arxiv.org/pdf/2009.12155) | hourly BTCUSD 2011-2019, zero costs | small window change -> large Sharpe swing | Medium |
| TSMOM lagged buy-hold post-2021 | [Coinbase](https://www.coinbase.com/institutional/research-insights/research/monthly-outlook/trend-following-in-uncertain-times-september-2022) | 2021-Sep 2022 | underperformed all but 2 quarters; no costs | Low |
| AdaptiveTrend OOS Sharpe 2.41, 150+ pairs | [arXiv 2602.11708](https://arxiv.org/pdf/2602.11708.pdf) | 2022-2024 | Sharpe 2.41; cost assumptions not verified | Low (abstract only; very high SR = suspicious) |
| Momentum payoffs inconsistent / outlier-driven | [Springer 2025](https://link.springer.com/article/10.1007/s11408-025-00474-9) | various | 1 outlier = 37% of compounded return | Medium |
| Intraday: first half-hour predicts last half-hour | [Shen et al.](https://centaur.reading.ac.uk/100181) | BTC intraday, period not verified | headline Sharpe not available | Medium |
| 1-4h negative autocorrelation, stronger reversal after big moves | [CORE](https://core.ac.uk/download/362651763.pdf) | Bitstamp minute data, period not verified | not available | Low-Medium |
| Reversal after low-volume 10-min intervals | via [CXO](https://www.cxoadvisory.com/?p=31471) | 26 assets, 10-min | gross SR up to 2.96 | Low (gross) |
| Daily overreaction not profitable after costs | [Brunel](https://www.brunel.ac.uk/economics-finance-and-accounting/research/pdf/1801-Jan-GMC-Price-Overreactions-In-The-Cryptocurrency-Market.pdf) | 2013-2017, BTC + 3 coins | next-day moves larger after abnormal days; no net edge | Medium |
| Calendar return anomalies don't persist | [Baur et al.](https://econpapers.repec.org/RePEc:eee:finlet:v:31:y:2019:i:c:p:78-92) | >15m obs, 7 exchanges | activity patterns persist, returns don't | Medium-High |
| 22-23 UTC best hour | [Quantpedia](https://quantpedia.com/are-there-seasonal-intraday-or-overnight-anomalies-in-bitcoin/) | Gemini hourly 2015-2022 | ~33% ann., vol 20.9%, MDD -22.5% | Low |
| Hourly seasonality Sharpe 1.79, 11% time in market | [notp1ssed blog](https://notp1ssed.github.io/portfolio/assets/docs/001_Seasonality_Backtest.html) | Binance, 2026 | vs B&H 0.61 | Very low (blog) |
| MS-GARCH beats single GARCH for BTC VaR | [SSRN 3180830](https://papers.ssrn.com/abstract=3180830) | not verified | VaR backtest improvement | Medium-High |
| Breakout rule beats B&H; RSI/BB counter-trend do not | [Gerritsen et al.](https://research-portal.uu.nl/en/publications/the-profitability-of-technical-trading-rules-in-the-bitcoin-marke/) | daily Jul 2010-Jan 2019, no tx costs | Sharpe outperformance (bootstrapped) for TRB | Medium |
| Bollinger strategy negative on all coins | [thesis](https://dial-mem.test.bib.ucl.ac.be/handle/2078.2/41508) | 2024 thesis | negative annualized | Low (thesis) |
| BTC realized vol at record low in 2025 | [CryptoSlate/K33](https://cryptoslate.com/bitcoin-turned-less-volatile-than-nvidia-as-institutional-rails-absorbed-570-billion-in-swings-during-a-boring-year/) | 2022-2025 | 3.34% -> 2.80% -> 2.24% daily | Medium |
| Funding at 0.01%/8h floor most of the time | [BitMEX](https://www.bitmex.com/blog/2025q3-derivatives-report) | BitMEX XBTUSD Q3 2025 | 78.19% of quarter at floor | Medium (BitMEX only) |
| Perp carry Sharpe 1.8 retail-cost | [arXiv 2212.06888](https://arxiv.org/pdf/2212.06888v5) | sample not verified | 1.8 (retail), 3.5 (MM); fee bps not verified | Medium |
| Depth collapses in stress | [Kaiko via FXStreet](https://www.fxstreet.com/amp/cryptocurrencies/news/bitcoin-liquidity-on-binance-plummeted-during-the-etf-rumor-induced-market-rollercoaster-kaiko-202310170704) | Oct 2023 event | 0.1% ask depth 100 BTC -> 1.2 BTC; some slippage up to 20% | Medium (single event) |
| SR haircut non-linear | [Harvey & Liu](https://people.duke.edu/~charvey/Research/Published_Papers/P120_Backtesting.PDF) | method paper | SR<0.4 haircut >50%; SR>1.0 <=25% | High (method) |
| CME gaps nearly all fill | [CoinDesk](https://hotfix.coindesk.com/markets/2025/03/11/bitcoin-fills-yet-another-cme-futures-gap-as-btc-price-dropped-to-usd76-700) | prior 80 gaps | 79/80 "eventually" | Low (no time bound, no method) |

## 3. Regime framework we could adopt (hypothesis-generating, not validated)

Purpose: not to find a magic signal but to stop trading the wrong strategy in the wrong state. Three orthogonal axes, all computed from data we own (no look-ahead; use only information up to bar close):

1. **Volatility state.** Realized vol (e.g. 20-day close-to-close or Parkinson) ranked as a rolling percentile over trailing 365 days (percentile rather than absolute level because vol has structurally trended down; see finding 8). Buckets: low (<25th), mid, high (>75th). Support: vol clustering and two-state MS-GARCH evidence (finding 7).
2. **Trend vs chop.** Candidates: ADX(14) on daily, or efficiency ratio (|net move|/sum|moves|) over 20-50 bars, or price vs 50/200d MA. Gerritsen's finding that breakout rules lost edge in calm 2015-2016 supports conditioning trend rules on this axis (finding 10). No source here validated ADX thresholds in crypto - that is untested.
3. **Cost/liquidity state.** Funding rate level, spread, and depth. Funding >> 0.01%/8h indicates crowded longs (cost to hold and liquidation-cascade risk); depth and time-of-day matter (low activity at weekend/evening UTC per Baur). Kaiko event shows depth can vanish.

Optional 4th: HMM with 2-3 states on returns+vol. Only MS-GARCH/MS-AR evidence found; no HMM live-trading evidence found. Treat as a comparison benchmark to the simple percentile rule, expect it to lag at turning points and be unstable across refits.

Strategy-to-regime map to test (hypotheses, not facts):
- Slow trend (ensemble Donchian/MA): active when trend axis = trending; reduced size/off in chop.
- Short-horizon reversal: only low-cost venues/maker execution; probably only in low-vol/chop; evidence is gross.
- Vol-breakout: only after low-vol percentile; direction by trend filter, because compression itself is non-directional.
- Always: position size inversely to realized vol (vol targeting, as in Zarattini's approach per [IDEAS](https://ideas.repec.org/p/chf/rpseri/rp2580.html)).

## 4. Testable hypotheses (pass/fail rules, data required)

Common protocol for all: BTC/ETH/SOL (+ 2-3 large alts) perps and spot; data from start of listing to latest; split into design period and a final untouched holdout (last 25% of time, locked before any testing); costs = taker fee + half-spread + slippage by size (see Section 6; exact bps must be taken from the venue fee schedule we actually use, not from this document); funding paid/received per 8h interval on the actual position; count every variant tried and report Deflated Sharpe ([SSRN 2460551](https://papers.ssrn.com/abstract=2460551)).

**H1 - Ensemble trend beats buy-and-hold risk-adjusted, net of costs.**
Rule: long/flat (no short initially) with equal-weight ensemble of Donchian breakout lookbacks {20,50,100,200} days, vol-targeted. PASS if on holdout: net Sharpe > buy-and-hold net Sharpe AND max drawdown <= 60% of buy-and-hold's AND net Sharpe >0.5 AND result positive in at least 2 of 3 coins AND Sharpe with lookbacks shifted +/-20% stays >=70% of baseline. FAIL otherwise. Data: daily OHLC, funding history.

**H2 - Trend edge is regime-dependent.**
Rule: split H1's daily returns by efficiency-ratio tercile (computed with lag). PASS if top tercile net Sharpe exceeds bottom tercile by >0.5 in both design and holdout periods with same sign, and bottom-tercile Sharpe <= 0.2. FAIL if gap flips sign across periods. Data: daily OHLC.

**H3 - Low-vol percentile predicts higher forward realized vol.**
Rule: event = 20d realized-vol percentile (trailing 365d) <10th. PASS if median forward 10d realized vol / current realized vol >1.2 in design and holdout vs. unconditional ratio, with bootstrap 95% CI excluding the unconditional value, for BTC and ETH. This tests vol only, not direction. FAIL otherwise. Data: daily or hourly OHLC.

**H4 - Squeeze breakout direction.**
Rule: conditional on H3 event, trade the direction of the first 1-ATR close beyond the prior 20d range, exit at 2-ATR stop or 10 days. PASS only if H3 passed AND net expectancy >0 after costs with at least 40 events pooled and holdout expectancy >0. FAIL otherwise. Prior: low (commentary says non-directional).

**H5 - Large-move reversal at 1-4h horizons survives cost.**
Rule: after a 1h return beyond +/-3 trailing-sigma, fade for 2h, maker-only entry (assume 30% non-fill, count missed moves as lost opportunity). PASS if net expectancy per trade > 2x round-trip cost estimate, positive in holdout and in at least 2 coins, and not concentrated (top 5% of trades <40% of profit). Prior: moderate to low (reversal evidence exists but gross; see finding 4). Data: 1m-1h bars, L1 spread, fills assumptions.

**H6 - Calendar/hour effect.**
Rule: top and bottom UTC hours defined on design period only. PASS if the same hour ranks in the top (or bottom) quintile in each of the two held-out halves, net of costs. Baur et al. imply expected FAIL. Data: hourly bars 2017+.

**H7 - CME gap fill timing.**
Rule: define gap = Friday close to Sunday open, size > 0.5%. Measure (a) fraction filled within 7 days and (b) max adverse excursion before fill vs. gap size. PASS (as tradeable) only if P(fill within 7d) >65% AND expected net PnL of trading toward fill with stop = 1x gap >0 over all gaps since 2017. FAIL otherwise. Data: CME BTC futures daily/hourly (not available in sandbox); also a null comparison from random same-size synthetic gaps.

**H8 - Funding extremes as a contrarian/risk flag.**
Rule: when 8h funding >0.05% (or top decile on rolling 1y), compare next 3d and 7d returns and drawdown vs. baseline. PASS if mean 3d return is lower than baseline with bootstrap p<0.05 in both halves, or if the flag reduces trend-strategy drawdown without lowering net Sharpe. Data: perp funding history, per venue.

**H9 - Regime filter adds value out of sample.**
Rule: apply best-of regime filter from H2/H3 to H1; PASS if holdout net Sharpe improves vs. unfiltered AND improvement exceeds the improvement obtained by random filters (1000 shuffled regime labels, 95th percentile). FAIL otherwise.

## 5. What we could NOT verify
- Any full-text methodology (WebFetch blocked). All paper numbers are from abstracts or secondary summaries. Notably unverified: sample periods for Liu-Tsyvinski, Zarattini et al., Shen et al.; the transaction-cost assumptions of AdaptiveTrend, Zarattini, Shen; cost basis points in He et al. perps paper.
- The Springer 2025 and Brunel papers' exact sample periods and costs.
- Direct measurement of strategy decay over time for crypto trend/momentum (no peer-reviewed rolling-Sharpe series found). Evidence is only conflicting vendor notes (Coinbase vs Kaiko vs Grayscale).
- Out-of-sample failure rate specific to crypto TA rules: not found. Only general method papers and an unverified 47.5m-backtest blog.
- Any rigorous CME gap study; any rigorous test of Bollinger squeeze predictiveness; any HMM live-trading evidence; head-and-shoulders and other classical chart patterns (no study located at all - treat as no evidence).
- Actual average Binance BTC funding for 2024-2026 (only BitMEX stats and unverified aggregator pages). 
- Exact current maker/taker fee schedules and typical slippage by size for perps; Kaiko gave only qualitative and one stress-event figure.
- Alts (SOL and others) specifically: nearly all evidence found is BTC-centric; alt liquidity, delisting and survivorship issues unquantified.
- Prediction-market (Polymarket) technicals: outside this workstream's searches.
- Post-ETF-era (2024-2026) regime behaviour of calendar/gap effects: not located.

## 6. Ways a trader loses here (traps)
1. **Single-parameter trend backtest.** "Best" MA/Donchian window is noise (arXiv 2009.12155). Fix: ensembles, neighbouring-parameter robustness, report number of trials and DSR.
2. **Gross-return edges at high turnover.** Hourly/10-minute reversal and seasonal Sharpe ratios (2.96, 1.79) are gross or blog-level; taker fees plus spread plus slippage can exceed the per-trade edge. Studies that explicitly omitted costs: 2009.12155, Gerritsen et al., Coinbase note.
3. **Survivorship and single-bull-cycle sample.** BTC 2012-2021 had an extraordinary trend; "buy and hold" comparisons and trend Sharpe inherit it. One outlier = 37% of momentum return (Springer 2025).
4. **Funding bleed on levered longs.** 0.01%/8h floor is ~11%/yr simple; spikes >100% annualized happened (Feb 2024 per [FXStreet](https://www.fxstreet.com/cryptocurrencies/news/bitcoin-funding-rates-jump-to-100-sparking-opportunity-for-savvy-traders-202402270607)). Holding leveraged longs through a chop regime pays funding while trend rules whipsaw.
5. **Delta-neutral carry is not risk-free.** No maturity, margin/liquidation, venue and exchange risk (He et al.); edge diminishes over time and varies by venue (Robot Wealth).
6. **Depth illusion in stress.** Binance 0.1% depth fell 100 -> 1.2 BTC in an event; stop orders slip exactly when you need them. Size to stress depth, not average depth.
7. **Fixed-threshold vol/squeeze signals.** Structural vol decline means "tightest bands ever" prints repeatedly; thresholds must be percentile-based and still may not mean anything (Glassnode researcher quote in CoinMarketCap/Cointelegraph coverage).
8. **Counter-trend indicators (RSI, Bollinger fade, indicator confluence).** Negative or no evidence (finding 10). Conflicting indicators (BB/RSI/MACD) give contradictory signals per a Finnish thesis; confluence is a way to cherry-pick.
9. **CME gap magnet and chart-pattern folklore.** "Eventually filled" has no time bound; no study on patterns such as head-and-shoulders. Do not trade these without H7-type testing.
10. **Calendar effect chasing.** Return anomalies are time-varying (Baur; DOW literature). Weekend/evening activity patterns are persistent, which affects liquidity and cost, not direction.
11. **Regime-label look-ahead.** Smoothed HMM states and full-sample percentiles use future data. Use filtered/expanding-window estimates only; expect lag at turning points.
12. **Multiple-testing without accounting.** Testing many coins x lookbacks x timeframes x regimes; Harvey-Liu haircut means marginal-SR results (<0.4) should be discarded. Keep a trial ledger.
13. **Leverage amplifying a 0.5-1.0 Sharpe edge.** Even a real edge has multi-year drawdowns; liquidation, not the signal, ends the trade. Size by vol target and drawdown limit, not by conviction.
14. **Trusting vendor/blog backtests** (Grayscale, Quantpedia, Ledger Mind +1,240% style claims) as validation. They are hypotheses to retest on our data.
