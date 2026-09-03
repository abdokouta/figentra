---
authored_by: kiro
authored_at: 2026-09-03
status: canonical
package: '@stackra/seo'
---

# `@stackra/seo` — end-to-end SEO capability

## Purpose

Provide a single typed SEO contract spanning backend metadata, page rendering, React document head, sitemap/robots generation, structured data, canonical URLs, localization, social previews, indexing controls and cache invalidation. SEO is a reusable capability, not a standalone SEO service in the 14-service architecture.

## Subpaths

```text
@stackra/seo
@stackra/seo/react
@stackra/seo/native
@stackra/seo/nestjs
@stackra/seo/http
@stackra/seo/testing
```

`/native` exposes only non-web metadata helpers useful to hybrid/native clients. HTML head manipulation belongs to `/react` and web applications.

## Ownership

The host application/domain service owns authoritative content such as products, articles, pages and locales. `@stackra/seo` owns the normalized SEO representation and rendering/generation contracts. It never owns the underlying domain entity.

## Canonical SEO document

```ts
interface SeoDocument {
  title: string;
  description?: string;
  canonicalUrl?: string;
  robots?: RobotsDirectives;
  alternates?: readonly SeoAlternate[];
  openGraph?: OpenGraphMetadata;
  twitter?: TwitterMetadata;
  icons?: readonly SeoIcon[];
  structuredData?: readonly JsonLdDocument[];
  keywords?: readonly string[];
  locale?: string;
  localeGroup?: string;
  breadcrumb?: readonly BreadcrumbItem[];
}
```

Every field has normalization, length/scheme constraints and precedence rules.

## Resolution pipeline

```text
Domain entity / Page / Page Builder / Template
            ↓
SEO source resolver
            ↓
SEO policy + defaults
            ↓
locale/canonical resolution
            ↓
structured-data builder
            ↓
SeoDocument
            ↓
React head renderer / HTTP metadata / sitemap generator
```

Application defaults are applied first, entity/page overrides second, route-specific overrides third, with an explicit precedence table. Conflicting canonical URLs are rejected rather than silently guessed.

## React integration

`@stackra/seo/react` exports:

```text
SeoProvider
SeoHead
useSeo
useResolvedSeo
createMetaTags
createLinkTags
createJsonLd
```

It supports React SSR and CSR. SSR must emit the same normalized metadata that hydration expects. Client-only mutations are limited to explicitly volatile fields and must not change canonical/robots semantics unexpectedly.

## NestJS integration

`@stackra/seo/nestjs` exports:

```text
SeoModule
SeoResolverRegistry
SeoControllerFactory
SeoMetadataDto
SitemapControllerFactory
RobotsControllerFactory
SeoCacheInvalidationHandler
SeoRenderContract
```

The module integrates with page/domain resolvers and can expose:

```text
GET /v1/seo/:resource/:id
GET /sitemap.xml
GET /sitemaps/:segment.xml
GET /robots.txt
```

The service hosting the controller remains responsible for authentication where metadata is private and for selecting the domain resource.

## Page Builder integration

Page Builder components may declare SEO capabilities:

```text
seo.title
seo.description
seo.canonical
seo.noIndex
seo.ogImage
seo.jsonLd
```

The builder edits structured SEO fields with validation. It never permits arbitrary `<head>` HTML/scripts. Published page revisions carry an SEO projection hash so cache invalidation can be deterministic.

## Dynamic metadata

A resolver can derive metadata from approved domain data:

```text
product → title/description/canonical/og image/product JSON-LD
article → title/description/canonical/article JSON-LD
category → title/description/canonical/item-list JSON-LD
page-builder page → explicit metadata + breadcrumbs + WebPage JSON-LD
```

Resolvers receive a typed context and cannot issue raw database queries. The host domain service supplies the entity snapshot.

## Canonical URLs

Canonical URL generation is configuration-driven and tenant/domain-aware. It normalizes scheme, hostname, locale path, trailing-slash policy and known tracking parameters. Unsupported or ambiguous hostnames are rejected. Canonical URLs never include authentication/session data.

## Localization and hreflang

A locale group identifies equivalent localized resources. The resolver generates deterministic `alternate` links and `hreflang` entries, including a configured default/fallback locale. Missing locale variants are handled by explicit policy (`omit`, `fallback`, or `noindex`) rather than implicit duplication.

## Robots/indexing controls

Supported directives include `index/noindex`, `follow/nofollow`, `noarchive`, `nosnippet`, max-image/video/preview values and HTTP-equivalent directives where needed. Sensitive/private routes default to non-indexable and are denied from sitemap generation.

## Structured data

JSON-LD is represented as typed validated objects. Built-in builders include:

```text
WebSite
WebPage
BreadcrumbList
Product
Offer
Article
Organization
LocalBusiness
Event
ItemList
FAQPage
```

Schemas are allowlisted by resource type. Circular references, invalid URLs and unsafe script content are rejected. The renderer serializes JSON-LD safely without HTML injection.

## Open Graph and social previews

Image references use Files/media IDs or validated absolute URLs. The backend can return transformed image metadata (dimensions, mime, CDN URL) without leaking storage credentials. Preview variants are deterministic by revision/hash.

## Sitemap generation

Sitemaps are generated from an indexed, authorized list of public canonical URLs. Large sites use segmented sitemap files plus an index. Generation is checkpointed and cacheable. A URL appears only when it is public, canonical, indexable and policy-compliant.

A page/domain change emits a versioned SEO invalidation event. The sitemap worker regenerates only affected segments when possible.

## Robots.txt

`robots.txt` is generated from tenant/application policy plus managed routes. Private, administrative and authenticated routes are never exposed as crawl targets. Per-domain configuration is resolved server-side.

## Caching

SEO output is cache-friendly because it is deterministic by domain revision + locale + host configuration. Public output may use ETag/CDN caching. Personalized/private metadata is never publicly cacheable.

Cache keys include tenant/application/domain/locale/resource/revision and SEO policy version. Invalidations occur from page publication, content update, locale update, domain change and policy change events.

## Security

Reject unsafe schemes, CRLF/header injection, script injection and secret-bearing metadata. Only public canonical URLs may enter public sitemap output. Tenant hostname resolution is server-validated. SEO metadata must respect IAM visibility and page publication status.

## Reliability

SEO metadata generation is synchronous for HTML page rendering when cheap; sitemap/preview batch work is asynchronous and resumable. Failed sitemap segments remain retryable and do not corrupt existing published sitemap snapshots. Last-known-good public sitemap output remains served until replacement passes validation.

## Observability

Metrics include resolver latency, metadata validation failures, sitemap generation duration, sitemap lag, cache hit rate, canonical conflicts and structured-data rejection rate. OTel traces identify resource/revision/policy versions without logging private content.

## Testing

Required suites:

- metadata precedence;
- title/description normalization;
- canonical URL normalization;
- locale/hreflang determinism;
- robots policy;
- JSON-LD schema validation;
- unsafe input rejection;
- React SSR/CSR parity;
- sitemap eligibility and segmentation;
- robots.txt generation;
- tenant/domain isolation;
- publication/revision cache invalidation;
- real browser HTML inspection;
- end-to-end NestJS → HTTP → React rendering tests.

## Versioning

SEO documents and policy definitions carry explicit schema versions. Breaking changes require migration/conformance fixtures. Search-engine-sensitive behavior must remain deterministic for a published revision.

## Exit criteria

- One typed SEO contract works from NestJS/domain data to React HTML.
- Canonical, robots, hreflang, Open Graph, Twitter and JSON-LD are covered.
- Sitemap and robots output are generated from the same eligibility policy.
- Page Builder SEO fields are structured and safe.
- Public caching and invalidation are revision-aware.
- No SEO feature requires a new microservice or Worker.
