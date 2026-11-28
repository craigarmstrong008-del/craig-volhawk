#!/usr/bin/env node
'use strict';
// PreToolUse guard. Reads the hook event JSON on stdin and decides allow / ask / deny.
//  - DENY  : reading or writing secret files (crypto_bot.env, .env*, keypairs)
//  - DENY  : shell commands that touch those files, or `git add` of them
//  - DENY  : shell commands that hit Jupiter's live order endpoint (unless VOLHAWK_ALLOW_LIVE=1)
//  - ASK   : edits that add a live submitOrder( call outside trigger.js
// Fails open on parse errors so a hook bug never blocks all work.

let raw = '';
process.stdin.on('data', c => (raw += c));
process.stdin.on('end', () => {
  let ev;
  try { ev = JSON.parse(raw); } catch { process.exit(0); }
  const tool = ev.tool_name || '';
  const input = ev.tool_input || {};

  const SECRET_FILE = /(^|[\\/])(crypto_bot\.env|\.env(\.(?!example|sample)[\w.-]*)?|id\.json|[\w.-]*keypair[\w.-]*\.json|[\w.-]*\.pem)$/i;
  const SECRET_IN_CMD = /(crypto_bot\.env|(^|[\s/"'=])\.env(\.(?!example|sample)[\w-]+)?(?=[\s"';|&)]|$)|id\.json|keypair[\w.-]*\.json)/i;
  const LIVE_ORDER = /(trigger\/v2\/orders|submitOrder\s*\()/i;

  const deny = reason => {
    process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'deny', permissionDecisionReason: reason } }));
    process.exit(0);
  };
  const ask = reason => {
    process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'ask', permissionDecisionReason: reason } }));
    process.exit(0);
  };

  if (['Read', 'Edit', 'Write', 'MultiEdit', 'NotebookEdit'].includes(tool)) {
    const p = input.file_path || input.notebook_path || '';
    if (SECRET_FILE.test(p)) deny(`Blocked: ${p} looks like a secrets/keypair file. Never read or write these; use .env.example for templates.`);

    const added = [input.new_string, input.content, ...(input.edits || []).map(e => e.new_string)].filter(Boolean).join('\n');
    if (/submitOrder\s*\(/.test(added) && !/[\\/]trigger\.js$/.test(p)) {
      ask('This edit adds a live submitOrder() call. That can place real Jupiter orders. Confirm it is gated behind an explicit live-trading flag.');
    }
  }

  if (tool === 'Bash') {
    const cmd = input.command || '';
    if (SECRET_IN_CMD.test(cmd)) deny('Blocked: command references a secrets/keypair file (crypto_bot.env, .env, keypair). Do not print, copy, or stage these.');
    if (LIVE_ORDER.test(cmd) && process.env.VOLHAWK_ALLOW_LIVE !== '1') {
      deny('Blocked: command would hit Jupiter live order submission. Set VOLHAWK_ALLOW_LIVE=1 deliberately to allow it.');
    }
  }
  process.exit(0);
});
