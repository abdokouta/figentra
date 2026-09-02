---
authored_by: kiro
authored_at: 2026-08-17
source: prompt://brand-restructure-scope
reviewed_by: null
reviewed_at: null
---

# Figentra brand · v1.0

Developer + operator SaaS brand. Framework primitives, dev tooling, workspace
substrate — one brand system across every surface Figentra ships.

**Accent:** Signal Mint `#00E5A0` **Mark:** F-Cursor (geometric F with a
Signal-Mint underscore-cursor anchored at the bottom-right baseline · blink
cadence 1000 ms · steps(1) · terminal-prompt semantics) **Type:** Geist + Geist
Mono **Canonical page:** [`brand-system.html`](brand-system.html) — open by
double-clicking.

## Catalog · 23 sections shipped of 28 canonical slots

Every rendered section is authored. Zero not-yet-authored placeholders · zero
n/a slots. The five unrendered slots (14 · 19 · 26 · 27 · 28) fold into
neighboring sections on the page today; they open as standalone sections in v1.1
if the surface justifies a dedicated view.

### Tier A — Foundations (12)

| #   | Surface                      | Status  | Where                                                                                                    |
| --- | ---------------------------- | ------- | -------------------------------------------------------------------------------------------------------- |
| 01  | Palette · Signal Mint ramp   | shipped | Inline in `brand-system.html`                                                                            |
| 02  | Wordmark                     | shipped | `assets/logos/wordmark.svg`                                                                              |
| 03  | Primary mark · F-Cursor      | shipped | `assets/logos/mark-primary.svg`                                                                          |
| 04  | Mono mark                    | shipped | `assets/logos/mark-mono.svg`                                                                             |
| 05  | Provenance mark + lockup     | shipped | `assets/logos/provenance-mark.svg` + `-lockup.svg` (+ `assets/logos/mark-lockup.svg`)                    |
| 06  | Typography · Geist ramp      | shipped | `brand-system.html` §03 · full specimen · sans + mono ladders + tabular-nums scoreboard                  |
| 07  | Icons · product + UI         | shipped | `assets/icons/product/{app-icon,og-image}.svg`                                                           |
| 08  | Social / OG assets           | shipped | `assets/icons/social/{favicon,social-avatar}.svg`                                                        |
| 09  | Favicons                     | shipped | `assets/favicons/` (9 files · SVG source · ICO · 6 PNG queue · manifest-preview)                         |
| 10  | Illustrations                | shipped | `assets/illustrations/{empty-state,hero-bg,loading-spinner,section-divider}.svg`                         |
| 11  | Patterns · 6 tile primitives | shipped | `assets/patterns/p-{circuit-trace,cursor-field,cursor-grid,dot-matrix,signal-stripes,terminal-rain}.svg` |
| 12  | Motion + video tokens        | shipped | `brand-system.html` §08 · four durations · one easing · reduced-motion contract                          |

### Tier B — Applications (11)

| #   | Surface          | Status  | Where                                                                                                                                                                                                                                                |
| --- | ---------------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 13  | Landing page     | shipped | `brand-system.html` §13 · figentra.com hero + 5-service grid + marketing sitemap + footer                                                                                                                                                            |
| 14  | Email templates  | shipped | `brand-system.html` §10 · 8 React Email templates (welcome · verify · reset · magic-link · invite · digest · alert · newsletter)                                                                                                                     |
| 15  | Error pages      | shipped | `brand-system.html` §11 · 403 · 404 · 500 · 503 · offline · maintenance · rate-limit                                                                                                                                                                 |
| 16  | Pitch decks      | shipped | `brand-system.html` §12 · two 12-slide HTML decks at `assets/decks/{investor,operator}.html` — Series-A + enterprise-buyer variants · real production data (142 academies · $1.9M ARR · 99.94% uptime · $12M ask) · arrow-key nav + Cmd-P PDF export |
| 17  | Print collateral | shipped | `assets/print/sticker-sheet.svg` · notebook cover · one-pager · press kit                                                                                                                                                                            |

<!-- Certificates surface deleted 2026-08-18 · not applicable to a developer/operator brand -->

| 19 | Micro-brand · release marks | shipped | `brand-system.html` §16 ·
version-release badges · conference talk crests · workshop marks | | 20 |
Merch + apparel | shipped | `brand-system.html` §17 · sticker · notebook · tee ·
tote (dev swag pack) | | 21 | Office signage | shipped | `brand-system.html` §21
· conference booth backdrop · banner · giveaway assets · wayfinding | | 22 |
Photography / moments direction | shipped | `brand-system.html` §Moments ·
terminal · deploy · ops-grid · duotone treatment |

### Tier C — Documentation (5)

| #   | Surface                        | Status  | Where                                                                                                          |
| --- | ------------------------------ | ------- | -------------------------------------------------------------------------------------------------------------- |
| 24  | Rules of use · do / don't      | shipped | `brand-system.html` §Rules of use                                                                              |
| 25  | Provenance / inheritance table | shipped | `brand-system.html` §Provenance                                                                                |
| 26  | Voice + tone                   | shipped | `brand-system.html` §22 · 8 per-surface copy patterns + 4 voice rules                                          |
| 27  | Motion + video guidelines      | shipped | `brand-system.html` §23 · 6 live CSS-animated video-shape previews + do/don't matrix + reduced-motion contract |
| 28  | Changelog + versioning         | shipped | See §Changelog below + `brand-system.html` §24 What's Next                                                     |

**Extras (not in canonical 28-slot):**

- `assets/mockups/` — brand-in-situ previews (business card · slide cover ·
  social headers)
- `assets/decks/{investor,operator}/` — 10 standalone HTML slide pages
- `assets/exploration/` — early exploration pages (matrix · mouv-check · preview
  · variants)

## Assets · full file inventory

```
brand/figentra/
├── brand-system.html                  # 23 sections shipped of 28 canonical slots
├── README.md                          # this file
└── assets/
    ├── logos/{wordmark,mark-primary,mark-mono,mark-lockup,provenance-mark,provenance-lockup}.svg
    ├── icons/
    │   ├── product/{app-icon,og-image}.svg
    │   └── social/{favicon,social-avatar}.svg
    ├── favicons/                      # 9 files (favicon.svg · favicon.ico · favicon-16/32/64 · apple-touch-180 · android-192 · pwa-512 · manifest-preview.md)
    ├── illustrations/{empty-state,hero-bg,loading-spinner,section-divider}.svg
    ├── patterns/p-{circuit-trace,cursor-field,cursor-grid,dot-matrix,signal-stripes,terminal-rain}.svg
    ├── decks/
    │   ├── investor.html               # 12-slide Series-A pitch (cover · problem · market · solution · product · traction · business model · competitive · GTM · team · roadmap · ask)
    │   └── operator.html               # 12-slide enterprise-buyer pitch (cover · runtime problem · runtime solution · security + compliance · SLA · onboarding · pricing · Academorix case study · deployment topology · compliance ledger · runbook + SLOs · next step)
    ├── mockups/{business-card,slide-cover,social-headers}.html
    ├── print/sticker-sheet.svg
    ├── _shared/tokens.css             # Signal Mint bindings · shared neutrals + motion
    └── exploration/{matrix,mouv-check,preview,variants}.html
```

## Changelog

- **v1.0 · 2026-08-18 · Phase C polish + full pitch decks** — F-Cursor mark
  redesigned with the underscore-cursor anchored at the bottom-right baseline
  (was top-macron) · mark-primary + mark-mono + mark-lockup regenerated · all
  favicon rasters + ICO rebuilt · dark-mode hero title fixed with explicit
  `background: transparent` · Certificates section (18) removed as not
  applicable to a dev/operator brand · **two 12-slide pitch decks shipped at
  `assets/decks/{investor,operator}.html`** — matching Academorix fidelity ·
  real production numbers ($172 B TAM · $1.9 M Academorix ARR · 99.94 % runtime
  uptime · $12 M Series-A ask · $2.4 M platform-payroll saved per operator) ·
  competitive matrices (vs. Vercel · Firebase · Supabase) · 3-tier pricing
  ($2K / $8K / Custom) · 30-day onboarding timeline · Academorix case study ·
  deployment topology · compliance ledger (SOC 2 · GDPR · FERPA · COPPA · WCAG
  2.2 AA) · 6 CSS-animated motion-preview tiles replaced the descriptive video
  table · What's Next refreshed to reflect v1.0 shipped surface.
- **v1.0 · 2026-08-17 · Phase B** — Landing (§13) · Emails (§10) · Errors (§11)
  · Micro-brand (§16) · Merch (§17) · Signage (§21) authored.
- **v1.0 · 2026-08-17 · Phase A** — Typography (§03) · Motion tokens (§08) ·
  Voice + tone (§22) · Motion + video guidelines (§23) authored. Icons ·
  Favicons queue rendered from source SVGs.
- **v1.0 · 2026-08-17 · Restructure** — Consolidated the historical
  `brand-system.html` (original signed-off) + `figentra-brand-system.html`
  (newer companion draft) into ONE canonical page across the 28-slot catalog.
  Migrated 39 files from `.tmp/drafts/logos/` (retired 2026-08-18) to
  `brand/figentra/assets/` with semantic renames (`b-fsignal-mark.svg` →
  `logos/mark-primary.svg` etc.).

## v1.1 backlog

The v1.1 cycle opens once the first three enterprise pilots ship on the v1.0
brand surface. Named backlog:

1. **Docs microsite chrome** — `docs.figentra.cloud` with Geist + terminal-rain
   backdrop
2. **Case-study format** — one canonical customer surface with a Figentra
   callout; seven real deploys → seven artefacts
3. **Partner logo lockups** — Signal Mint × partner-brand composition rules ·
   one lockup per named partner
4. **Onboarding email sequence** — 7-touch drip on top of the eight
   transactional templates already shipped
5. **Vertical video shapes** — Instagram Reels + TikTok cuts of the six shipped
   video patterns
6. **SDK reference microsite** — one page per `@stackra/*` package with the
   Figentra chrome
7. **Investor + operator deck v2** — case-study addenda + team page updates once
   first three enterprise pilots ship on the v1.0 12-slide decks
8. **Ambient conference kit** — lanyard · notebook · pin set · one canonical
   composition across the drop

Each becomes its own commit under `brand/figentra/assets/<surface>/` when
authored.

## Preview

```
/usr/bin/open brand/figentra/brand-system.html
```
