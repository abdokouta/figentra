# Package 16 — SEO

**Status:** Normative / implementation locked
**Package:** `@stackra/seo`

## Decision

SEO is a reusable cross-layer capability, not a standalone service. Domain/application services own content; `@stackra/seo` normalizes metadata, renders React head output and generates sitemap/robots artifacts.

## Exports

```text
@stackra/seo
@stackra/seo/react
@stackra/seo/native
@stackra/seo/nestjs
@stackra/seo/http
@stackra/seo/testing
```

## End-to-end path

```text
Domain/Page/Template/Page Builder
 → SEO resolver + policy
 → SeoDocument
 → React SSR/CSR
 → head/meta/link/JSON-LD

same source
 → sitemap eligibility
 → sitemap segments
 → robots.txt
```

## Contract

`SeoDocument` includes title, description, canonical URL, robots directives, locale/alternates, Open Graph, Twitter metadata, icons, JSON-LD and breadcrumbs. All fields are typed, normalized and policy constrained.

## NestJS

`/nestjs` exports `SeoModule`, resolver registry, controller factories for SEO metadata/sitemap/robots, DTOs and invalidation handlers. The host application resolves the domain resource and enforces publication/IAM rules.

## React

`/react` exports provider/hooks/head/meta/link/JSON-LD helpers with SSR/CSR parity. Canonical and robots semantics must not drift between server render and hydration.

## Page Builder

Structured SEO fields may be authored per page/template revision. Arbitrary head HTML/scripts are prohibited. Publication records the SEO projection version/hash used for cache invalidation.

## Crawling artifacts

Only public, canonical and indexable URLs enter sitemaps. Large sites use an index plus segmented files. The system retains last-known-good public sitemap snapshots until a replacement validates successfully. Robots rules never expose private/admin routes as crawl targets.

## Localization

Locale groups produce deterministic canonical/hreflang relationships. Missing locales follow explicit policy and are never silently duplicated.

## Structured data

Validated JSON-LD builders support WebSite, WebPage, BreadcrumbList, Product, Offer, Article, Organization, LocalBusiness, Event and ItemList. Unsafe scripts/URLs and invalid schemas are rejected.

## Security/testing

Reject unsafe schemes, header injection, script injection and private URLs. Test metadata precedence, canonical normalization, hreflang, robots, JSON-LD, SSR/CSR parity, sitemap eligibility, cache invalidation and tenant/domain isolation.

## Cross-reference

See `.kiro/plans/packages/capabilities/seo.md` and `.kiro/plans/2026-09-03-search-reporting-dashboard-seo-e2e-plan.md`.
