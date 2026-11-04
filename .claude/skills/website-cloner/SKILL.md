---
name: website-cloner
description: AI Website Cloner Template (JCodesMore/ai-website-cloner-template). Use when the user wants to rebuild a website they own or have rights to as an editable Next.js app (platform migration, lost source code, learning layouts).
---
# AI Website Cloner → Next.js

Source: https://github.com/JCodesMore/ai-website-cloner-template
Stack: Next.js 16 (App Router, React 19, TS strict), shadcn/ui, Tailwind v4, Lucide. Node 24+.

## Setup (as its own project, not inside this repo)
```bash
git clone https://github.com/JCodesMore/ai-website-cloner-template my-site
cd my-site && git remote remove origin && npm install && npm run check
```
## Use (needs browser access, e.g. Playwright)
```text
/clone-website https://example.com
```
Four phases: **Map** URLs → routes; **Observe** desktop/mobile pages, extract real assets/fonts,
exercise states; **Build** editable components + interactions; **Compare** screenshots at matched
sizes and fix diffs, then `npm run check`. Output lives in `src/components/sites/<site>/`,
`public/sites/<site>/`, research in `docs/research/<site>/`.

## Rules to keep
- Only clone sites the user owns or has permission to reproduce. Refuse phishing/impersonation
  (login pages, payment flows, a brand's site presented as genuine).
- Logos, brand assets and copy belong to their owners — replace them for anything public.
- Check the target's ToS on scraping/reproduction.
