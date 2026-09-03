---
authored_by: kiro
authored_at: 2026-08-17
source: prompt://academorix-brand-sprint-2
reviewed_by: null
reviewed_at: null
---

# Certificates · v1.1 draft

Three A4-landscape SVG templates for every certificate an Academorix academy
issues. Every field is a `{{TOKEN}}` slot the consumer app substitutes at issue
time.

## Templates

| File                     | Issued when                                                        |
| ------------------------ | ------------------------------------------------------------------ |
| `grading-event.svg`      | Athlete completes a grading assessment (regardless of pass/fail).  |
| `belt-level.svg`         | Athlete promotes to a new rank; centres a colour-picked belt bar.  |
| `tournament-diploma.svg` | End of a tournament. One template covers 1st/2nd/3rd/participation |
|                          | via `{{PLACE}}` + `{{PLACE_COLOR}}` + `{{PLACE_LABEL}}` slots.     |

## Common variable slots

Every template exposes at minimum:

- `{{RECIPIENT_NAME}}` — athlete's full display name.
- `{{DISCIPLINE}}` — sport + sub-discipline.
- `{{SERIAL_NO}}` — auto-generated, verifies at
  `academorix.com/verify/{{SERIAL_NO}}`.
- `{{ISSUE_DATE}}` (belt) / `{{EVENT_DATE}}` (grading) / `{{TOURNAMENT_DATE}}`
  (diploma).
- Two signature blocks with role sub-labels.

The full slot list per template is documented in the SVG file header comment.
Consumers substitute via string replacement server- side, then either save as
SVG or convert to print-ready PDF (via Chromium headless, PlaywrightScrape, or
`resvg-cli`).

## Belt colour palette · workspace convention

For `belt-level.svg`, `{{RANK_BELT_COLOR}}` matches the discipline's canonical
rank system. The workspace-shipped defaults for the three disciplines that ship
in v1.1:

### Karate · Shotokan (WKF)

| Kyu / Dan           | Belt color · hex |
| ------------------- | ---------------- |
| 10th kyu · white    | `#fafafa`        |
| 9th kyu · yellow    | `#f5b400`        |
| 8th kyu · orange    | `#ff8a3a`        |
| 7th kyu · green     | `#00a651`        |
| 6th kyu · blue      | `#0f68b0`        |
| 5th kyu · purple    | `#6b3ea3`        |
| 4th kyu · brown     | `#8b5a2b`        |
| 3rd-1st dan · black | `#141414`        |

### Judo (IJF)

Same ordering, WKF-adjacent. Workspace maintains the map at
`docs/brand/academorix/07-belt-taxonomy.md` (planned).

### Padel / Tennis / Basketball · club-tier

These sports don't run canonical belt systems. `belt-level.svg` still applies —
swap `{{RANK_NAME}}` to `"U14 · Skills Level 3"` and `{{RANK_BELT_COLOR}}` to a
club-picked color.

## Tournament diploma colour convention

| Place         | `{{PLACE}}` | `{{PLACE_COLOR}}`                    | `{{PLACE_LABEL}}`    |
| ------------- | ----------- | ------------------------------------ | -------------------- |
| Gold          | `1st`       | `#FF6B35` · Track Orange             | `GOLD · CHAMPION`    |
| Silver        | `2nd`       | `#6a6a6a` · silver metallic-adjacent | `SILVER · RUNNER-UP` |
| Bronze        | `3rd`       | `#a25a2b` · bronze metallic-adjacent | `BRONZE`             |
| Participation | `—`         | `#141414` · ink                      | `PARTICIPANT`        |

Track Orange for gold is the workspace convention — every Academorix tournament
recognises the accent as the champion's colour rather than yellow-gold, keeping
the brand recognisable end-to-end.

## Rendering to PDF

The recommended pipeline (once the runtime lands):

```bash
# Substitute {{TOKENS}} server-side via sed / mustache / handlebars
mustache issue.json belt-level.svg > .out/belt-level-filled.svg

# Convert to PDF (resvg-cli · ships the crispest SVG-to-PDF today)
resvg .out/belt-level-filled.svg .out/belt-level.pdf --dpi 300
```

Alternatively, render via Chromium headless (best colour fidelity for the paper
texture + subtle shadows):

```bash
chromium --headless --print-to-pdf=.out/belt-level.pdf --no-margins \
  file://$(pwd)/.out/belt-level-filled.svg
```

## Verification page

Every serial number points at `https://academorix.com/verify/{{SERIAL_NO}}` — a
lightweight page that reads the certificate's ledger row (issuer + recipient +
date + rank + signer) and confirms it's the real record. Anti-forgery is the
workspace's response to the paper- certificate leakage the market currently
suffers from.

## Cross-references

- `../README.md` · Sprint 2 index
- `../_shared/tokens.css` · Track Orange + Geist rebind
- Sprint 1 `docs/brand/academorix/02-logo-spec.md` · A-Chevron geometry
