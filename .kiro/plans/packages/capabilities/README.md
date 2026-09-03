# Capability Package Plans

Capability packages exist only when a capability is genuinely reusable across multiple bounded contexts or runtimes. A business/domain capability is **not** a package merely because it is important to the platform.

## Canonical reusable capabilities

- `identity` — authentication/identity orchestration SDK; authorization remains IAM-owned.
- `tracking` — behavioral event collection SDK.
- `workflow` — reusable workflow definition/execution client; durable orchestration remains Workflow service-owned.
- `sync` — reusable synchronization primitives.
- `queue` — cross-runtime queue abstraction and provider adapters.
- `query` — server-state query/mutation client.
- `state` — local reactive state primitives.
- `media` — reusable secure media ingestion/processing contracts.
- `search` — provider-neutral indexed-search abstraction with frontend/mobile HTTP clients and backend provider adapters.
- `reporting` — typed report-definition/query/export client and builder contracts; Reporting service owns definitions and execution.
- `dashboard` — cross-runtime dashboard/widget/layout capability with NestJS persistence integration.
- `audit` — reusable audit submission/client contract; Audit service owns durable records.
- `sdui` — controlled schema-driven UI document, validation, binding and renderer contracts.
- `page-builder` — visual page authoring engine built on `@stackra/sdui`.
- `seo` — end-to-end SEO metadata, canonical/robots/hreflang, JSON-LD, sitemap and React/Nest integration.

## Ownership

- Domain implementations live in `services/<service>/src/modules`.
- Asynchronous execution normally lives in a worker role of the owning NestJS service, using the same source tree.
- Cross-service consumers import versioned DTOs, schemas, commands, queries, events, errors and public interfaces from `@stackra/contracts`.
- Service implementation packages such as Notifications, Analytics, Marketing and Audit are not created merely to share domain code.
- `@stackra/identity` is retained where its reusable authentication/identity SDK boundary is required.
- `@stackra/tracking` is retained where browser/mobile/desktop behavioral collection is genuinely reusable.
- `@stackra/search` keeps provider SDKs behind backend-only subpaths; browser/mobile use typed HTTP clients.
- `@stackra/reporting` keeps query definitions provider-neutral and never exposes raw SQL to clients.
- `@stackra/dashboard` owns presentation/document contracts but persistence authority stays with the host service through `/nestjs`.
- `@stackra/seo` does not own products/pages/content; it normalizes and renders SEO metadata for resources owned elsewhere.
- `@stackra/sdui` does not own pages, templates, publishing or business data.
- `@stackra/page-builder` does not own a database or publication authority; the owning NestJS service does.

## SDUI/page-builder boundary

```text
Page Builder
  -> typed page document
  -> @stackra/sdui schema/validation
  -> owning service draft/publish persistence
  -> production @stackra/sdui renderer
```

The builder edits the document model, never a serialized DOM tree. Arbitrary JavaScript, SQL, executable component code and unrestricted network calls are prohibited in documents.

## Runtime placement

Technical infrastructure belongs in `packages/base`; runtime foundations belong in `packages/runtime`; feature-specific framework integrations belong beneath the owning capability package. Domain-specific persistence/business behavior belongs in a service.

Application Registry remains an independent Cloudflare Worker + Hono control-plane runtime and is not replaced by or extended into an SDUI service. It may expose capability metadata/projections used by applications and builders.

## Reuse gate

A new capability package must demonstrate at least two real consumers or a clear cross-runtime contract and must have one canonical implementation plan covering API, source tree, adapters/providers, configuration, security, failure semantics, observability and tests.
