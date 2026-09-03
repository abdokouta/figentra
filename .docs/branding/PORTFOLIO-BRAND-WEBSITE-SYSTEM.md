# Figentra Portfolio — Enterprise Brand & Website Gap Closure

## Goal

Bring the corporate site and both product sites to an enterprise standard
comparable in information architecture and trust depth to mature technology
companies, while preserving distinct product identities.

## Gap closure matrix

| Gap                     | Figentra           | Academorix        | Beautilon            |
| ----------------------- | ------------------ | ----------------- | -------------------- |
| Customer outcomes       | Required           | Required          | Required             |
| Product differentiation | Required           | Required          | Required             |
| Enterprise proof        | Required           | Required          | Required             |
| Team storytelling       | Required           | Optional/selected | Optional/selected    |
| Industry context        | MENA + enterprise  | Sports            | Care/beauty/wellness |
| Trust/security          | Required           | Required          | Required             |
| Conversion architecture | Enterprise inquiry | Demo              | Demo                 |
| Distinct visual system  | AI/enterprise      | Sports            | Premium care         |
| Favicon source of truth | F-Cursor           | Own mark          | Own mark             |
| OG/social system        | Required           | Required          | Required             |
| SEO architecture        | Corporate          | Vertical          | Vertical             |
| Accessibility           | WCAG 2.2 AA        | WCAG 2.2 AA       | WCAG 2.2 AA          |

## Shared enterprise requirements

Every public property must have:

- responsive navigation;
- keyboard accessibility;
- skip link;
- semantic headings;
- breadcrumbs where useful;
- search where content volume warrants it;
- legal footer;
- privacy/consent mechanism where required;
- security disclosure;
- `security.txt`;
- sitemap;
- robots policy;
- canonical metadata;
- OG/Twitter images;
- favicon and app icons;
- 404/403/500/503/error states;
- loading states;
- reduced-motion behavior;
- analytics consent boundaries;
- performance budget;
- image optimization;
- structured data where appropriate.

## Brand independence rule

Shared infrastructure is allowed.

Shared visual identity is not required.

Use shared engineering primitives for:

- accessibility;
- routing;
- SEO;
- analytics;
- image optimization;
- forms;
- content schemas;
- testing.

Use brand-specific design tokens for:

- color;
- typography;
- radii;
- illustration;
- imagery;
- motion;
- iconography;
- layout personality;
- CTA language.

## Asset pipeline

For every brand:

```text
Master Vector
   ↓
SVG
   ↓
Favicon / App Icons
   ↓
OG / Social
   ↓
Light / Dark variants
   ↓
Optimized web exports
```

Never manually create a favicon that diverges from the canonical mark.

## Image strategy

### Figentra

Systems + people + enterprise operations.

### Academorix

Sports action + facilities + coaches + athlete operations.

### Beautilon

Care professionals + elegant spaces + real customer experience.

No brand should use generic AI-generated humans as a substitute for real
team/customer photography where authenticity matters.

## Illustration strategy

Illustrations must communicate an idea, not fill whitespace.

Every major illustration should have:

- semantic purpose;
- alt-text strategy;
- SVG master;
- dark/light consideration;
- responsive crop;
- reduced-motion behavior.

## Content governance

Every public claim has one of:

- Verified fact;
- Product capability;
- Customer evidence;
- Strategic positioning;
- Editorial opinion.

Do not mix these categories.

## Enterprise proof framework

Use proof in increasing strength:

1. Product capability.
2. Demonstrable workflow.
3. Customer story.
4. Verified metric.
5. Customer logo/reference.
6. Independent validation/certification.

Never skip from capability directly to an unsupported market claim.

## Conversion framework

### Figentra

Primary: `Talk to Figentra`

Secondary: `Explore AI agents`

### Academorix

Primary: `Book a demo`

Secondary: `See the platform`

### Beautilon

Primary: `Book a demo`

Secondary: `Explore the platform`

## Production readiness gate

A website page is not complete until:

- copy is approved;
- claims are verified;
- responsive layout is implemented;
- assets are optimized;
- accessibility passes;
- metadata exists;
- analytics/consent behavior is correct;
- error states exist;
- performance budget passes;
- legal/trust links are present;
- CTA destination works;
- screenshots are reviewed at desktop/tablet/mobile.
