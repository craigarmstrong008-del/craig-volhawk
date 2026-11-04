---
name: hypit
description: Hypit (hypit-ai/hypit). Use when the user wants to clone the structure of a short-form/viral video into an editable workflow, or produce short videos with word-anchored captions, B-roll, effects and many variants.
---
# Hypit — editable video workflows for agents

Source: https://github.com/hypit-ai/hypit (Node/pnpm).

## What it does
Drop in a reference video → the agent rebuilds it as an SVML composition (footage, captions,
B-roll, effects, all anchored to *words* rather than timestamps). Swap host, hook, product,
language or aspect ratio and re-render dozens of variants. Can also start from a template or a
text description. Generation models are optional; captions/motion graphics/code visuals can
render without paid model calls.

## Install
```bash
npx skills add hypit-ai/hypit -g     # installs the /hypit skill; it sets up the executable on first use
```
## Use
```text
/hypit Clone this video: /path/to/video.mp4, and replace the content with <new topic>
/hypit Make a 20-second ranking video about <topic>
```
Useful CLI verbs seen in the docs: `hypit runtime init|up|use`, `hypit auth login|status`,
`hypit plan`, `hypit estimate`, `hypit programs prepare|status`, `hypit inspect`, `hypit status`.

## Rules to keep
- Run `hypit estimate` and tell the user the model-service cost before generating (examples ~$1/video).
- Clone *structure/format*, not someone's identity: don't impersonate real people's face or voice
  without consent, and don't reuse copyrighted footage/music the user has no rights to.
