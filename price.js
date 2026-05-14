'use strict';
// price.js â€” Jupiter Price V3 API client
// https://api.jup.ag/price/v3?ids={mints}
// Works keyless (0.5 RPS) or with x-api-key header (higher limits)

const https = require('https');

const BASE = 'api.jup.ag';

// Common Solana token mint addresses
const MINTS = {
  SOL:  'So11111111111111111111111111111111111111112',
  USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  ETH:  '7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs',
  JUP:  'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',
  WIF:  'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm',
  BONK: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
};

// Returns { [mint]: { price, mintSymbol, vsToken, vsTokenSymbol, timeTaken } }
function getPrices(mintList, apiKey = null) {
  return new Promise((resolve, reject) => {
    const ids = mintList.join(',');
    const headers = { 'Accept': 'application/json' };
    if (apiKey) headers['x-api-key'] = apiKey;

    const req = https.request({
      hostname: BASE,
      path: `/price/v3?ids=${encodeURIComponent(ids)}`,
      method: 'GET',
      headers,
    }, res => {
      let raw = '';
      res.on('data', c => raw += c);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(raw);
          // v3 wraps in { data: {...} }
          resolve(parsed.data || parsed);
        } catch {
          reject(new Error(`Price API parse error: ${raw.slice(0, 200)}`));
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

module.exports = { getPrices, MINTS };
