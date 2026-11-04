---
name: career-ops
description: Job-search agent (career-ops-hq/career-ops). Use when the user wants to scan job boards, score a job posting against their CV, tailor a resume/cover letter for a role, prep for an interview, or track applications.
---
# career-ops — AI job search agent

Source: https://github.com/career-ops-hq/career-ops (MIT, local-first, no telemetry).

## What it does
Paste a job URL or JD → it checks the posting is still live, scores it 1–5 against the user's CV
(A–H evaluation: role summary, CV match, level strategy, comp research, personalization,
STAR+R interview prep, posting-legitimacy check, work-auth blocker), writes a report,
generates a tailored ATS-readable CV PDF, drafts a cover letter, and adds a tracker row.

## Setup
```bash
npx @santifer/career-ops init     # creates a dedicated project folder
```
Run it in its own folder (not in this repo). First launch interviews the user in chat for CV,
targets and dealbreakers — no manual config. Browser-heavy modes need Playwright.

## Commands (Claude Code: `/career-ops <mode>`; as plugin: `/career-ops:career-ops`)
| Mode | Does |
|---|---|
| *paste URL/JD* | Full pipeline: liveness → evaluation → report → tailored CV → tracker |
| `scan` | Scan portals (`portals.yml`) for new postings → inbox `data/pipeline.md` |
| `discover` | Resolve company names to ATS boards (`--write` to save) |
| `pipeline` | Process URLs waiting in the inbox |
| `apply` | Fill an application form field-by-field, **stops before Submit** |
| `cover` | Generate/complete a cover letter (A4 PDF) |
| `tracker` / `followup` | Application status / follow-ups due, with drafts |
| `deep` / `contacto` | Company research / find the hiring contact + draft note |

## Rules to keep
- Never fabricate CV facts or numbers — it reformulates only. Have the user read every CV.
- Never auto-submit applications or send emails; human presses Submit.
- Default advice: don't apply below 4.0/5 unless the user overrides.
