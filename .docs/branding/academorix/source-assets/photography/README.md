---
authored_by: kiro
authored_at: 2026-08-18
source: prompt://w5-academorix-photography
reviewed_by: null
reviewed_at: null
---

# Academorix photography library

Real-content image library for the Academorix marketing surface — sport-academy
marketing needs athletes, coaches, matches, and ceremonies. Illustrations alone
don't convince an academy director that we understand their world.

## Two-phase sourcing

### Phase 1 — Unsplash placeholders (immediate)

Curated Unsplash collections, free-license, direct-hotlinkable at CDN latency.
Every image tagged with `data-image-source="unsplash-placeholder"` in the
consuming HTML so a workspace-wide grep swaps them all out at Phase 2. See
[`unsplash-curation.md`](./unsplash-curation.md) for the full list — 40 photos
across 4 categories.

### Phase 2 — Commissioned photography (post-pilot)

At pilot launch (Q4 2026), commission real photography at the two pilot
academies (Barcelona Padel · Casablanca Sports Institute). Consent-signed,
on-brand, on-lens. Deliverables:

- ~15 training-session shots per academy
- ~10 match / competition shots
- ~8 ceremony / awards shots
- ~12 coach + athlete portraits

Budget line-item: **AED 45,000** (photographer day-rate × 2 days × 2 academies +
editing).

## Categories

Every image lives under exactly one category folder:

```
brand/academorix/assets/photography/
├── training/       # session-in-progress · warm-ups · drills · coach-athlete moments
├── matches/        # competitive play · scoreboard moments · crowd shots
├── ceremonies/     # medal moments · graduations · trophy raises
├── portraits/      # coach + athlete + parent single-subject shots
├── unsplash-curation.md      # Phase 1 photo catalog · Unsplash URLs + attributions
└── README.md       # this file
```

## Naming convention

`<category>/<sport>-<subject>-<n>.jpg` where:

- `<sport>` — one of
  `padel · tennis · football · basketball · swimming · martial-arts · athletics · volleyball · handball · rugby`
- `<subject>` — one of
  `training · match · ceremony · coach · athlete · parent · squad`
- `<n>` — sequential integer within the (category, sport, subject) triple.

Example: `training/padel-training-01.jpg`, `matches/football-match-04.jpg`,
`ceremonies/tennis-ceremony-02.jpg`, `portraits/coach-athlete-03.jpg`.

## Image spec

- **Resolution** — 2400px on the long edge (retina @2x @ 1200 render).
- **Format** — WebP + JPEG fallback per surface.
- **Compression** — 80% quality WebP, 85% JPEG.
- **Aspect ratios** — 16:9 (hero) · 4:3 (card) · 1:1 (portrait/tile) · 9:16
  (vertical/story).
- **Color** — sRGB · no LUT that fights the brand palette (Track Orange
  shouldn't read as red or salmon; skin tones true to source).

## Consent

Every commissioned photograph carries a signed model-release form on file. Store
at `.tmp/photography-releases/<academy>/<athlete-name>.pdf` (gitignored). Never
publish minors without an additional guardian signature per COPPA / GDPR-K
guidance.

## Cross-references

- [`unsplash-curation.md`](./unsplash-curation.md) — Phase 1 catalog.
- [`../landing/case-study-template.html`](../landing/case-study-template.html) —
  where photography lands.
- [`../patterns/showcase/`](../patterns/showcase/) — the `<AcademorixShowcase>`
  slider that renders these images.
