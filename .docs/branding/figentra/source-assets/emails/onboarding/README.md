---
authored_by: kiro
authored_at: 2026-08-19
source: prompt://v11-figentra-onboarding-emails
reviewed_by: null
reviewed_at: null
---

# Figentra · onboarding email sequence · v1.0

Seven touch-points spanning Day 0 → Year 1 of a Figentra customer engagement.
Every template inherits from `_theme.tsx` and ships as a React Email component
ready to render + preview via `@react-email/dev`.

## The cadence

| #   | File                      | Trigger                          | Purpose                                               |
| --- | ------------------------- | -------------------------------- | ----------------------------------------------------- |
| 1   | `01-welcome.tsx`          | Day 0 · MSA signed               | Load the doctrine · book intake                       |
| 2   | `02-intake-scheduled.tsx` | Day 1-3 · intake booked          | Preview the agenda + ADR-0001 draft                   |
| 3   | `03-first-adr.tsx`        | Week 1 · ADR-0001 accepted       | Show the doctrine layer live in-repo                  |
| 4   | `04-first-deploy.tsx`     | Week 2-3 · first production ship | The seven-layer receipt (ADR → deploy)                |
| 5   | `05-retro.tsx`            | Month 1 · retrospective          | Number of governance findings that made it to prod: 0 |
| 6   | `06-quarterly-review.tsx` | Quarter 1 · 90-day boundary      | Regulator-ready audit-response document               |
| 7   | `07-anniversary.tsx`      | Year 1 · engagement anniversary  | Renewal + case-study opening                          |

## Shared shape

Every template composes `EmailShell` from `_theme.tsx` which renders:

- **Header** — Ink strip with the `f_` mark + wordmark + Signal-mint
  "Governance-first" kicker.
- **Body** — Paper card with rounded corners. Sender copy uses `<Kicker>` +
  `<H1>` + `<H2>` + `<P>` + `<Muted>` primitives; every ADR ID · commit SHA ·
  phone number wraps in `<MonoChip>`; every CTA ships as a bulletproof-table
  `<CTA>` button.
- **Footer** — 2-line provenance block
  (`Figentra · governance-first agentic delivery` + long-form context) +
  unsubscribe · Privacy · MSA · Trust Center links + operator badge
  (`Figentra L.L.C · Casablanca, Morocco · © 2026`).

## Merge-vars

Every template declares its merge-vars in its own file-header docblock. The
convention: `{{camelCase}}` double-braced identifiers the send infra swaps at
render time. Common vars every template consumes:

- `{{firstName}}` · signer / on-call primary contact.
- `{{partnerName}}` · Figentra partner assigned to the account.
- `{{unsubscribeUrl}}` · one-click list unsubscribe (footer).

Template-specific vars declared per file. Naming aligns with the customer CRM
tokens; no aliasing at the template layer.

## Rendering

The templates ship as React Email TSX. To preview locally:

```
cd brand/figentra/assets/emails
pnpm install
pnpm dlx @react-email/cli dev
```

The `email dev` server auto-excludes files prefixed with `_` (`_theme.tsx`) —
every other file surfaces in the preview UI in numerical order.

## Provenance

Every template carries provenance in its file-header docblock. The
first-authored batch (2026-08-19) was AI-authored via prompt-driven generation +
reviewed by null pending native-Arabic + operator sign off. Every subsequent
edit ships with an updated `reviewed_by` field per
`.kiro/steering/provenance-frontmatter.md`.

## Cross-references

- `brand/figentra/brand-system.html` §14 · email templates — documents the token
  palette every onboarding template inherits.
- `brand/academorix/assets/emails/src/_theme.tsx` — parallel Academorix _theme
  composition for cross-brand parity review.
- `.kiro/steering/brand-system.md` §Rule 5 · folder-per-surface — emails/ is the
  canonical folder name.
