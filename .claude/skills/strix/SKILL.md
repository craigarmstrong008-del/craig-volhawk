---
name: strix
description: Strix (usestrix/strix) autonomous AI pentesting. Use when the user wants to security-test their OWN code, web app or API, validate vulnerabilities with proof-of-concept exploits, or add vulnerability scanning to CI.
---
# Strix — AI penetration testing

Source: https://github.com/usestrix/strix (Python; runs tools inside a Docker sandbox).

## Authorization first
Only run against code/apps the user owns or has written permission to test (their repo, their
staging, a scoped engagement or bug-bounty program). If ownership/scope is unclear, ask. Prefer
staging over production; never target third parties.

## Setup
Needs Docker running and an LLM key.
```bash
pipx install strix-agent            # or: uv tool install strix-agent / the official installer
export STRIX_LLM="anthropic/<model>"   # any LiteLLM-style provider/model
export LLM_API_KEY="..."
```
## Run
```bash
strix --target ./app-directory                     # local code
strix --target https://github.com/org/repo         # repo
strix --target https://staging.your-app.com        # running app
strix -t ./openapi.yaml -t https://api.your-app.com
strix --target https://app --instruction "Authenticated testing as user:pass; focus on IDOR"
strix -n -t ./ --scan-mode quick                   # headless/CI; non-zero exit on findings
```
Results go to `strix_runs/`. Agent skills: `npx skills add usestrix/strix`.

## After a scan
Report findings with severity, PoC and fix; then patch the code and re-run to confirm.
