# Jupiter Developer Platform â€” DX Report
**Project:** Craig VolHawk â€” Volatility-Triggered OCO Agent  
**Author:** Craig Armstrong  
**Date:** May 2026  
**Dev environment:** Node.js v24, Windows 10, Claude Code (AI-assisted development)

---

## Onboarding: Time to First Successful API Call

**~4 minutes from landing to first price response.**

The `llms.txt` at `developers.jup.ag/docs/llms.txt` is the fastest onboarding path I've used on any DeFi platform. It's one page, machine-readable, no noise. I fed it to my coding context and had working price calls before I finished reading it. That's the right design.

The keyless tier getting me to a price response without any account creation is the correct default. Most developer platforms gate you behind email confirmation and API key provisioning before you can see any data. Jupiter lets you ship first.

```
Time to first price API response: ~4 minutes
Time to first Trigger auth challenge: ~12 minutes
Time to understand OCO payload structure: still not fully resolved (see below)
```

---

## What Worked Well

### 1. `llms.txt` is genuinely excellent
Not marketing copy. Actual structured data: base URLs, endpoint paths, rate limits per tier, response shapes. I've seen "LLM-optimised docs" that are just regular docs with a different filename. This is not that. The rate limit table alone saved me from a confusing 429.

### 2. Price V3 response is clean but has one gotcha
The response keys are mint addresses, not symbols. If you query 3 tokens you get 3 mint-addressed objects back. Clean JSON, all the data you need â€” but you need your own mintâ†’symbol map. This is fine and arguably correct (symbols are ambiguous), but it's not obvious from the docs. A note in the reference saying "responses are keyed by mint address, not symbol" would save 15 minutes of confusion.

Actual response shape (discovered by hitting the endpoint, not from docs):
```json
{
  "So11111111111111111111111111111111111111112": {
    "usdPrice": 90.27,
    "priceChange24h": -5.67,
    "liquidity": 741064203,
    "decimals": 9,
    "blockId": 419613575,
    "createdAt": "2024-06-05T08:55:25.979Z"
  }
}
```
The docs reference `price` as a field. The actual field is `usdPrice`. This caused a silent `undefined` bug on first use â€” not a crash, just wrong values. Docs should match the live response shape exactly.

### 3. Trigger auth challenge error messages are actually helpful
When I hit `POST /trigger/v2/auth/challenge` with an empty body, the validation error told me exactly what was missing:
```json
{
  "error": "Request validation failed",
  "details": {
    "walletPubkey": "Invalid input: expected string, received undefined",
    "type": "Invalid option: expected one of \"message\"|\"transaction\""
  }
}
```
This is how validation errors should work. I knew exactly what to fix. No digging through docs. More endpoints should be this explicit.

---

## What's Broken or Missing

### 1. The OCO order payload structure is not documented
`POST /trigger/v2/orders/price` exists in the reference. The auth challenge flow is described. But the actual JSON body shape for an OCO order â€” what fields, what types, how to specify the paired TP and SL prices â€” is not in the docs I could find.

I built `buildOcoOrder()` based on educated guesses from the endpoint name and the `orders/price` path. I don't know if `takeProfitPrice` and `stopLossPrice` are the correct field names. I couldn't submit a live OCO order with confidence because I couldn't verify the payload.

**What I'd want:** A single worked example for each order type (single, OCO, OTOCO) with a complete JSON body and the response shape on success. One example is worth 500 words of description.

### 2. No testnet or dry-run mode for Trigger orders
This is the biggest friction point for agent development. To test whether my OCO payload is correct, I need to submit a live order with real SOL. There's no simulation endpoint, no devnet support, no "validate this payload without executing" option.

For human developers this is annoying. For AI agents this is a blocker. An agent can't test its order logic without spending money on every iteration. A `POST /trigger/v2/orders/simulate` that returns what the order *would* do without placing it would unlock a huge amount of agent development.

### 3. The keyless rate limit (0.5 RPS) hits fast in polling scenarios
At 0.5 RPS, I can only query the Price API every 2 seconds per IP. With 3 tokens, that's 6 seconds per full cycle minimum â€” fine for a slow monitor, but I found out about this limit from `llms.txt`, not from any response header or error message when I hit it.

APIs that enforce rate limits should include `Retry-After` and `X-RateLimit-Remaining` headers. When my polling loop ran without a delay and started getting rate-limited, there was no signal in the response to tell me to back off. I added `sleep(2000)` between calls by inference, not by instruction.

### 4. `priceChange24h` is sometimes null for lower-liquidity tokens
For newer tokens with thin liquidity, `priceChange24h` returns `null`. This causes silent failures in any code that assumes it's a number. The docs don't mention this. The fix is trivial (`?.toFixed(2) ?? '?'`) but you only discover it at runtime with a specific token, not from reading the docs.

---

## AI Stack Feedback

### Agent Skills
I used the Agent Skills context files by feeding them into my Claude Code session. The guidance is structured and useful for initial API orientation. 

**What works:** The skills surface the right starting points â€” which endpoints exist, what the auth flow looks like, what the key concepts are.

**What's missing:** The skills don't include worked code examples in Node.js. They're conceptual. For an AI coding agent the most useful thing is `here is a working fetch call for this endpoint`. The skill becomes a compass when it needs to be a map.

**Suggestion:** Add a `skills/node-js.md` (or language-specific variants) with copy-pasteable fetch/axios/https examples for each API. Even one working example per endpoint cuts integration time in half.

### Jupiter CLI
I installed it. The JSON-native design is correct â€” outputting clean JSON makes it trivially pipeable into other tools or readable by an LLM.

**Problem I hit:** `jup price SOL` returned data, but the field names in the CLI output didn't match the API response fields (`price` vs `usdPrice`). If the CLI wraps the API, the field names should be identical to avoid confusion when switching between CLI and direct API calls.

**What would help:** A `--raw` flag that returns the unprocessed API response. When debugging, I want to see exactly what the API returns, not the CLI's interpretation of it.

### Docs MCP
I queried the Docs MCP from my Claude Code environment. It surfaces the right pages but sometimes returned truncated content for longer reference sections. For the Trigger order payload specifically, the MCP returned the same incomplete information as the web docs â€” which is consistent, but means the gap in the documentation is also a gap in the MCP.

---

## How I'd Rebuild `developers.jup.ag`

If I were the engineer behind the Developer Platform, the highest-leverage changes:

**1. Ship every endpoint with a live "Try it" that shows the real response.** Not a static code block â€” an actual embedded request that runs against the API and returns live data. The fastest way to understand an API is to see it work. Every minute spent reading static docs is a minute not spent building.

**2. Add response schema tables next to every endpoint.** Field name, type, whether it can be null, what it means. The `usdPrice` vs `price` issue and the nullable `priceChange24h` issue are both one-line additions to a schema table.

**3. Trigger docs need a full OCO walkthrough.** Auth challenge â†’ sign message â†’ submit order â†’ poll status â†’ order fills â†’ repeat. The individual pieces exist. The end-to-end sequence does not. For the most complex (and most useful) API on the platform, this is the gap that will lose the most developers at step 3 of 5.

**4. Add a simulation/paper mode for Trigger.** The single most impactful thing for agent adoption. Agents iterate fast and need cheap feedback loops. Paper order simulation costs you nothing and unlocks the entire AI agent development surface.

**5. Rate limit headers on every response.** `X-RateLimit-Remaining: 4` tells agents to slow down before they get 429'd. Without it, agents have to implement their own backoff logic from scratch, and they get it wrong the first time.

---

## What I Wish Existed

- **WebSocket price feed.** REST polling at 0.5 RPS keyless is fine for monitoring but introduces multi-second latency. A WebSocket `wss://api.jup.ag/price/ws?ids=...` would make real-time volatility detection practical without burning rate limits.

- **Batch order status endpoint.** `GET /trigger/v2/orders?wallet=...&status=open` â€” currently I can't efficiently poll the status of all my agent's open orders without individual requests per order.

- **Agent identity / API key linkage.** Right now, Trigger orders require a wallet signature to verify ownership. For pure LLM agents that don't control a keypair natively, there's no path to autonomous order submission without a wallet-holding middleware layer. A lightweight "agent API key â†’ wallet delegation" mechanism â€” where a human pre-authorizes an API key to place orders up to a size limit on their behalf â€” would make fully autonomous trading agents viable on Jupiter without requiring every agent to hold a private key.

- **Prediction market REST interface.** The docs list a Prediction V1 API. I couldn't find a working endpoint for querying open markets or getting current odds without posting an order. If this exists and I missed it, the discoverability is broken. If it doesn't exist yet, it's the most interesting API on the platform for agent use cases.

---

## Summary Scorecard

| Area | Score | Notes |
|---|---|---|
| Time to first call | âœ… Excellent | ~4 min, keyless, no friction |
| `llms.txt` quality | âœ… Excellent | Best in class for LLM consumption |
| Price API docs | âš ï¸ Good | Response field names don't match docs (`usdPrice` vs `price`) |
| Trigger API docs | âŒ Incomplete | OCO payload shape not documented; no simulation mode |
| Error messages | âœ… Good | Validation errors are specific and actionable |
| Rate limit signalling | âš ï¸ Missing | No response headers; silent failures without `llms.txt` |
| AI Stack (Skills/CLI/MCP) | âš ï¸ Promising | Right direction, needs code examples and CLI/API field parity |
| Agent-native features | âŒ Gap | No simulation mode; wallet delegation model missing |

The platform is genuinely closer to agent-ready than anything else in the Solana ecosystem. The gaps are specific and fixable. The foundation is right.
