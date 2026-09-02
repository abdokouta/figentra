---
inclusion: fileMatch
fileMatchPattern: "brand/**"
authored_by: kiro
authored_at: 2026-08-17
source: prompt://brand-restructure-scope
reviewed_by: null
reviewed_at: null
---

# Brand system canonical structure

Rules for authoring + maintaining every brand under `brand/` at the workspace
root. Codifies
[ADR-0103](../../.docs/adr/0103-brand-system-canonical-structure.md) at the
enforceable-rule layer.

Applies to every file under:

- `brand/README.md`
- `brand/_shared/**`
- `brand/<brand>/brand-system.html`
- `brand/<brand>/README.md`
- `brand/<brand>/CHANGELOG.md`
- `brand/<brand>/assets/**`

## Precedence

1. This file wins over generic "how should this brand asset be organised"
   guidance elsewhere.
2. [`.kiro/steering/tmp-files.md`](tmp-files.md) still bans writing brand assets
   to `/tmp/` or `.tmp/` — brand artefacts land in `brand/` per this doc's
   Rule 1.
3. [`.kiro/steering/commit-conventions.md`](commit-conventions.md) still governs
   commits touching `brand/**`. Each phase of a brand-system change is its own
   commit.

## Rule 1 — every brand lives at `brand/<brand>/`

Every workspace brand has EXACTLY ONE folder at `brand/<brand>/` where `<brand>`
is the kebab-case brand slug (`academorix` · `figentra` today · potential future
brands: `stackra` · `<operator-name>`).

Never `brand/logos/`. Never `brand/<brand>-logos/`. Never
`.tmp/drafts/<brand>/`. The canonical name matches the npm vendor scope
from [`.kiro/steering/package-naming.md`](package-naming.md) §Rule 1.

### The three-brand baseline

> **ADR anchor.** The third-brand extension is codified by
> [ADR-0112](../../.docs/adr/0112-beautilon-third-brand-registration.md) —
> Beautilon registered as workspace brand (3rd).

Today the workspace ships three brands:

- `brand/academorix/` — Track Orange · A-Chevron · sports academy product.
- `brand/figentra/` — Signal Mint · F-Cursor · developer + operator SaaS.
- `brand/beautilon/` — [accent placeholder · mark placeholder] ·
  brand-in-progress per ADR-0112 (finalisation via FUP-1 in that ADR).

Adding a fourth brand requires a new `brand/<name>/` folder + an ADR extension
per Rule 8 — following the ADR-0112 precedent.

## Rule 2 — every brand ships ONE `brand-system.html`

Never `brand-system-sprint1.html` + `brand-system-sprint2.html`. Never
`variants.html` + `preview.html` + `matrix.html` as canonical surfaces.
Exploration pages archive under `assets/exploration/`; the canonical brand page
is always `brand/<brand>/brand-system.html` — no exceptions.

## Rule 3 — pitch-deck 5-slot container per surface

Every `<section>` inside every `brand-system.html` uses this 5-slot container:

```
┌─────────────────────────────────────────────────────────────┐
│  BRAND · VERSION · KICKER                     NN / 28       │  ← top-row
│  CATEGORY · UPPERCASE MONO KICKER                           │  ← kicker
│  Section headline · 32-48px sans                            │  ← headline
│                                                             │
│  ┌────┐ ┌────┐ ┌────┐  ← content · asset grid | swatch     │
│  │    │ │    │ │    │      row | illustration set | table   │
│  └────┘ └────┘ └────┘                                       │
│                                                             │
│  SPEC · file paths · source · section index    NN / 28      │  ← footer
└─────────────────────────────────────────────────────────────┘
```

Five slots, always in this order:

| Slot        | Content                                        | Style                            |
| ----------- | ---------------------------------------------- | -------------------------------- |
| `.top-row`  | Brand · version (left) · section count (right) | Mono · dim · uppercase · 11px    |
| `.kicker`   | Category label                                 | Accent · mono · uppercase · 13px |
| `.headline` | Section title (h2)                             | Sans · 32-48px · weight 500      |
| `.content`  | Asset grid / swatch row / spec table           | Grid or flex per surface         |
| `.footer`   | Spec + source + section count                  | Mono · dim · 11px · full divider |

The classes carry the workspace-standard names: `.section-head` wraps the
top-row + kicker + headline; `.section-spec` wraps the footer. Every section
uses the same class names — CSS lives once per page.

### `not-yet-authored` variant

For surfaces catalogued but not authored, the `.content` slot renders a dashed-
border placeholder container:

```html
<div class="not-yet-authored">
  <p class="nya-kicker">NOT YET AUTHORED · CATALOG SLOT NN</p>
  <p class="nya-body">One sentence describing the intended surface.</p>
  <p class="nya-source">SPEC · surface #NN · KICKER · see brand/README.md.</p>
</div>
```

### `n/a` variant

For surfaces that don't apply (jerseys for a dev brand · certificates for a
tooling brand), use the `.not-applicable` container:

```html
<div class="not-applicable">
  <p class="nya-kicker">N/A · &lt;WHY IT DOESN'T APPLY&gt;</p>
  <p class="nya-body">One sentence explaining the exemption.</p>
</div>
```

## Rule 4 — the 28-surface canonical catalog

Every brand's `brand-system.html` covers the same 28 surface types, in the same
order:

### Tier A · Foundations (12)

01 Palette · 02 Wordmark · 03 Primary mark · 04 Mono mark · 05 Provenance mark +
lockup · 06 Typography · 07 Icons (product + UI) · 08 Social/OG assets · 09
Favicons · 10 Illustrations · 11 Patterns · 12 Motion + video tokens

### Tier B · Applications (11)

13 Landing · 14 Email templates · 15 Error pages · 16 Pitch decks · 17 Print
collateral · 18 Certificates · 19 Micro-brand · 20 Merch + apparel · 21 Office
signage · 22 Photography / moments · 23 Jersey typography

### Tier C · Documentation (5)

24 Rules of use · 25 Provenance / inheritance · 26 Voice + tone · 27 Motion +
video guidelines · 28 Changelog + versioning

Full slot-to-folder mapping lives at [`brand/README.md`](../../brand/README.md)
§"The 28-surface catalog".

## Rule 5 — folder-per-surface asset tree

Every brand's assets live under `brand/<brand>/assets/<surface>/` matching the
28-slot catalog. Canonical folder names:

```
brand/<brand>/assets/
├── palette/           # 01
├── logos/             # 02 · 03 · 04 · 05
├── typography/        # 06
├── icons/
│   ├── product/       # 07
│   └── social/        # 08
├── favicons/          # 09
├── illustrations/     # 10
├── patterns/          # 11
├── media/             # 12 + 22 (motion + moments)
├── landing/           # 13
├── emails/            # 14
├── errors/            # 15
├── decks/             # 16
├── print/             # 17
├── certificates/      # 18
├── micro-brand/       # 19
├── merch/             # 20
├── signage/           # 21
├── jerseys/           # 23
├── mockups/           # brand-in-situ previews (post-catalog extra)
├── exploration/       # early options + probe pages (archive)
└── <brand-native>/    # e.g. sports/ for Academorix, dev-surfaces/ for Figentra
```

Never invent a folder outside this list without amending §Rule 8.

## Rule 6 — semantic asset naming

Asset filenames are semantic, not alphabetic-prefixed:

- `wordmark.svg` — not `a-wordmark.svg`.
- `mark-primary.svg` — not `b-mark.svg`.
- `mark-mono.svg` — not `b-fsignal-mono.svg`.
- `provenance-mark.svg` — not `c-provenance-mark.svg` / `d-provenance-mark.svg`.

Prefixes (`a-`, `b-`, `c-`, `d-`) were exploration bookmarks. The canonical name
matches the catalog slot it fills. Migration codified in
[ADR-0103 §D2](../../.docs/adr/0103-brand-system-canonical-structure.md#d2--no-sprint-split).

## Rule 7 — cross-brand parity, per-brand rebind

Every brand SHARES:

- 5-slot container anatomy (Rule 3)
- 28-slot catalog (Rule 4)
- Folder tree (Rule 5)
- Type stack: Geist + Geist Mono (see
  [`brand/_shared/README.md`](../../brand/_shared/README.md))
- Neutral ramp: ink · paper · surface · text · border
- Elevation stack: --elevation-1..4
- Motion primitives (hover · theme · page-transition durations; cursor-blink is
  opt-in per Rule 7a below)

Every brand REBINDS only:

- `--signal` accent colour + its 5-step ramp (`--signal-100` through `-900`)
- Mark SVGs
- Wordmark SVGs
- Provenance mark + lockup

Rebinding anything else (typography · neutrals · elevation · motion) is a
review-blocking finding. If two brands genuinely disagree on typography, they
belong under different substrates — not both under `brand/`.

### Rule 7a — per-brand motion-primitive opt-out

The `_shared/motion` package ships common motion primitives (`--dur-hover` 150
ms, `--dur-theme` 250 ms, `--dur-page-in` 260 ms, `--dur-page-out` 180 ms,
`--dur-blink` 1000 ms, etc.). Individual brands MAY opt OUT of a specific
primitive when the primitive conflicts with the brand's core identity — the
opt-out is codified by an ADR that names:

1. The specific primitive being retired for the opting-out brand (variable
   name + duration).
2. Why the primitive conflicts with the brand's identity (name the visual mixup
   or the semantic drift).
3. Which sibling brands retain the primitive + why they retain it.
4. What (if anything) the opting-out brand substitutes — a bespoke motion token
   in the brand's own `:root` block, OR just "no equivalent" if the primitive's
   whole concern is dropped.

The primitive stays in `_shared/motion` after any single-brand opt-out — the
substrate remains available for every non-opting brand and every future brand
that wants the motif. Retiring a primitive workspace-wide (all brands opt out)
is a Rule 8 event (ADR extension amending ADR-0103).

Current opt-outs:

- **Academorix opts out of `--dur-blink` + `@keyframes blink` + `.cursor` +
  `mark-cursor`** (per
  [ADR-0104](../../.docs/adr/0104-academorix-color-logo-motion-simplification.md)
  §D4). Rationale: cursor-blink is Figentra's F-Cursor motif; ripping it out of
  every Academorix surface removed the 3-second brand mixup. Substitute: none —
  Academorix motion punctuates content (page transitions, scoreboard stingers,
  training-clip loops), never IS content.
- **Figentra retains `--dur-blink`** — the cursor-blink IS Figentra's core
  identity.

Enforcement grep for the opting-out brand:

```sh
# Zero-hit grep — Academorix cursor-blink references outside the
# steering-doc + ADR + retirement changelog. Brand-system.html + every
# asset SVG + every deck MUST be free of `@keyframes blink`, `.cursor`,
# `mark-cursor`, `--dur-blink`.
grep -rEn '@keyframes[[:space:]]+blink|\.cursor[[:space:]]*\{|class="cursor"|mark-cursor|--dur-blink' \
  brand/academorix/
```

Should return zero hits (informational-only mentions in comments are fine).

## Rule 8 — extending the catalog requires ADR

Adding a 29th surface — OR a new asset folder outside Rule 5 — requires an ADR
extension amending
[ADR-0103](../../.docs/adr/0103-brand-system-canonical-structure.md).

The ADR extension must:

1. Justify why an existing slot doesn't cover the new surface.
2. Name every brand that will need to fill the new slot.
3. Update `brand/README.md`'s catalog table + every brand's `README.md` in the
   same PR.

Reviewers reject unilateral catalog extensions.

## Rule 9 — every artefact carries provenance frontmatter

Every `.md` under `brand/**` opens with YAML frontmatter per
[`.kiro/steering/provenance-frontmatter.md`](provenance-frontmatter.md):

```
---
authored_by: <agent-slug OR human-handle>
authored_at: YYYY-MM-DD
source: <prompt-ref OR upstream-URL OR "human">
reviewed_by: <human-handle OR null>
reviewed_at: YYYY-MM-DD OR null
---
```

Every `.html` file carries the same fields inside an HTML comment block at the
top of `<head>` — one field per line, same format.

## Rule 10 — `_shared/` never contains brand-specific tokens

`brand/_shared/` documents workspace-canonical type + neutrals + motion +
elevation. Never accent colours. Never marks. Never anything that varies per
brand.

Rationale: reading `_shared/` should tell the reader "this is what every brand
inherits". Anything under `_shared/` that varies is a bug — move it to the
owning brand.

## Anti-patterns

| Anti-pattern                                                              | Fix                                                                                    |
| ------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Two `brand-system.html` files per brand (Sprint 1 + Sprint 2 split)       | Merge into ONE canonical `brand/<brand>/brand-system.html` per Rule 2.                 |
| Assets living in `.tmp/drafts/<something>/`                               | Move to `brand/<brand>/assets/<surface>/` per Rule 1 + Rule 5.                         |
| Alphabetic-prefix filenames (`a-wordmark.svg`, `b-mark.svg`)              | Rename to semantic slot (`wordmark.svg`, `mark-primary.svg`) per Rule 6.               |
| Bespoke folder outside the canonical Rule 5 list (`assets/misc/`)         | Fold into the closest catalog slot OR extend via ADR per Rule 8.                       |
| Section without the 5-slot container (bare content · no kicker · no spec) | Rewrap in `.section-head` + `.content` + `.section-spec` per Rule 3.                   |
| Accent colour override for a brand other than `--signal`                  | If it's truly per-brand, put it in the brand's `:root {...}` block; otherwise reject.  |
| `_shared/` containing `--track-orange` or `--signal-mint`                 | Neither cross-brand token. Move to the owning brand's `brand-system.html`.             |
| Third brand added without an ADR extension                                | Author the ADR extension per Rule 8 before merging.                                    |
| Skipping the NYA placeholder for a not-yet-authored slot                  | Add the `.not-yet-authored` container per Rule 3 — every catalog slot appears on-page. |
| Brand-system.html without a top-of-head provenance comment                | Add the block per Rule 9. Every brand-system.html carries it.                          |

## Enforcement

Zero-hit greps a reviewer runs before merging a brand-system change:

```sh
# Alphabetic-prefix filenames outside exploration archive
find brand/*/assets -name "[a-d]-*.svg" | grep -v exploration/

# Sprint-split HTML files (should never appear post-ADR-0103)
find brand -name "*sprint*.html" -o -name "brand-system-*.html"

# Assets outside the canonical folder list
find brand/*/assets -mindepth 1 -maxdepth 1 -type d | \
  grep -vE '(palette|logos|typography|icons|favicons|illustrations|patterns|mockups|landing|emails|errors|decks|print|certificates|jerseys|micro-brand|merch|signage|media|exploration|sports)'

# Missing NYA container for a not-yet-authored slot
# (manual review against per-brand README catalog table)
```

Each returns zero hits on a compliant repo.

## Cross-references

- [ADR-0103](../../.docs/adr/0103-brand-system-canonical-structure.md) — the
  authorising ADR.
- [ADR-0112](../../.docs/adr/0112-beautilon-third-brand-registration.md) —
  Beautilon registered as workspace brand (Rule 1 §"Three-brand baseline").
- [`.kiro/agents/brand-system-steward.md`](../agents/brand-system-steward.md) —
  the owning agent charter (authoring + auditing responsibilities).
- [`brand/README.md`](../../brand/README.md) — the cross-brand index + full
  catalog schema.
- [`brand/_shared/README.md`](../../brand/_shared/README.md) — Geist + neutrals
  · cross-brand tokens.
- [`.kiro/steering/provenance-frontmatter.md`](provenance-frontmatter.md) — Rule
  9 dependency.
- [`.kiro/steering/tmp-files.md`](tmp-files.md) — Rule 1 dependency.
- [`.kiro/steering/package-naming.md`](package-naming.md) — Rule 1 kebab-case
  brand slug alignment.
