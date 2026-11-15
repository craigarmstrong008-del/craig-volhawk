# 05 - Liquidity: heatmaps, liquidation clusters, depth, sweeps (as of 2026-11-15)

Method note: WebFetch was blocked in this sandbox (hosts did not resolve), and market-data APIs are blocked. Everything below comes from WebSearch result summaries, not from reading primary documents or data. No numbers are invented; where sources conflict, both are given. "Confidence" = confidence the claim is true as stated, not that it is tradeable. Most numbers are vendor/news figures and must be re-checked against primary sources before use.

## 1. Key findings

1. Liquidation heatmaps are MODELS, not observations. Public ones (Coinglass-style) take aggregate open interest, assume a distribution across leverage tiers and entry prices, and project liquidation prices. Vendors do not have all exchanges' margin books, and two tools can show different "hot zones" for the same asset. No backtest or accuracy benchmark was found for any vendor. (sources: bytwork, altrady, investingcube, Hyblock academy - all vendor/blog)
2. "Price is magnetically drawn to liquidation clusters" is practitioner folklore: no peer-reviewed or data-backed test was found. What IS supported: leveraged-derivative liquidation feedback loops amplify moves (Carnegie Mellon CyLab/Soska; CryptoSlate "treadmill" article describes a feedback loop, not deliberate targeting). A hypothesis to test, not a fact.
3. Stop clustering at round numbers is documented in FX (Osler, J. Finance 2003: stop-losses cluster just beyond round numbers; price moves fast after reaching them; she warns causality is not proven). No crypto equivalent found. Transfer to crypto is an assumption.
4. Oct 10-11 2025 was a liquidity failure plus leverage event, not just a price event. Headline ~$19B liquidated in 24h (Coinglass-type figure; Amberdata gives different/narrower BTC-only figures: $2.3B BTC on the day, $31.4B for all 2025; CoinShares argues the headline may be an undercount). Secondary sources report top-of-book BTC depth down >90% (FTI) and one memo claims -98% in 40 minutes ($1.2M -> $27K). Venue price gaps appeared (Substack: Kraken ~9% above Coinbase). Binance says the market low (21:20-21:21 UTC) preceded the USDe depeg (after 21:36 UTC); Ethena blamed Binance pricing collateral off its own thin order book; Binance moved to external oracles (planned Oct 14) and paid ~$283M compensation. Hyperliquid fired cross-margin ADL for the first time in 2+ years (~6,300 wallets liquidated there).
5. Early-warning conditions that preceded Oct 2025, per analyst write-ups: weeks of rising leverage / record OI, persistently elevated funding (one source: >15% APR sustained), falling exchange supply. These come from after-the-fact blogs; nobody here shows a validated signal with false-positive rates.
6. Jan 31 - Feb 2026 weekend cascade: FalconX/Babypips/Amberdata describe price falling to ~$75.6K-$81K in thin weekend trading, ~$2.56B liquidated in 24h (Coinglass via KuCoin; other windows give higher numbers, e.g. ">$5B since Thursday" Decrypt), Hyperliquid leading venues with >$1B liquidations (FalconX), OI at 9-month low ($24.2B CryptoQuant vs $27.6B Amberdata - coverage differs). Theme: "phantom liquidity" - tight spreads masking shallow books.
7. Depth has time structure. Amberdata: BTC/FDUSD depth on Binance swung up to 87% intraday over >50,000 minutes of mid-2025 data, trough near 21:00 UTC (single pair, single venue, limited window). Kaiko (via CryptoSlate): ETF-era weekday depth up, weekend depth down (1%-depth series 2025-01-01 to 2026-04-01). Confidence moderate; direction consistent across sources, magnitude not verified.
8. Prediction markets: Polymarket spreads are structurally wide in low-probability contracts (Dubach, arXiv 2604.24366, 600 markets: lowest probability decile half-spread 650-900 bps; some thin markets dominated by 1-3 wallets). Resolution risk is real and separate from liquidity: UMA token-weighted voting disputes (Ukraine minerals market Mar 2025: $7M market jumped 9% -> 100%, alleged whale ~25% of votes; Zelenskyy suit market; UFO market).
9. Data reality: public liquidation feeds are LOSSY. Binance forceOrder pushes at most one liquidation per symbol per 1000ms (a 2026-04-09 changelog entry reportedly changed wording from "latest" to "largest" - verify). Bybit moved from 1/sec to 500ms. So summed liquidation $ from free streams understates true flow in a cascade, and different vendors' totals disagree by multiples.

## 2. Evidence table

| Claim | Source | Sample | Confidence |
|---|---|---|---|
| Heatmaps estimate liquidations from OI + assumed leverage/entry distribution; vendors differ | https://bytwork.com/en/trade/liquidationheatmap ; https://www.altrady.com/blog/crypto-trading-tools/liquidation-map-crypto-trading ; https://academy.hyblockcapital.com/tools/liquidation-levels-1 | Vendor/blog descriptions, no method docs | Medium |
| No quantitative accuracy benchmark / backtest of heatmaps found | Absence across searches (same sources) | n/a | Medium (absence of evidence) |
| Derivatives volume > spot and cascading liquidations support rapid jumps | https://hotfix.coindesk.com/markets/2021/05/05/crypto-derivatives-boom-leaves-small-traders-vulnerable-to-liquidation-carnegie-mellon | CMU CyLab study, 2021 | Medium |
| "Magnet" effect unsupported by data; "price often works toward clusters but not obliged" | https://www.luxalgo.com/library/concept/liquidation-clusters.md | Glossary, no data | Low (folklore) |
| FX stops cluster just beyond round numbers; moves fast after | https://econpapers.repec.org/RePEc:bla:jfinan:v:58:y:2003:i:5:p:1791-1819 ; https://www.newyorkfed.org/medialibrary/media/research/staff_reports/sr150.html | Osler, FX bank order records | High for FX, none for crypto |
| Oct 10 2025: ~$19B liquidated/24h, tariff trigger, BTC depth >90% down, double-digit spreads at extremes | https://www.fticonsulting.com/insights/articles/crypto-crash-october-2025-leverage-met-liquidity ; https://insights4vc.substack.com/p/inside-the-19b-flash-crash | Consultancy/Substack; underlying dataset not seen | Medium |
| Depth -98% in 40 min ($1.2M -> $27K) | https://tianpan.co/investment-memo/2025/10/16/the-1011-crypto-storm | One memo | Low-Medium |
| Amberdata BTC-only: $2.3B on Oct 10 (86% longs), $31.4B 2025 total, OI peak $54.7B -> $31.9B | https://blog.amberdata.io/leverage-liquidations-the-31b-deleveraging | Vendor blog; scope ambiguous | Medium |
| Headline $19B may be undercount | https://coinshares.com/fr/insights/knowledge/billions-in-liquidations-what-happened | CoinShares commentary | Low-Medium |
| Binance: low at 21:20-21:21 UTC, depeg after 21:36; USDe <$0.66 on Binance; $283M compensation; oracle fix | https://www.theblock.co/news/markets/2025-10-12-binance-pays-283-million-in-compensation-following-fridays-depegs-covering-user-losses ; https://www.theblock.co/news/markets/2025-10-11-binance-to-compensate-some-users-after-several-markets-depeg-there-are-no-excuses-374278 ; https://bravenewcoin.com/insights/usde-depeg-on-binance-was-it-a-coordinated-attack | News reports quoting Binance/Ethena | Medium-High on facts; causality disputed |
| Hyperliquid cross-margin ADL first fired Oct 2025; ~6,300 wallets liquidated; HLP profited | https://wublock.substack.com/p/hyperliquid-activates-cross-margin ; https://www.coingecko.com/learn/hyperliquid-hlp-vault-analysis | Substack/CoinGecko Learn | Medium |
| ADL design criticized for ~$650M excess losses | https://protos.com/outdated-algorithm-caused-650m-excess-losses-on-hyperliquid-report | Gauntlet-based report (not read) | Low-Medium |
| Pre-Oct-2025: elevated funding for weeks, rising leverage | https://whale-alert.io/stories/b18701fb9e3a7e/Weeks-of-rising-leverage-falling-exchange-supply-preceded-Oct-10-2025-19B-Bitcoin-long-liquidation-early-warning-signs-to-watch | Blog | Low-Medium |
| Jan 31 2026: weekend cascade, $2.56B/24h, Hyperliquid >$1B, phantom liquidity | https://www.falconx.io/newsroom/unpacking-the-january-31-liquidation-cascade ; https://www.kucoin.com/news/articles/massive-crypto-liquidation-on-jan-31-2-56-billion-wiped-out-setting-post-1011-crash-record ; https://www.babypips.com/news/explainer-crypto-crash-leverage-dips-disasters-2026-02-02 | Dealer/vendor/news | Medium |
| Depth varies up to 87% intraday, trough ~21:00 UTC (Binance BTC/FDUSD) | https://blog.amberdata.io/the-rhythm-of-liquidity-temporal-patterns-in-market-depth | >50,000 min, mid-2025, one pair | Medium |
| Weekend depth thinner post-ETF | https://cryptoslate.com/how-institutions-made-bitcoin-a-weekday-market-so-retail-takes-on-all-the-weekend-risk/ | Kaiko 1% depth, Jan 2025-Apr 2026 (secondary) | Medium |
| Polymarket low-prob decile half-spread 650-900 bps; thin markets 1-3 wallets | https://arxiv.org/pdf/2604.24366 ; https://philippdubach.com/posts/the-anatomy-of-a-decentralized-prediction-market-notes-from-the-polymarket-order-book/ | 600 markets (via summaries) | Medium |
| UMA/Polymarket disputed resolutions (Ukraine minerals, Zelenskyy suit, UFO) | https://www.theblock.co/news/ecosystems/2025-03-26-polymarket-says-governance-attack-by-uma-whale-to-hijack-a-bets-resolution-is-unprecedented-348171 ; https://cryptoslate.com/polymarket-faces-backlash-over-resolving-disputed-7-million-trump-ukraine-market/ ; https://thedefiant.io/news/nfts-and-web3/polymarket-controversy-heats-up-after-the-zelenskyy-suit-market-resolves | Anecdotes (3 markets) | High that events occurred; frequency unknown |
| Binance forceOrder: max 1 liquidation per symbol per 1000ms | https://developers.binance.com/docs/derivatives/usds-margined-futures/websocket-market-streams/Liquidation-Order-Streams ; https://docs.tardis.dev/historical-data-details/binance-futures | Official docs (via summary) | High |
| Bybit liquidation feed upgraded 1/s -> 500ms | https://cointelegraph.com/news/bybit-lifts-curtain-on-liquidations-data-following-underestimated-figures | News, undated | Medium |

## 3. Data-source table

(Limits are as reported in search summaries; verify on the official page before building. Free = no paid key.)

| Source | What | Cost | Limits / history | URL |
|---|---|---|---|---|
| Binance USDT-M futures REST/WS | Depth snapshot (/fapi/v1/depth), forceOrder stream, funding, OI, trades | Free | Depth weights reportedly 2/5/10/20 for limit 5/50/500/1000 (unofficial blog - verify); forceOrder 1 event/symbol/sec; WS has no initial snapshot, seed from REST; OI-history lookback (commonly believed ~30 days) NOT verified | https://developers.binance.com/docs/derivatives/usds-margined-futures/websocket-market-streams/Liquidation-Order-Streams |
| Bybit V5 | Orderbook, liquidations, OI, funding | Free | Liquidation WS 500ms; per-endpoint limits (not verified from official docs) | https://cointelegraph.com/news/bybit-lifts-curtain-on-liquidations-data-following-underestimated-figures |
| OKX V5 | Books (reportedly up to 400 levels WS), liquidations, OI, funding | Free | Rate limits unverified (third-party: 20 req/2s public) | https://nikhilpadala-site.pages.dev/blog/okx-bybit-deribit-api-guide |
| Deribit | order_book depth 1-10,000, options/futures | Free public | Credit-based rate limits | https://docs.deribit.com/articles/rate-limits ; https://docs.deribit.com/api-reference/market-data/public-get_order_book.md |
| Hyperliquid info API | l2Book (current, ~20 levels), funding, fills for a user | Free | Aggregated weight 1200/min per IP (REST); WS ~1000 subs/100 conns (third-party) | https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/rate-limits-and-user-limits |
| Hyperliquid S3 archives | l2Book snapshots (~2x/sec), asset ctxs; node fills (node_fills_by_block) | Free but requester-pays | l2Book reported from 2023 to Apr 2025 (as of that date; check newer); official: no other datasets (no candles) | https://hyperliquid-co.gitbook.io/community-docs/guide/builder-guide/historical-data |
| Hydromancer Reservoir | Parquet Hyperliquid archive | Free archive (requester-pays) + paid API | Complete from 2025-07-28 | https://www.dwellir.com/blog/best-hyperliquid-historical-data-providers (listing) |
| Hyperliquid market-wide liquidation history | Sources conflict whether endpoint exists | ? | Reconstruct from fills (liquidation flag) - unverified | https://docs.bitquery.io/docs/perpetuals/hyperliquid/vs-hyperliquid-api/ |
| Coinglass API | Liquidation history, heatmaps, OI, funding | Hobbyist $29/mo (30 req/min), Startup $79, Standard ~$299 (third-party), Pro $699 (1200/min) | Heatmap Model1 = Pro+; order-book heatmap = Standard+; liquidation history all plans (interval floor by tier) | https://coinglass.com/pricing ; https://docs.coinglass.com/reference/liquidation-heatmap |
| Tardis.dev | Tick-level historical books, liquidations for Binance futures etc. | Paid (price not verified) | Binance forceOrder from 2020-01-07 | https://docs.tardis.dev/historical-data-details/binance-futures |
| Amberdata | Historical order-book depth, futures liquidations | Paid | Bybit/Deribit depth from 2024-01-01 | https://docs.amberdata.io/data-dictionary/analytics/derivatives/order-book-depth |
| Kaiko / CoinMetrics | Depth at 1% (2 snapshots/min), market liquidations | Paid; Kaiko research partly free | n/a | https://research.kaiko.com/insights/centralized-exchange-liquidity ; https://gitbook-docs.coinmetrics.io/market-data/market-data-overview/market-liquidations |
| Polymarket CLOB/Gamma | /book, /prices-history, trades | Free public reads | Cloudflare throttling (queues rather than rejects); /book ~1500 req/10s, /prices-history 1000 req/10s (official) vs 100/10s (third-party) - conflict; trading limits per signer | https://docs.polymarket.com/api-reference/rate-limits.md |
| Allium | Polymarket historical orderbook | Paid | n/a | https://docs.allium.so/historical-data/supported-blockchains/evm/polygon/predictions/market-orderbook |

Practical consequence: free exchange APIs give only the current book; historical depth requires either (a) recording snapshots yourself from now (start immediately; this is the cheapest way to get real depth history), (b) Hyperliquid S3, or (c) paid vendors.

## 4. Testable hypotheses

Common requirements: record your own L2 snapshots (e.g. 1/sec top 20 levels + trades + forceOrder) for BTC/ETH/SOL perps on Binance, Bybit, Hyperliquid; pre-register thresholds before looking at results; out-of-sample split by time; include fees/slippage; require >= 100 independent events.

H1 - Heatmap magnet. Data: historical liquidation-heatmap snapshots (Coinglass Pro, Model1) or self-built estimates, plus 1m candles. Rule: at each 4h boundary, identify the largest cluster within +/-3% of price. Pass if, within the next 24h, price touches that cluster more often than a matched placebo level (same distance, random side, a non-cluster price) by >= 10 percentage points, at p<0.01, in both halves of the sample and across BTC/ETH/SOL. Fail otherwise. Note a touch being likely simply from volatility - the placebo must be distance-matched. Also test reversal: after touch, is the 1h forward return different from placebo touches?

H2 - Round-number stop sweeps. Data: 1m OHLC + trades. Rule: define level = nearest $1,000 (BTC) / $50 (ETH) / $5 (SOL) or prior 24h high/low. Event = wick exceeds the level by <0.15% then closes back inside within 5 minutes. Pass if frequency of such wick-rejections at round/prior-extreme levels exceeds that at distance-matched non-round levels by >= 1.5x (p<0.01) AND forward 30m return after the rejection (trade fade, after costs) has mean > 0 with bootstrap CI excluding 0. Fail otherwise.

H3 - Weekend/off-hours depth premium. Data: own snapshots (>= 8 weeks) or Kaiko/Amberdata. Rule: depth within 10 bps and 1% of mid by hour-of-week. Pass if median 10 bps depth in Sat/Sun and 20:00-23:00 UTC is >= 30% below weekday-median, and 1m realized slippage for a fixed $ clip is >= 1.5x. Then test whether stop-out rate of a fixed-ATR stop is higher in the thin windows.

H4 - Cascade early warning. Data: OI, funding, basis, depth by venue (Coinglass or own). Define cascade = >= X% drop in BTC within 60 minutes with liquidations in top 1% of history (fix X in advance, e.g. 5%). Candidate predictor: OI/price percentile in top decile AND 3-day mean funding in top decile AND weekend flag. Pass if precision >= 2x the base rate of cascades in the following 24h with a minimum of 15 cascade events and false-positive rate that still lets a "reduce leverage" rule cost less than the losses it avoids. Warning: there are few true cascades (Oct 2025, Jan/Feb 2026, a handful of others) so power is low; treat as risk-control, not a signal.

H5 - Depth collapse leads price. Rule: if within 5 min the 10 bps depth falls >70% vs its 1h median while spread widens >3x, does absolute 15-min return exceed 2x the unconditional distribution? Pass if yes at p<0.01 across >=3 assets. Used purely as a stand-aside trigger.

H6 - Polymarket resolution traps. Data: Polymarket /book and /prices-history, market metadata. Rule: for markets within 48h of end date, compare realized slippage for $500/$2,000 clips vs spread at mid-life, and rate of price jumps >20 points without public news. Pass (as a trap to avoid) if median effective cost for a $500 clip near resolution exceeds 2x the mid-life cost, or if >5% of subjectively-resolved markets show disputed outcomes in a sample of >= 200.

H7 - Venue lead. Does Hyperliquid liquidation/OI stress lead Binance price moves (it is on-chain, transparent)? Pass if lagged cross-correlation of Hyperliquid forced-flow vs Binance 1m returns is significant (lag 1-5 min, p<0.01) out-of-sample.

## 5. What we could NOT verify

- Any primary document: WebFetch was blocked, so every claim derives from search summaries. Check primary pages before relying on them.
- Coinglass/Hyblock heatmap formulas and leverage-tier weights; any accuracy test; whether Hyperliquid-based maps are really more accurate (single blog claim).
- Any rigorous crypto study of the liquidity-magnet effect or round-number stop clustering.
- Official Binance/Bybit/OKX rate limits and Binance OI-history lookback; whether Binance forceOrder now means "largest" vs "latest" (Chinese changelog dated 2026-04-09).
- Whether Hyperliquid has a market-wide liquidation endpoint; current S3 coverage after Apr 2025.
- Depth-collapse magnitudes for Oct 10 (-90%/-98% from non-primary sources), exact liquidation totals (vendors differ by multiples: $19B vs BTC-only $2.3B/day vs possible undercount).
- Precise dates/sizes of other 2026 cascades beyond Jan 31 - Feb 2026; a "-14% toward $60K, ~$10B longs" episode had no confirmable date.
- Polymarket resolution-time depth behavior; whether UMA reforms shipped; Tardis pricing.
- ADL ranking/queue details per exchange (not researched in depth).

## 6. Ways a trader loses here (traps)

1. Trusting heatmap brightness as a forecast: it is an estimate built on assumed leverage; vendors disagree.
2. Trading "to the cluster" and holding a stop just beyond the same cluster/round number - the area others also put stops (Osler pattern in FX).
3. Tight displayed spread = phantom liquidity; depth evaporates within minutes in stress (Oct 2025, Jan 2026).
4. Weekend/21:00 UTC thin windows with leverage.
5. Stop orders are market orders in a vacuum: slippage far beyond the stop price in a cascade; stop may fill after the mark-price trigger at a gap.
6. Isolated/cross margin surprise: cross margin lets a distant alt wipe the account; liquidation price moves as other positions move.
7. Collateral valuation risk: Oct 2025 USDe/BNSOL/WBETH priced off a thin internal book caused unified-account liquidations of positions that were fine on other venues. Venue-specific risk, not market risk.
8. ADL: profitable positions can be force-closed when the insurance fund / backstop is exhausted (Hyperliquid, Binance). Being right and leveraged on the winning side is not safe.
9. Venue price divergence: a spike on one venue is not tradeable on another; arbitrage capital is gone in a cascade.
10. Buying a "dip" mid-cascade with size - books are empty on the bid and flows have not finished.
11. Relying on free liquidation feeds that under-count (1 event/sec/symbol) to size the cascade.
12. Polymarket: wide spreads at low probabilities, 1-3 wallet thin markets, exit costs for round-trips, UMA disputes/whale votes on subjective markets, and late-stage 99c "free money" that can resolve against you.

## 7. Avoid-the-wipe checklist (rules of thumb; none of the numeric thresholds is validated - they are defaults to test under H1-H5)

Before entry:
- [ ] Check recent 24h liquidation + OI change; if OI at multi-month highs with positive funding in the top decile (H4), cut size/leverage.
- [ ] Check hour/day: avoid opening or adding leveraged size on weekends and ~20:00-23:00 UTC unless sized for gap risk (H3).
- [ ] Measure depth: size a clip so your market-order slippage in the CURRENT book is under a limit you set (e.g. <= 5-10% of your expected move). Estimate from a live book walk, not the top of book.
- [ ] Use limit orders / TWAP for entries and exits; avoid market orders into thin books.
- [ ] Verify mark-price vs last-price rules and the venue's liquidation engine and ADL rules; prefer isolated margin per position.
- [ ] Do not hold collateral in assets priced by the same venue's thin book.

Stop placement:
- [ ] Do not place stops at round numbers or at the obvious prior high/low; place beyond them with an ATR buffer (e.g. >= 1x 1h ATR) or use time/close-based stops - test against H2.
- [ ] Place the stop where the trade thesis is invalidated, then size so that loss at that stop (+ slippage allowance) = pre-set % of equity. Leverage is the output, not an input.
- [ ] Ensure liquidation price is far beyond the stop (rule of thumb: liquidation distance >= 3x stop distance) so a gap through the stop does not liquidate you.

During stress:
- [ ] If depth drops sharply or venues diverge (H5), stand aside; do not catch the knife; wait for depth and basis to normalise.
- [ ] Do not add margin to a failing position unless it was pre-planned.

Prediction markets:
- [ ] Check book depth for your clip both ways; prefer markets with decentralised maker liquidity; avoid subjective-resolution markets for size; read the resolution rules and UMA dispute history; assume low-probability contracts have 6-9% half-spread (Dubach).
- [ ] Don't hold within the resolution window unless you accept dispute/delay risk.

Data hygiene:
- [ ] Start recording your own order-book snapshots, funding, OI, and liquidation streams today; this is the only way to get venue-specific depth history cheaply.
- [ ] Treat vendor liquidation totals as lower bounds with unknown error; cross-check two sources.
