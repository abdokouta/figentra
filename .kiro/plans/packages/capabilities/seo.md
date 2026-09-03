---
authored_by: kiro
authored_at: 2026-09-03
status: canonical
package: '@stackra/seo'
---
# `@stackra/seo` — Full-stack SEO capability

## Ownership
A reusable contract and runtime toolkit from backend/domain/page metadata to rendered web metadata and crawl artifacts. Domain/page services own the underlying content and publication truth; SEO owns normalization, precedence, validation and generation. There is no SEO microservice.

## Public exports
```text
@stackra/seo
@stackra/seo/schema
@stackra/seo/react
@stackra/seo/native
@stackra/seo/nestjs
@stackra/seo/sitemap
@stackra/seo/robots
@stackra/seo/json-ld
@stackra/seo/http
@stackra/seo/testing
```

## Exact source tree
```text
packages/capabilities/seo/
├── package.json
├── README.md
├── src/
│   ├── core/{seo-document,resolver,precedence,policy,url-normalizer,validation,errors,index.ts}
│   ├── schema/{versions,migrations,json-schema,index.ts}
│   ├── react/{SeoProvider,SeoHead,metadata,links,json-ld,ssr,index.tsx}
│   ├── native/{SeoMetadata,useSeo,index.ts}
│   ├── nestjs/{seo.module,controllers,resolver-registry,dto,ports,guards,index.ts}
│   ├── sitemap/{eligibility,builder,segmenter,checkpoint,index.ts}
│   ├── robots/{policy,builder,environment-gate,index.ts}
│   ├── json-ld/{builders,validators,serializer,index.ts}
│   ├── http/{client,cache,index.ts}
│   └── testing/{fixtures,assertions,ssr,index.ts}
└── tests/{unit,integration,conformance,security,e2e,load}/
```

## Canonical model
```ts
interface SeoDocument {
  schemaVersion: string;
  sourceRevision: string;
  resourceType: string;
  resourceId: string;
  url: string;
  indexable: boolean;
  title: string;
  description?: string;
  canonicalUrl: string;
  robots: RobotsDirectives;
  alternates: readonly SeoAlternate[];
  openGraph?: OpenGraphMetadata;
  twitter?: TwitterMetadata;
  structuredData: readonly JsonLdDocument[];
  images: readonly SeoImage[];
  breadcrumbs: readonly BreadcrumbItem[];
  resourceHints: readonly ResourceHint[];
}
```

## Resolution
```text
platform defaults
 → tenant/application/site defaults
 → locale defaults
 → template defaults
 → published page/resource overrides
 → generated derived data
 → validation
 → immutable SeoDocument
```

Each layer is explicit. A lower-priority source can never silently override a higher-priority source. Conflicting canonical URLs are blocking errors.

## React
Exports `SeoProvider`, `SeoHead`, `useSeo`, `useResolvedSeo`, `createMetaTags`, `createLinkTags`, `JsonLd`, `OpenGraph`, `TwitterCard`, `CanonicalLink`, `HreflangLinks`, `RobotsMeta`, and SSR serializers. SSR and hydration consume the same normalized document; canonical/robots changes after hydration are prohibited unless explicitly configured as runtime state.

## NestJS
`@stackra/seo/nestjs` exports `SeoModule`, `SeoResolverRegistry`, `SeoControllerFactory`, `SeoMetadataDto`, `SitemapControllerFactory`, `RobotsControllerFactory`, `SeoSourceChangedHandler`, `SeoCachePort`, `SeoSourcePort`, and policy guards. Example endpoints:
```text
GET /v1/seo/:resource/:id
GET /sitemap.xml
GET /sitemaps/:segment.xml
GET /robots.txt
```
Private metadata routes remain protected by the host service. Public crawl artifacts are served only from validated public projections.

## Page Builder
Structured fields: title, description, canonical, robots, OG image, social title/description, JSON-LD blocks, locale/alternate references. No arbitrary head HTML, scripts or unsafe URL schemes.

## JSON-LD
Typed builders for `WebSite`, `WebPage`, `Organization`, `Product`, `Offer`, `Article`, `BreadcrumbList`, `Event`, `ItemList`, `FAQPage` and `LocalBusiness`. Raw JSON-LD extensions must pass a schema/allowlist validator and safe serializer.

## Sitemaps and robots
Public URLs are eligible only when all are true: published, public, canonical, indexable, valid hostname and allowed by SEO policy. Large sitemaps are segmented/checkpointed. Failed replacements do not replace the last-known-good snapshot. Non-production environments have an environment gate that defaults to non-indexable.

## Redirects
Redirect rules are normalized by `@stackra/seo` and may be consumed by Gateway, but domain ownership of aliases/redirect intent remains with the host application. Loop and chain limits are enforced.

## Caching/invalidation
Published output is keyed by tenant/application/domain/locale/resource/sourceRevision/policyVersion. `SeoSourceChanged` invalidates affected metadata and sitemap segments. Public immutable output may use ETag/CDN caching. Personalized/private output is always private.

## Security/privacy
Absolute URLs require configured origin allowlists. Reject CRLF injection, unsafe schemes, secret-bearing metadata, private resources in public sitemap, arbitrary executable script, cross-tenant references and unapproved structured-data fields.

## Failure semantics
Sitemap jobs are durable/resumable. A generation failure keeps the previous valid artifact active. HTML metadata resolution fails closed for indexability changes: an unknown safety state must not accidentally turn a private page public/indexable.

## Testing
Precedence, canonical normalization, hreflang matrix, JSON-LD validation, robots environment gate, sitemap eligibility/segmentation/checksum, redirect-loop detection, tenant isolation, publication invalidation, SSR/hydration parity and browser HTML E2E are mandatory.

## Completion criteria
A published resource can deterministically produce one SEO document and HTML head; sitemap/robots use the same eligibility authority; revisions invalidate only affected output; private resources never enter public artifacts; all integrations have conformance fixtures.
