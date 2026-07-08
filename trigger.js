'use strict';
// trigger.js — Jupiter Trigger V2 API (Limit Orders / OCO)
// https://api.jup.ag/trigger/v2
// OCO = One-Cancels-Other: paired TP + SL orders
// NOTE: Requires wallet signing. This module builds the order payload
// and handles the auth challenge flow. Execution requires a Solana keypair.

const https = require('https');

const BASE = 'api.jup.ag';

// Step 1: Request an auth challenge nonce
// Returns { nonce, expiresAt }
function getAuthChallenge(apiKey) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({});
    const req = https.request({
      hostname: BASE,
      path: '/trigger/v2/auth/challenge',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
        'x-api-key': apiKey,
      },
    }, res => {
      let raw = '';
      res.on('data', c => raw += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(raw) }); }
        catch { resolve({ status: res.statusCode, body: raw }); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// Build an OCO (One-Cancels-Other) order payload
// OCO places two linked orders: take-profit + stop-loss
// When one fills, the other is automatically cancelled
function buildOcoOrder({ inputMint, outputMint, inputAmount, takeProfitPrice, stopLossPrice, walletAddress }) {
  return {
    orderType: 'OCO',
    inputMint,
    outputMint,
    inputAmount: inputAmount.toString(),
    takeProfitPrice: takeProfitPrice.toString(),
    stopLossPrice: stopLossPrice.toString(),
    userPublicKey: walletAddress,
    // slippageBps: 50, // 0.5% slippage tolerance (optional)
  };
}

// Build a single limit order payload
function buildLimitOrder({ inputMint, outputMint, inputAmount, limitPrice, walletAddress }) {
  return {
    orderType: 'single',
    inputMint,
    outputMint,
    inputAmount: inputAmount.toString(),
    limitPrice: limitPrice.toString(),
    userPublicKey: walletAddress,
  };
}

// Post order payload after auth challenge is signed
// In a full implementation, nonce would be signed by wallet private key
function submitOrder(payload, apiKey) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(payload);
    const req = https.request({
      hostname: BASE,
      path: '/trigger/v2/orders/price',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
        'x-api-key': apiKey,
      },
    }, res => {
      let raw = '';
      res.on('data', c => raw += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(raw) }); }
        catch { resolve({ status: res.statusCode, body: raw }); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

module.exports = { getAuthChallenge, buildOcoOrder, buildLimitOrder, submitOrder };
