'use strict';
// tokens.js â€” Jupiter Tokens V2 API client
// https://api.jup.ag/tokens/v2/search?query=...
// Returns token metadata, verification status, organic score, trading metrics

const https = require('https');

const BASE = 'api.jup.ag';

// Search tokens by symbol or name â€” returns array of token objects
function searchTokens(query, apiKey = null) {
  return new Promise((resolve, reject) => {
    const headers = { 'Accept': 'application/json' };
    if (apiKey) headers['x-api-key'] = apiKey;

    const req = https.request({
      hostname: BASE,
      path: `/tokens/v2/search?query=${encodeURIComponent(query)}`,
      method: 'GET',
      headers,
    }, res => {
      let raw = '';
      res.on('data', c => raw += c);
      res.on('end', () => {
        try { resolve(JSON.parse(raw)); }
        catch { reject(new Error(`Tokens API parse error: ${raw.slice(0, 200)}`)); }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

// Get recently created token pools â€” useful for spotting new listings
function getRecentTokens(apiKey = null) {
  return new Promise((resolve, reject) => {
    const headers = { 'Accept': 'application/json' };
    if (apiKey) headers['x-api-key'] = apiKey;

    const req = https.request({
      hostname: BASE,
      path: `/tokens/v2/recent`,
      method: 'GET',
      headers,
    }, res => {
      let raw = '';
      res.on('data', c => raw += c);
      res.on('end', () => {
        try { resolve(JSON.parse(raw)); }
        catch { reject(new Error(`Tokens recent parse error: ${raw.slice(0, 200)}`)); }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

module.exports = { searchTokens, getRecentTokens };
