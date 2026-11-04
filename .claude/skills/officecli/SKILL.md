---
name: officecli
description: OfficeCLI (iOfficeAI/OfficeCLI). Use to create, read, edit or render Word (.docx), Excel (.xlsx) or PowerPoint (.pptx) files from the command line without Microsoft Office installed.
---
# OfficeCLI — Office files for agents

Source: https://github.com/iOfficeAI/OfficeCLI (single binary, Apache-2.0).
Upstream full skill reference: https://officecli.ai/SKILL.md (or `SKILL.md` in the repo).

## Install
```bash
npm install -g @officecli/officecli      # or: brew install officecli
# or the install.sh from the repo's GitHub releases (read it first)
```

## Core loop: create → add/set → look → fix → close
```bash
officecli create deck.pptx
officecli add deck.pptx / --type slide --prop title="Q4 Report" --prop background=1A1A2E
officecli add deck.pptx '/slide[1]' --type shape --prop text="Revenue +25%" \
  --prop x=2cm --prop y=5cm --prop size=24 --prop color=FFFFFF
officecli view deck.pptx outline                     # structure as text
officecli get deck.pptx '/slide[1]/shape[1]' --json  # one element as JSON
officecli view deck.pptx screenshot -o deck.png      # render to look at it (--page 1-N)
officecli view deck.pptx html -o deck.html
officecli close deck.pptx                            # flush session to disk — don't forget
```
- Paths are XPath-like: `/slide[1]/shape[2]`, `/Sheet1`, Word paragraphs/tables likewise.
- Verbs: `create`, `add`, `set`, `remove`, `get`, `view`, `watch` (live preview :26315), `dump`
  (doc → JSON blueprint), `merge template.docx out.docx --data '{"client":"Acme"}'`.
- Excel: formulas, charts, pivot tables (`--type pivottable`). Word: styles, tables, TOC,
  headers/footers, LaTeX equations, mermaid diagrams, comments, RTL.
- Always render a screenshot and check it before calling a document done.
