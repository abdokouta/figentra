---
authored_by: kiro
authored_at: 2026-08-21
source: prompt://academorix-brand-100-percent-enterprise
reviewed_by: null
reviewed_at: null
---

# Academorix brand · v1.1

Sports academy software from the whistle to the trophy. Fields, courts, mats,
and pools — one brand system across every surface a coach touches.

**Accent:** Track Orange `#FF6B35` (single accent · one meaning · ADR-0104)
**Mark:** Wordmark — `academorix` in Geist Medium · viewBox 320×80 ·
`currentColor` fill · zero cursor bar · zero apex marker · zero animation
**Type:** Geist + Geist Mono **Motion:** Steady frame · no cursor blink
(Figentra retains its F-Cursor; Academorix draws the clean line per ADR-0104)
**Canonical page:** [`brand-system.html`](brand-system.html) — open by
double-clicking.

## Catalog · 27 shipped · 1 not-yet of 28

_Full change history:_ [`CHANGELOG.md`](CHANGELOG.md) · **latest:** v1.1
(2026-08-21 · 100% enterprise sweep · ADR-0104).

### Tier A — Foundations (12)

| #   | Surface                       | Status  | Where                                                                                                |
| --- | ----------------------------- | ------- | ---------------------------------------------------------------------------------------------------- |
| 01  | Palette · Track Orange ramp   | shipped | `assets/palette/*.svg` (inline in `brand-system.html` §01)                                           |
| 02  | Wordmark                      | shipped | `assets/logos/wordmark.svg` · Geist Medium 48/56 · `currentColor` fill                               |
| 03  | Primary mark · wordmark       | shipped | Wordmark IS the primary mark (ADR-0104) · same file as §02                                           |
| 04  | Mono wordmark                 | shipped | Wordmark theme-adapts via `currentColor` · §04 shows the mono discipline across 6 substrates         |
| 05  | Provenance mark + lockup      | shipped | `assets/logos/provenance-mark.svg` + `provenance-lockup.svg` · verified-tick + wordmark              |
| 06  | Typography                    | shipped | `brand-system.html` §03 · Geist + Geist Mono specimen cards (sans + mono)                            |
| 07  | Icons · product + UI          | shipped | 24 SVGs in `assets/icons/product/` · 24×24 grid · 2 px stroke · `currentColor` · Track Orange accent |
| 08  | Social / OG assets            | not-yet | `assets/mockups/social-headers.html` ships an OG preview; per-platform OG PNGs deferred              |
| 09  | Favicons                      | shipped | `assets/favicons/` · favicon.svg + favicon.ico + 8 raster exports (16/32/64/96/128/180/192/512)      |
| 10  | Illustrations · hero + accent | shipped | `assets/illustrations/{empty-state,hero-bg,loading-spinner,section-divider}.svg`                     |
| 11  | Patterns                      | shipped | `assets/patterns/p-chevron-lanes.svg`                                                                |
| 12  | Motion + video tokens         | shipped | `brand-system.html` §12 · timing + easing tokens + 4 video-shape guidelines                          |

### Tier B — Applications (11)

| #   | Surface                           | Status  | Where                                                                                                 |
| --- | --------------------------------- | ------- | ----------------------------------------------------------------------------------------------------- |
| 13  | Landing page                      | shipped | `assets/landing/index.html`                                                                           |
| 14  | Email templates · React Email     | shipped | `assets/emails/src/` · 4 templates (welcome · invoice · session-reminder · newsletter) + shared theme |
| 15  | Error pages                       | shipped | `assets/errors/{403,404,500,503}.html` + 4 illustration SVGs                                          |
| 16  | Pitch decks · investor + owner    | shipped | `assets/decks/{investor,academy-owner}.html` · two 12-slide decks                                     |
| 17  | Print collateral                  | shipped | `assets/print/{match-report,registration-form,roster}.html`                                           |
| 18  | Certificates                      | shipped | `assets/certificates/{belt-level,grading-event,tournament-diploma}.svg`                               |
| 19  | Micro-brand · seasonal + event    | shipped | `assets/micro-brand/{season-mark,tournament-crest}.svg` + `generator.html`                            |
| 20  | Merch + apparel                   | shipped | `assets/merch/{sponsor-slot-grid,t-shirt-tech,warmup-jacket}.svg`                                     |
| 21  | Office signage                    | shipped | `assets/signage/{roster-board,scoreboard,trophy-wall}.svg`                                            |
| 22  | Photography / moments direction   | shipped | `brand-system.html` §11 · direction + reference frames                                                |
| 23  | Jersey typography (sports-native) | shipped | `assets/jerseys/{block,modern,varsity}.svg` + `numbers-preview.html`                                  |

### Tier C — Documentation (5)

| #   | Surface                        | Status  | Where                                                     |
| --- | ------------------------------ | ------- | --------------------------------------------------------- |
| 24  | Rules of use · do / don't      | shipped | `brand-system.html` §24 · do/don't grid for every surface |
| 25  | Provenance / inheritance table | shipped | `brand-system.html` §23 · inheritance ledger              |
| 26  | Voice + tone                   | shipped | `brand-system.html` §24 · voice contrast + tone tokens    |
| 27  | Motion + video guidelines      | shipped | `brand-system.html` §12 + §27 · guidelines vs tokens      |
| 28  | Changelog + versioning         | shipped | `brand-system.html` §28 · v1.0 release notes + this file  |

**Extras (not in canonical 28-slot):**

- `assets/mockups/social-headers.html` — brand-in-situ preview (Twitter ·
  LinkedIn · GitHub)
- `assets/sports/` — Academorix-native sport vertical (hero-tiles + fields for
  10 sports · brand-native folder per ADR-0103 §Rule 5). The `icons/` subfolder
  was authored + retired on 2026-08-21 — chip-size sport icons read as generic
  circles regardless of geometry, so consumers reach for Iconify (`mdi:soccer`,
  `mdi:basketball`) instead per ADR-0104.
- `assets/exploration/` — early logo options + preview (archived)

**Known-gaps · follow-up work:**

- §08 Social/OG assets — per-platform OG PNGs (Twitter · Facebook · LinkedIn ·
  Slack · Discord) not yet rendered; `mockups/social-headers.html` covers the
  layout but binary exports need authoring.
- Section-content-vs-catalog physical ordering — sections carry their canonical
  slot number via `section-count` but the file's physical read order does not
  match numerical order. A dedicated audit PR will reorder physically for
  reading flow.

## Assets · full file inventory

```
brand/academorix/
├── brand-system.html                  # 28 canonical sections + summary
├── README.md                          # this file
└── assets/
    ├── palette/*.svg                  # 01 · Track Orange ramp swatches
    ├── logos/{wordmark,mark-primary,provenance-mark,provenance-lockup}.svg
    ├── typography/                    # 06 (specimens live inline in brand-system.html §03)
    ├── icons/
    │   ├── product/*.svg              # 07 · 24 icons (home · dashboard · calendar · alert · trophy · whistle · ...)
    │   └── social/                    # 08 · staged for OG PNG queue
    ├── favicons/
    │   ├── favicon.svg                # 09 · master
    │   ├── favicon.ico                # ICO fallback
    │   ├── favicon-{16,32,64,96,128}.png
    │   ├── apple-touch-180.png
    │   ├── android-192.png
    │   ├── pwa-512.png
    │   └── manifest-preview.md
    ├── illustrations/{empty-state,hero-bg,loading-spinner,section-divider}.svg
    ├── patterns/p-chevron-lanes.svg
    ├── media/                         # 12 · motion + moments (guidelines inline in brand-system.html)
    ├── landing/index.html
    ├── emails/
    │   ├── README.md · package.json · tsconfig.json
    │   ├── src/{_theme,welcome,invoice,session-reminder,newsletter}.tsx
    │   └── scripts/
    ├── errors/{403,404,500,503}.html + 4 illustration SVGs
    ├── decks/{investor,academy-owner}.html
    ├── print/{match-report,registration-form,roster}.html
    ├── certificates/{belt-level,grading-event,tournament-diploma}.svg + README.md
    ├── micro-brand/{season-mark,tournament-crest}.svg + generator.html
    ├── merch/{sponsor-slot-grid,t-shirt-tech,warmup-jacket}.svg
    ├── signage/{roster-board,scoreboard,trophy-wall}.svg
    ├── jerseys/{block,modern,varsity}.svg + numbers-preview.html
    ├── mockups/social-headers.html
    ├── sports/
    │   ├── hero-tiles/{athletics,basketball,football,handball,martial-arts,padel,rugby,swimming,tennis,volleyball}.svg
    │   └── fields/{basketball-court,football-pitch,handball-court,mma-mat,padel-court,rugby-pitch,running-track,swimming-pool,tennis-court,volleyball-court}.svg
    │   # ─ retired 2026-08-21 · icons/ subfolder deleted per ADR-0104 ─
    └── exploration/    # (empty · was: 4 logo option SVGs + logo-options.html)
```

## Changelog

Detailed release notes live in [`CHANGELOG.md`](CHANGELOG.md). Summary below.

- **v1.1 · 2026-08-21 · 100% enterprise sweep** — Codified by
  [ADR-0104](../../.docs/adr/0104-academorix-color-logo-motion-simplification.md).
  Reconciles single-accent Track Orange (retires 2026-08-18 dual-tone drift) ·
  wordmark-only identity (retires A-Chevron mark) · retires 10 Tier 2 sport
  icons (Iconify fallback for chip-size marks) · retires cursor-blink motif from
  every Academorix surface (Figentra retains) · §04 rewritten as real
  6-substrate wordmark specimen · §11b Glass Surfaces rebound Turf Green → Track
  Orange · steering `brand-system.md` §Rule 7a per-brand motion opt-out
  framework authored.
- **v1.0 · 2026-08-18 · full parity pass** — Truthfulness sweep: §04 Icons + §05
  Favicons subtitles corrected to reflect the 24 shipped icons + full raster
  favicon queue (previously falsely claimed backlog). README catalog table
  rewritten with accurate status for every slot: 26 shipped · 1 n/a (mono mark)
  · 1 not-yet (per-platform OG PNGs). Retired sprint-N vocabulary workspace-wide
  (~15 mentions across `brand-system.html` + README). Added known-gaps section
  documenting the OG-PNG follow-up + physical section re-order follow-up.
- **v1.0 · 2026-08-17** — Merged the foundations tier (14 sections) with the
  applications tier (12 sections) into ONE canonical `brand-system.html` at 28
  catalog slots. Migrated 75 files from `.tmp/drafts/academorix-logos/` (retired
  2026-08-18) to `brand/academorix/assets/` with semantic renames. Every asset
  resolves under `assets/<surface>/`.

## v1.1 backlog

The v1.1 cycle opens once the first three academy pilots run one full
registration → season → grading cycle on the v1.0 brand surface. Named backlog:

1. **Certificate signer QR real linkage** — replace the finder-pattern
   silhouette on §18 grading + belt + tournament templates with a real QR that
   resolves to the certificate's signer identity + serial number. Requires the
   signer + serial API contract to land first. `assets/certificates/`.
2. **Sport-vertical expansion** — extend beyond the current 10 (athletics ·
   basketball · football · handball · martial-arts · padel · rugby · swimming ·
   tennis · volleyball). Named candidates ordered by product-team signal:
   ice-hockey · rowing · cricket · baseball · lacrosse. Each sport ships: (a)
   hero-tile illustration under §10c · (b) fields & courts vocabulary under §10b
   · (c) drills library placeholder · (d) positions taxonomy · (e) benchmark set
   · (f) formation library. 8-16 h per sport. No chip-size sport-icon set is
   planned — Iconify covers that surface (ADR-0104).
3. **Coach-facing dashboard chrome** — surface set for the coach app (roster
   view · session planner · attendance tracker · progress card renderer). Sits
   under §13 landing as an authenticated post-login variant.
4. **Parent-facing family surface** — surface set for the parent/guardian app
   (child schedule · progress feed · payment history · certificate archive).
   Same parenthetical as (3).
5. **Referee + officiate content pack** — match report templates + scoring UI
   patterns + injury protocol illustrations. Cross-references §17 Print.
6. **Match-day capture kit** — six-shot storyboard template (line-up · kickoff ·
   action · timeout · celebration · handshake) + edit LUT presets for photog
   partners. Under §22 Photography.
7. **Season-mark generator** — parametric generator turning a season (year +
   sport + division) into a season-mark SVG following the §19 micro-brand
   vocabulary. Automates what's currently hand-authored.
8. **Certificate lithography QC pass** — audit print output on 250 gsm silk
   card, verify color match against §01 palette + verify signer + serial linkage
   produces scannable QR at 8mm × 8mm rendered size.

Each becomes its own commit under `brand/academorix/assets/<surface>/` when
authored. Adding a v1.1 item beyond this list requires an update to this
README + a matching entry in the sibling `brand/figentra/README.md` if the
concern crosses brands.

## Preview

```
/usr/bin/open brand/academorix/brand-system.html
```

## Cross-references

- [`CHANGELOG.md`](CHANGELOG.md) — detailed release notes per version
- [`../README.md`](../README.md) — cross-brand index + catalog schema
- [`../_shared/README.md`](../_shared/README.md) — Geist + neutrals · shared
  tokens
- [`../figentra/README.md`](../figentra/README.md) — Figentra sibling
- [`../../.docs/adr/0103-brand-system-canonical-structure.md`](../../.docs/adr/0103-brand-system-canonical-structure.md)
  — the 28-slot canonical structure ADR
- [`../../.docs/adr/0104-academorix-color-logo-motion-simplification.md`](../../.docs/adr/0104-academorix-color-logo-motion-simplification.md)
  — v1.1 simplification decisions (single accent · wordmark-only · Tier 2
  retirement · motion opt-out)
- [`../../.kiro/steering/brand-system.md`](../../.kiro/steering/brand-system.md)
  — authoring rules (§Rule 7a codifies the per-brand motion opt-out)
- [`../../.kiro/reports/2026-08-21-academorix-brand-100-percent.md`](../../.kiro/reports/2026-08-21-academorix-brand-100-percent.md)
  — post-sweep audit report
