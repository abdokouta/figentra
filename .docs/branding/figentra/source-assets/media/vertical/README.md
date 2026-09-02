---
authored_by: kiro
authored_at: 2026-08-19
source: prompt://v11-figentra-vertical-video
reviewed_by: null
reviewed_at: null
---

# Figentra · vertical video shape templates · v1.0

Six SVG placement templates for 9:16 vertical video output —
Instagram Reels · TikTok · YouTube Shorts. Every template is a
skeleton the motion-graphics operator layers footage / captions
onto; nothing here renders as-is on-air. The value is the shape
+ safe-zone discipline + brand-token discipline.

## Canvas

Every template renders at 1080 × 1920 (9:16 · standard vertical
delivery). ViewBox matches; retina exports scale from there.

## Safe zones (baked into every template)

- **Top-safe · 0..206 y** — reserved for the platform's account
  strip + system chrome (Reels username, TikTok logo, Shorts
  progress bar). Never place typography above 206 y.
- **Bottom-safe · 1368..1920 y** — reserved for captions,
  reactions, share-controls. Every content zone lives above 1368.
- **Horizontal margin · 40 px minimum** — brand kickers sit at
  60 px in most templates for extra breathing room.

## The six shapes

| # | File                      | Use-case                                                     |
| - | ------------------------- | ------------------------------------------------------------ |
| 1 | `01-hero-cover.svg`       | Opening thumbnail · title + kicker + f_ signature            |
| 2 | `02-feature-callout.svg`  | Mid-clip lower-third · video pane + glass caption card       |
| 3 | `03-quote-card.svg`       | Testimonial pull-quote · large mark-up quote + attribution   |
| 4 | `04-stat-card.svg`        | Single-anchor number · big value + label + hint · animatable |
| 5 | `05-product-showcase.svg` | Two-pane: product screenshot slot + caption + CTA marker     |
| 6 | `06-testimonial.svg`      | Talking-head + name + role + lower-third pull-quote          |

## Brand-token discipline

Every template composes ONLY the shipped Figentra tokens:

- **Ink** — `#0b0f14` full-bleed background (matches dark surface
  in `_shared/tokens.css`).
- **Paper** — `#fafafa` primary text.
- **Signal Mint** — `#00e5a0` for kickers, accents, underlines,
  quote glyphs, count-up value units.
- **Geist** for typography · **Geist Mono** for kickers +
  numerics.
- **f_ mark** inline at the shipped v3 geometry (44/8/76 spine ·
  44/30/8 top-hook · 28/36/8 crossbar · 28/64/8 mint underscore).

Rendering the mark inline (rather than loading `mark-primary.svg`)
keeps every template a single self-contained file — motion
operators drop them into After Effects / Figma / Rive without
resolving external refs.

## Motion notes

- **Hero cover · fade + subtle drift** — 800 ms fade-in over 4-6 px
  vertical drift. Signal-mint radial glow lifts on-air after 200 ms.
- **Feature callout · caption reveal** — 400 ms slide from bottom-
  off-screen. Video pane runs at its native speed underneath.
- **Quote card · sequential lines** — each `<tspan>` fades in over
  200 ms with 400 ms stagger. Attribution stack appears last.
- **Stat card · count-up** — 800 ms ease-out from 0 → target
  value. Mint `%` symbol pulses on target frame.
- **Product showcase · screen swap** — pane can host a 6-8 s
  screen-recording clip. Caption card fades in over the last 1 s.
- **Testimonial · Ken Burns headshot** — 6 s slow zoom + drift on
  the headshot pane. Pull-quote fades in over frame 2 s.

Every animation honours `prefers-reduced-motion` at the delivery
layer — motion operators cut the animation frames + ship a still-
frame variant per template when the customer surface (email
embed · docs preview) requires it.

## Cross-references

- `brand/figentra/brand-system.html` §12 · motion tokens ·
  documents the four duration stops these motion notes inherit.
- `.kiro/steering/brand-system.md` §Rule 5 · folder-per-surface ·
  `media/vertical/` is the canonical folder for this surface.
- `assets/logos/mark-primary.svg` · reference source of the
  inline f_ mark geometry.
