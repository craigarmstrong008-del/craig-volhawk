---
name: agent-reach
description: Agent Reach CLI (Panniantong/Agent-Reach). Use when the agent needs to read or search YouTube (incl. transcripts), Reddit, GitHub, LinkedIn jobs, Twitter/X, Bilibili, XiaoHongShu, V2EX or general web pages that normal web fetch can't reach.
---
# Agent Reach — internet access for agents

Source: https://github.com/Panniantong/Agent-Reach (Python, installs via uv into `~/.agent-reach/`).

## Install / upgrade
Follow the official instructions at
`https://raw.githubusercontent.com/Panniantong/Agent-Reach/main/docs/install.md`
(read it before running anything). **Do NOT `pip install agent-reach` — the PyPI package of that
name is not this project.**

## Usage
```bash
agent-reach channels                         # list channels + what works right now
agent-reach <channel> <action> [args]        # e.g. agent-reach youtube search "LLM agents"
agent-reach read <url>                       # auto-picks the channel from the URL
```
| Channel | Tier | Can do | Needs |
|---|---|---|---|
| web, github, youtube, bilibili, v2ex | default | search, read pages/repos/issues/PRs, video info, subtitles | nothing (YouTube speech-to-text needs Groq/OpenAI key) |
| reddit, linkedin, xiaohongshu, xueqiu, boss, xiaoyuzhou | optional ("add X") | search/read posts, jobs, quotes, podcasts | mostly login |
| twitter, facebook, instagram | experimental | search, profiles, posts | login; may break |

## Rules to keep
- Login channels copy the site's cookies from the user's Chrome into Agent Reach's own headless
  browser. Tell the user first and recommend a secondary account. Never ask for passwords.
- Not usable from a cloud container without network/browser access — say so instead of faking results.
- Respect site ToS and rate limits; read, don't spam.
