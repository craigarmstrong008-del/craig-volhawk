---
name: paperclip
description: Paperclip (paperclipai/paperclip) multi-agent orchestration. Use when the user wants to run a team of AI agents with an org chart, goals, task assignment, budgets, approvals and a single dashboard.
---
# Paperclip — a company of AI agents

Source: https://github.com/paperclipai/paperclip (Node.js server + React UI, self-hosted).
Docs: https://docs.paperclip.ing

## Concepts
Goals → projects → tasks assigned to agents in an **org chart** (CEO/CTO/engineers…).
Agents (Claude Code, Codex, Cursor, Gemini CLI, OpenCode, OpenClaw, HTTP/custom adapters) wake on
**heartbeats** for assigned work or schedules. **Budgets** per company/agent/project with alerts
and auto-pause. **Governance**: approval gates for hires/strategy, pause/reassign/stop.
Also: scheduled routines, shared skills (Skill Studio), MCP/app connections with
Allowed / Ask first / Off actions, multi-org.

## Setup
```bash
npx paperclipai@latest onboard --yes              # local loopback, fastest start
npx paperclipai@latest onboard --yes --bind lan   # or --bind tailnet for authenticated mode
npx paperclipai configure                         # edit config later
ANTHROPIC_API_KEY=... npx paperclipai test-drive  # try it with Claude Code
```
Dev from source: `pnpm install && pnpm dev`.

## Rules to keep
- Set budgets and approval gates before letting agents run 24/7.
- Use loopback/tailnet binding; don't expose the dashboard publicly without auth.
