# 01 - News, Narrative and Catalysts (crypto majors + prediction markets)

Date of research: 2026-11-15. Method: web search snippets only (about 25 searches). Full texts were NOT read for most papers; the sandbox could not reach arxiv.org (DNS blocked), so arXiv numbers below come from search-engine summaries and are flagged. No exchange/market data was available, nothing here was backtested, no numbers are invented. Where a source gave no number, that is stated.

Evidence grades: **A** = peer-reviewed or central-bank paper (still only seen via abstract/snippet); **B** = working paper, thesis, or named research desk with a stated sample; **C** = news/blog/vendor/anecdote (folklore until tested).

---

## 1. Key findings

1. **Scheduled macro events (FOMC/CPI) have a real but unstable footprint on BTC.** Published papers disagree: NY Fed Staff Report 1052 finds BTC "orthogonal" to monetary/macro news in tight intraday windows, while Bundesbank (Karau), an Annals of Finance paper and arXiv 2302.10252 find significant negative responses to monetary-policy surprises (BTC/ETH, not the rest of the market). The disagreement is plausibly sample period (pre-2020 BTC was not macro-linked) and surprise definition. Practical read: the sign (hawkish surprise = down) is probably right in 2022-26, the size and tradability are unproven. Sources: https://www.newyorkfed.org/medialibrary/media/research/staff_reports/sr1052.pdf ; https://arxiv.org/pdf/2302.10252 ; https://link.springer.com/10.1007/s10436-023-00432-3
2. **Block Scholes (desk research, grade B/C) says the CPI surprise explained "close to 80%" of BTC's first-hour move over a 12-release window.** Tiny sample, methodology not seen. https://www.blockscholes.com/institutional-research/is-bitcoin-showing-greater-sensitivity-to-us-cpi-releases-again
3. **Token unlocks: negative drift, mostly BEFORE the unlock date, so you are usually late.** Keyrock (16,000+ unlocks) reports negative price pressure in ~90% of cases, team unlocks worst (~-25% avg drawdown), effect often starts ~30 days earlier. Tokenomist (236 unlocks) reports 1-month median -16.26% / mean -8.10% vs BTC, most of the decline before the date, and itself says correlational not causal. Both are vendor research with a commercial interest (grade B/C). https://keyrock.com/from-locked-to-liquidity-what-16000-token-unlocks-teach-us/ ; https://tokenomist.ai/research/do-token-unlocks-crash-prices
4. **Exchange listings: positive abnormal returns exist but are front-run and venue-dependent.** Ante (327 listings, 180 coins, 22 exchanges): +5.7% listing-day, +9.2% over 7 days, +3.2% pre-announcement run-up (suggesting leakage); Binance +14.7% day-of while Gate.io/Bibox negative; bigger for low-volume/small-cap coins. Sample is old (pre-2020 listings), so decay is likely. https://www.blockchainresearchlab.org/wp-content/uploads/2020/02/BRL-Working-Paper-5.pdf (search summary; exact paper page not opened)
5. **Hacks: BTC/large caps show little or short-lived reaction; stablecoins, small tokens and the victim's own token take the damage.** 44 exchange thefts 2017-25: Tether peg effect, cumulative -0.5% over 21 days, no BTC effect (https://arxiv.org/pdf/2602.07046). Older study: BTC -1.51% on incident day, not significant after 2019 (Brunel/other, see search listing https://www.brunel.ac.uk/economics-finance-and-accounting/research/pdf/2003-Feb-GMC-Cyber-attacks-and-Cryptocurrencies.pdf - attribution of the exact figure to this paper not confirmed). NY Fed SR1153 finds much of the price discovery on DeFi hacks happens BEFORE public announcement. https://newyorkfed.org/medialibrary/media/research/staff_reports/sr1153.pdf
6. **Regulatory action (SEC v Binance/Coinbase, June 2023): sharp, concentrated in named tokens, then partly reversed.** BTC about -4% and ETH about -4.5% in first hour after Binance suit; BNB about -8% first hour then -23% by June 12; SAND -35% by June 12 (CoinGecko, raw not market-adjusted). Intraday event study (Mehdian et al. 2024) finds a volatility surge in BTC/ETH/XRP/ADA/LTC regardless of direction. https://www.coingecko.com/research/publications/sec-cryptocurrency-lawsuit ; https://dc.fortune.com/crypto/2023/06/05/bitcoin-ether-bnb-and-other-tokens-tank-after-sec-sues-binance-and-changpeng-zhao/
7. **Sentiment indicators mostly lag price.** Fear and Greed: one weekly Granger study (Jul 2022-Jun 2023, ~52 obs) found it predicts BTC/ETH returns with feedback, but flagged sensitivity; other summaries find causality running from price to sentiment and time-varying. Google Trends: causality runs mostly returns -> attention; attention only occasionally leads and more for bubbles; stronger link to volume than returns. https://ideas.repec.org/a/eme/rbfpps/rbf-08-2023-0224.html ; https://www.securities.io/bitcoin-sentiment-price-causality ; https://link.springer.com/doi/10.1186/s40854-021-00275-9
8. **ETF flows confirm, they do not predict.** DWF Labs: flows vs prior-5-session price change corr 0.54; vs next-day move 0.09; one-week 0.03 (only 8 major corrections; vendor study). FalconX claims short-term Granger predictiveness (vendor, preliminary). IOSG claims flows are driven by basis/futures-hedging. Net: contested; price-following is the better-supported view. https://cointelegraph.com/news/bitcoin-etf-flows-follow-price-trends-dwf-labs ; https://falconx.io/newsroom/what-can-spot-etf-flows-tell-us-about-the-trajectory-of-bitcoin-prices-a-preliminary-statistical-investigation ; https://www.kucoin.com/news/flash/iosg-weekly-brief-bitcoin-etf-flows-are-driven-by-arbitrage-not-belief
9. **Funding rate as a contrarian signal: plausible, thin evidence.** K33: after 30-day average funding went negative (7th time since 2018) avg 90-day return reported +79%, median +55% - n=7, selection-prone. Brave New Coin: next-period link "mixed", weaker near zero funding. Presto Labs: funding changes explain ~12.5% of 7-day price-change variation. No peer-reviewed out-of-sample edge found. https://www.theblock.co/post/315831/perp-signal-bitcoin-bottom-bullish-year-end-k33 ; https://bravenewcoin.com/insights/testing-theory-is-perpetual-swap-funding-rate-predictive ; https://prestolabs.io/research/can-funding-rate-predict-price-change
10. **Prediction markets: favourite-longshot bias is the best-documented edge, but takers pay for it.** A 2026 arXiv study of 292M trades on Kalshi+Polymarket: 70c contract one month out corresponds to ~75% true probability (longshots overpriced, favourites under-priced). Princeton thesis (188,509 resolved Polymarket markets, Apr 2026): prices compressed toward 0.50, worse at long horizons. Buergi et al. 2025 (Kalshi): takers lose ~32% avg, makers ~10%. Bias reportedly absent in Fed/rates markets (2,668-contract blog study, weak sourcing). https://arxiv.org/html/2602.19520v1 ; https://theses-dissertations.princeton.edu/entities/publication/d5708372-5ea3-4252-b669-7f9cee07387c
11. **Resolution risk is large and repeated on Polymarket** (UMA oracle): Mar 2025 $7M Ukraine-minerals market "UMA whale" dispute; Zelenskyy-suit market flipped; Dec 2025 UFO market; mid-2026 MicroStrategy BTC-sale market (reported $85M volume, one trader claims $500K loss after interpretation/rules change). Reported (unverified) WSJ claim that >=60% of active UMA voters link to Polymarket accounts. https://www.theblock.co/news/ecosystems/2025-03-26-polymarket-says-governance-attack-by-uma-whale-to-hijack-a-bets-resolution-is-unprecedented-348171 ; https://cryptoslate.com/polymarket-faces-major-credibility-crisis-after-whales-forced-a-yes-ufo-vote-without-evidence/ ; https://www.kucoin.com/news/flash/85m-polymarket-dispute-over-microstrategy-s-bitcoin-sale-tests-uma-s-oracle ; https://financemagnates.com/fintech/polymarkets-arbitration-model-faces-conflict-of-interest-questions
12. **Informed trading ahead of news exists in prediction markets** (Maduro: ~$400K from a new wallet minutes before news, market implied 8%; Iran ceasefire wallets >$600K; Harvard-cited anomaly estimate $143M, explicitly not proof). Implication: sharp pre-news price moves are information, and you are the counterparty to them if you fade. https://www.brattle.com/wp-content/uploads/2026/02/Should-Prediction-Markets-Allow-Trading-On-Nonpublic-Info.pdf ; https://www.ibtimes.co.uk/polymarket-insider-trading-iran-bets-1791155

---

## 2. Regime timeline, last ~24 months (all grade C unless noted; dates and levels conflict between outlets - verify against price data)

| Date | Event | Reaction reported | Source |
|---|---|---|---|
| 2025-02-21 | Bybit hack ~$1.4-1.5B (ETH) | Kaiko: BTC/ETH began falling just BEFORE official confirmation; hours after, BTC -3%, ETH -7%. Larger multi-week drops (ETH -24%) are confounded by leverage/other news | https://research.kaiko.com/insights/bybit-hack-by-the-numbers ; https://cointelegraph.com/markets/ethereum-price-drops-despite-bybit-reportedly-buying-700m-eth-why |
| 2025-03-06 | US Strategic Bitcoin Reserve EO | "Sell the news"; BTC fell (reports say lower in March) | https://dc.fortune.com/crypto/2025/03/07/bitcoin-price-drop-trump-strategic-crypto-reserve/ |
| 2025-07-14/15 | BTC ATH ~$123K | Peak came BEFORE GENIUS Act signing (Jul 18); sources conflict on post-signing path | https://cryptoslate.com/?p=551827 ; https://www.samara-ag.com/market-insights/bitcoin-hits-new-all-time-high-123000 |
| 2025-10-06 (approx) | Cycle ATH ~$126K | Most sources say early Oct 2025 | https://crypto.jobs/news/bitcoin-bear-market-enters-later-stages-as-price-falls-44-from-peak |
| 2025-10-10/11 | Trump 100% China tariff post; ~$19.1B liquidations (CoinGlass), $6-7B in ~1 hour; BTC -14% from Friday high to ~$104.8K | CoinShares notes a mispricing incident preceded the tariff post and rumours of a coordinated Hyperliquid short are unverified; infrastructure failures amplified it | https://decrypt.co/343941/bitcoin-ethereum-dogecoin-down-record-19-billion-crypto-liquidations ; https://etp.coinshares.com/us/insights/knowledge/billions-in-liquidations-what-happened/ |
| 2026-01 | Fourth monthly decline in row, longest since 2018 | https://blockeden.xyz/blog/2026/02/07/bitcoin-four-month-losing-streak/ |
| 2026-02-05 | BTC ~15-month low, ~$64K (some report ~$60K intraday) | https://www.roic.ai/news/bitcoin-plunges-to-15-month-low-briefly-breaks-below-64000-amid-broader-market-pressures-02-05-2026 |
| 2026-03 | Iran-related shocks; oil futures traded heavily minutes before Trump post (C) | https://defirate.com/news/iran-ceasefire-trades-spotlight-insider-trading-rules-in-prediction-markets/ |
| 2026-05 | Warsh confirmed Fed chair (54-45, May 13 per one source); hot CPI headlines mention rate-HIKE concerns | https://unchainedcrypto.com/bitcoin-below-76000-as-markets-price-a-92-chance-of-a-fed-rate-hike/ |
| 2026-09-15/16 | CLARITY Act Senate procedural vote failed 49-50; Warsh's first FOMC viewed as hawkish; BTC ~$64-76K range. **Sources conflict on whether the Fed held at 3.50-3.75% or hiked to 3.75-4.00% - unresolved** | https://cointelegraph.com/news/clarity-act-vote-meets-fed-rate-hike-five-things-to-know-in-bitcoin-this-week ; https://decrypt.co/371511/bitcoin-steadies-near-64k-as-analysts-eye-floor-after-hawkish-fed |
| 2026-11 | BTC fell below ~$73K on Nov 10; ~$81.2K post-election bounce reversed with AI-stock weakness; spot BTC/ETH ETFs ~$530M combined outflows in a day; weekly close Nov 7 ~$75.9K. Today's price NOT verified | https://pandaforecast.com/crypto-news/bitcoin-midterm-bounce-chip-rout-liquidations-etf-outflows/ |

Regime read (interpretation, not tested): since Oct 2025 the dominant pattern is "legal/political wins did not stop a ~45-50% drawdown" (https://cryptoslate.com/?p=551827), with macro/Fed hawkishness and leverage flushes as the main shock channels. Treat as hypothesis.

---

## 3. Evidence table

| # | Claim | Source | Sample / effect size | Confidence |
|---|---|---|---|---|
| 1 | BTC does not react to FOMC/macro news in tight intraday windows | NY Fed SR1052 https://www.newyorkfed.org/medialibrary/media/research/staff_reports/sr1052.pdf | Sample/effect not seen | Med (A, but contradicted) |
| 2 | BTC/ETH react negatively to monetary surprises; rest of market not | arXiv 2302.10252 https://arxiv.org/pdf/2302.10252 | Not seen | Med (A/B) |
| 3 | Persistent BTC response to Fed/ECB shocks | Karau, Bundesbank https://bundesbank.de/resource/blob/880226/8334c7e2b5c8058038ca8f1393ca2edd/472B63F073F071307366337C94F8C870/2021-11-19-dkp-41-data.pdf | Not seen | Med |
| 4 | Upside CPI surprise -> BTC sells off in following hour; surprise explains ~80% of first-hour move | Block Scholes | 12 releases | Low |
| 5 | Avg 2-4% 24h move after CPI, H1 2025 | KuCoin Research via search summary | 5 releases | Low |
| 6 | Hourly abnormal returns positive pre-FOMC, negative during | Interdax blog https://medium.com/interdax/how-do-fomc-announcements-affect-bitcoin-9f975de87cb3 | Not seen | Low |
| 7 | FOMC press conference matters, smaller than statement (CoinDesk data 2015-25) | Unverified authorship/venue (from search summary) | n/a | Low |
| 8 | Token unlock: ~90% negative, team unlocks ~-25%, starts ~30d early | Keyrock | 16,000+ unlocks | Med-Low (vendor) |
| 9 | Unlock 1m median -16.26%, mean -8.10% (vs BTC), mostly pre-event | Tokenomist | 236 unlocks | Med-Low (vendor, self-described correlational) |
| 10 | <~1% of circulating supply unlock negligible | Autheo FAQ, no study named | n/a | Very low |
| 11 | Listing: +5.7% day0, +9.2% 7d, +3.2% pre-run | Ante, BRL WP5 | 327 listings, 180 coins | Med (B, old data) |
| 12 | Coinbase listing announcement CARs positive in 9 of 10 windows | EUR thesis https://thesis.eur.nl/pub/59675/Final-Draft.pdf | small | Low |
| 13 | Exchange hacks: no BTC effect; Tether -0.5% CAR 21d | arXiv 2602.07046 | 44 thefts 2017-25 | Med (B, preprint) |
| 14 | DeFi hacks: price discovery precedes announcement | NY Fed SR1153 | not seen | Med-High (A) |
| 15 | Token-project breaches negative, esp. small caps | search summary | 173 breaches | Med |
| 16 | SEC v Binance: BTC ~-4%, BNB ~-8% 1h; named alts -10 to -35% in a week | Fortune, CoinGecko | 19 tokens, raw | Med-Low |
| 17 | F&G Granger-predicts BTC/ETH weekly, with feedback | Cavalheiro et al. 2024 | Jul22-Jun23 weekly | Low (short, fragile) |
| 18 | Google attention follows returns; leads only in bubbles | Springer 2021 s40854-021-00275-9 | Mar14-May19 | Med (A) |
| 19 | ETF flow vs next-day BTC move corr 0.09; vs prior 5d 0.54 | DWF Labs | 8 corrections | Low-Med |
| 20 | Funding negative 30d -> 90d return +79% mean | K33 | n=7 | Very low |
| 21 | Funding changes explain ~12.5% of 7d price-change variance | Presto | not stated | Low |
| 22 | FLB: 70c -> ~75% true at 1-month on both venues | arXiv 2602.19520 | 292M trades | Med-High (summary only) |
| 23 | Polymarket prices compressed to 0.50, worse at long horizon | Princeton thesis | 188,509 markets | Med |
| 24 | Kalshi takers -32%, makers -10% avg | Buergi et al. 2025 (via summary) | not seen | Med |
| 25 | Arbitrage extracted ~$40M from Polymarket Apr24-Apr25 | "Unravelling the Probabilistic Forest" via secondary | n/a | Low-Med |
| 26 | In-play/news repricing lag: 200ms-10s (sports), 5-30 min (leaks) | vendor/dev blogs | none | Very low (folklore) |
| 27 | Mt Gox: BTC ~$62K -> ~$53.6K on Jul 4 2024 on cold-wallet move, confounded by German govt sales; Glassnode saw only marginal sell-side uptick | Decrypt/Blockworks https://decrypt.co/238575/mt-gox-transfers-2-7-billion-cold-storage-market-rout ; https://blockworks.co/news/mt-gox-watch-payouts-quiet-since-crash | 1 event | Low |

---

## 4. Testable hypotheses (pre-registered style)

Common rules for all: use out-of-sample split (fit on first 60% of events by time, test on last 40%), costs = taker fee + measured spread/slippage per venue, report n, mean, median, hit-rate, bootstrap 95% CI; fail if CI includes zero after costs. Multiple-testing: count every variant tried and apply Bonferroni/Holm.

**H1. CPI surprise direction predicts BTC 1h return.**
Data: BTC 1-min bars 2021-01 to 2026-11 (spot, Binance/Coinbase), CPI release timestamps (08:30 ET), actual vs consensus (headline and core). Rule: if core CPI surprise >= +0.1pp, short at t+1min, exit t+60min; if <= -0.1pp, long. PASS: >= 30 events per side, mean net return > 0 with CI excluding zero, same sign in both halves. FAIL otherwise. Also test fade variant (enter t+60, exit t+24h) to see if the move reverses.

**H2. FOMC: pre-announcement drift / post-statement reversal.**
Data: 1-min BTC/ETH, FOMC statement (14:00 ET) and presser (14:30) times 2020-2026 (~50 meetings). Rule: measure return [-60,0] vs [0,+30] vs [+30,+240]min; PASS if the sign of [+30,+240] is opposite to [0,+30] in >= 60% of meetings with t-stat > 2 on the difference. Control: compare to same clock windows on non-FOMC Wednesdays.

**H3. Token unlock fade should be entered 30 days before, not at the date.**
Data: Tokenomist/Keyrock-style unlock calendar (date, % of circ. supply, recipient category), daily perp prices for the token and BTC (beta-hedged). Rule: short token / long BTC (notional-matched, beta-adjusted) from T-30 to T-0 for unlocks >= 2% of circulating supply with team/investor recipients; separately T-7 to T+7. PASS: net-of-funding, borrow and slippage mean excess return < -3% for T-30 to T-0 with CI excluding zero, n >= 50, and the T-7 to T+7 variant is NOT better (confirms the "late" claim). Need data on perp availability and funding (many unlocking tokens lack liquid perps -> test only on tokens that had one at the time to avoid look-ahead).

**H4. Listing announcement: is any edge left after the announcement print?**
Data: announcement timestamps (Binance, Coinbase, Upbit, Bithumb) 2022-2026, 1-min price from the listing venue and a reference venue. Rule: buy at first 1-minute bar after announcement, sell at +5min, +60min, +24h. PASS: net mean > 0 at any horizon with CI excluding zero after a slippage model sized to order-book depth at announcement. Separate test of pre-announcement drift (-72h to 0) to measure leakage; any positive drift there means the edge has been competed away by informed traders.

**H5. Hack/exploit: fade of the victim-chain governance token.**
Data: DeFiLlama/rekt exploit list with first-on-chain-anomaly time vs public disclosure time, token prices. Rule: measure return from disclosure to +24h/+7d for the victim token vs BTC-beta. PASS if mean excess <= -5% and does not partially reverse by +7d in >= 60% of events (n >= 30). Because NY Fed SR1153 finds discovery precedes disclosure, the expectation is FAIL for entries at disclosure; a PASS would be surprising.

**H6. Fear and Greed extremes: contrarian vs momentum.**
Data: daily F&G index (alternative.me) 2018-2026 and BTC daily closes. Rule: long BTC when F&G <= 20 and hold 30d; short/flat when >= 80. PASS: 30d forward return after F&G<=20 beats unconditional 30d mean by >= 5pp with block-bootstrap CI excluding zero, using non-overlapping signals (de-cluster: one entry per 30d). Report the number of independent episodes (expect < 15, so likely FAIL on power - state it). Also run Granger/VAR with daily data to show whether F&G changes follow returns.

**H7. ETF flow: does day t flow predict t+1..t+5 BTC returns?**
Data: farside/issuer daily flows from 2024-01-11, BTC close-to-close aligned to US market close (16:00 ET), NOT UTC midnight. Rule: regress r(t+1..t+5) on flow(t) controlling r(t-4..t). PASS: coefficient t-stat > 2 and positive in both halves after the control. DWF's 0.09 suggests FAIL.

**H8. Funding extremes (contrarian).**
Data: 8h funding on BTC/ETH/SOL perps (Binance, Bybit, OKX, Hyperliquid) 2020-2026 and prices. Rule: when 7d mean annualised funding > 90th percentile (expanding-window percentile, no look-ahead), short for 3 days; when < 10th percentile, long. PASS: net of funding paid/received, mean > 0 with CI excluding zero, n of independent episodes >= 30, positive in each calendar year with at least 3 trades. Reuse the K33 caveat: the n=7 result must not be accepted.

**H9. Prediction markets: favourite-longshot on crypto-price and macro markets.**
Data: Polymarket/Kalshi resolved markets with price snapshots at fixed times-to-resolution (7d, 1d), categories incl. crypto price-threshold, Fed, CPI. Rule: buy every contract priced 0.85-0.97 at 7d before close, hold to resolution, vs sell/avoid contracts <0.10. PASS: realised win rate exceeds implied price by >= 2pp after fees, with a cluster bootstrap by event (to handle correlated strikes) and resolution-dispute losses counted as losses. Separate by category since Fed markets reportedly show no bias.

**H10. Prediction markets: news-shock overreaction.**
Data: tick-level Polymarket trades around dated news (CPI, FOMC, ETF decisions, court rulings). Rule: after a >=15pp move in <5 min, fade at t+5 and exit at t+60 only if no pre-move wallet cluster (new wallets, large size, within prior 30 min) is detected; PASS if the no-cluster fade has positive net mean and cluster-flagged moves continue (i.e. confirm informed-flow distinction). Need wallet-level data (on-chain, Polygon).

**H11. Government / Mt Gox wallet moves: transfer-to-exchange signal.**
Data: labelled wallet transfers (Arkham, Glassnode) for Mt Gox, US/German/UK govt, Silk Road wallets; BTC 1-min data. Rule: transfer to exchange deposit address -> measure return over next 1h/24h/7d vs matched random windows. PASS if mean excess <= -1% at 24h with n >= 20 events; likely FAIL on power (few events), report as inconclusive rather than negative.

---

## 5. What we could NOT verify

- Full text, sample sizes and effect sizes of NY Fed SR1052, Bundesbank (Karau), arXiv 2302.10252, the Annals of Finance paper, arXiv 2602.19520 and 2602.07046: only search summaries seen; arxiv.org was unreachable from the sandbox (DNS). Anything labelled "via summary" should be re-read.
- Typical CPI/NFP/FOMC move sizes for BTC/ETH/SOL with sample sizes: no rigorous published number found. NFP specifically: nothing found. Time-of-day patterns (US session vs Asia, weekend gaps): nothing found beyond anecdotes.
- Whether FOMC/CPI moves FADE or FOLLOW: only anecdotal (KuCoin "initial spike then retracement", unsourced). Untested.
- ETF approval/decision event studies (Jan 2024) and ETH/SOL ETF launches: search returned flows-vs-price pieces only; no clean event study seen.
- Stablecoin events (UST 2022, USDC/SVB 2023, Tether): not searched in depth; no numbers collected.
- SEC/CFTC regulatory event studies beyond June 2023 Binance/Coinbase; effect of the 2025 SEC posture shift on prices.
- Exact Fed policy path in 2026 (hold vs hike in Sept 2026 is contradictory between outlets), current BTC price on 2026-11-15, cycle low (reports range ~$60-64K in Feb 2026 vs "around $60K" in July 2026; no authoritative price series).
- Several 2026 search hits look like auto-generated/duplicated pages (odd domains, inconsistent dates); the timeline in section 2 is therefore low confidence on levels and dates.
- Polymarket/Kalshi news-shock repricing speed: no primary measurement; the 200ms-10s and 5-30min figures are vendor/blog estimates. The "$40M arbitrage extraction" and "14 of top 20 wallets are bots" claims are secondary.
- Social volume / LunarCrush-style sentiment: not covered by any source found. News-NLP sentiment studies for crypto: not searched.
- Publication-bias/decay: no source quantified decay. Inference only: older listing and hack results (pre-2020) pre-date institutional participation and perps dominance; Brunel-type hack effect already insignificant after 2019.

---

## 6. Ways a trader loses here (traps)

1. **Trading the headline after the move.** Evidence of pre-announcement drift/leakage (listings +3.2% pre-run; Bybit prices fell before confirmation; DeFi hacks discovered before disclosure; Maduro/Iran wallets). By the time it is a headline, price discovery has largely occurred.
2. **Unlock short entered at the date.** Most of the decline is reported before the event (Tokenomist, Keyrock), and shorting low-cap tokens costs funding, borrow and squeezes. Also vendor incentive: both datasets are sold/marketed.
3. **Confounded causal stories.** Mt Gox vs German govt sales; Oct 10 2025 tariff vs market-maker/Hyperliquid/infrastructure issues; Bybit hack vs leverage and ETF-staking news; Coinbase equity rebound vs BTC rally. Backtesting "event -> move" without a matched control window overstates effects.
4. **Macro-event whipsaw.** Initial CPI/FOMC spike then reversal is claimed but unproven; wide spreads and liquidation cascades at 08:30/14:00 ET; stop-hunts in thin books. Block Scholes' 80% figure is 12 events: do not size on it.
5. **Using sentiment as a lead indicator.** F&G, Google Trends and social volume mostly follow price; contrarian buys in a 45-50% drawdown ("extreme fear" for months) can bleed. Funding-negative "bottom" signals have n=7.
6. **ETF-flow narrative.** Flows are largely confirmatory (corr 0.09 next-day) and may reflect basis/hedge-fund shorting, so "record inflows" is not a buy signal; timestamp misalignment (US close vs UTC) creates fake predictiveness.
7. **Survivorship and decay.** Listing/hack/unlock studies use old samples; edges published become competed away. Vendor research has marketing bias.
8. **Prediction market resolution risk.** Being right on the real-world outcome and losing on the oracle (UMA vote, rule-change, ambiguous wording). Buying "99c near-certain" contracts can have heavy tail losses; never size as if resolution is guaranteed.
9. **Being the taker.** Kalshi takers lose ~32% avg vs makers ~10%; longshot buyers pay the bias. Fees and spread alone can erase small FLB edges; edge is concentrated in markets with >$-volume, check liquidity.
10. **Trading into informed flow on Polymarket.** Fading sudden jumps in markets tied to military/government actions means trading against possible insiders; also bots (reported 14 of top 20 wallets) win latency games, so in-play news edges for a human with API polling are likely nil.
11. **Regulatory/political-headline "wins" are not bullish by default.** Strategic Reserve EO (Mar 2025) = sell-the-news; GENIUS Act signed after the ATH; "Washington gave crypto every legal win then lost the market anyway". CLARITY Act failure coincided with the Fed hawkishness so attribution is unclear.
12. **Stale or wrong data in the narrative itself.** Conflicting 2026 reports (Fed hold vs hike) show how fast low-quality outlets propagate errors; verify with primary sources before trading a narrative.
