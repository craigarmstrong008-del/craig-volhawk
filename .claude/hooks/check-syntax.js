#!/usr/bin/env node
'use strict';
// PostToolUse: after editing a .js file, syntax-check it so a broken
// unattended bot is caught immediately. Exit 2 feeds the error back to Claude.
const { spawnSync } = require('child_process');
let raw = '';
process.stdin.on('data', c => (raw += c));
process.stdin.on('end', () => {
  let ev;
  try { ev = JSON.parse(raw); } catch { process.exit(0); }
  const p = (ev.tool_input || {}).file_path || '';
  if (!/\.(c|m)?js$/.test(p)) process.exit(0);
  const r = spawnSync(process.execPath, ['--check', p], { encoding: 'utf8' });
  if (r.status !== 0) {
    process.stderr.write(`Syntax error in ${p}:\n${r.stderr}`);
    process.exit(2);
  }
});
