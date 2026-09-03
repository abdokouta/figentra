# Capability Package Plans

Capability packages exist only when a capability is genuinely reusable across multiple bounded contexts or runtimes. A business/domain capability is not a package merely because it is important to the platform.

## Canonical reusable capabilities

- `identity` — authentication/identity orchestration SDK; authorization remains IAM-owned.
- `scope` — active tenant/workspace/resource context, switchers, hooks and context propagation; Tenant service remains authoritative.
- `tracking` — behavioral event collection SDK.
- `workflow` — reusable workflow definition/execution client; durable orchestration remains Workflow service-owned.
- `sync` — reusable synchronization primitives.
- `queue` — cross-runtime queue abstraction and provider adapters.
- `scheduler` — schedule definition, timezone/occurrence/lease primitives.
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
- `pwa` — web install/update/offline-shell/service-worker capability; business offline state remains Sync-owned.
- `kbd` — cross-platform keyboard shortcut and command-surface capability.
- `ai` — provider-neutral model/embedding/tool/RAG execution contracts.
- `collaboration` — realtime presence and deterministic collaborative-operation contracts.
- `consent` — consent state and enforcement contracts for tracking/cookies/analytics/marketing.
- `webhook` — signing, verification, idempotency and delivery primitives; Integrations owns subscriptions/connections.

## Ownership

- Domain implementations live in `services/<service>/src/modules`.
- Asynchronous execution normally lives in a worker role of the owning NestJS service, using the same source tree.
- Cross-service consumers import versioned DTOs, schemas, commands, queries, events, errors and public interfaces from `@stackra/contracts`.
- `@stackra/identity` authenticates; `Tenant` owns tenancy; `@stackra/scope` manages active client context; IAM authorizes.
- `@stackra/search` keeps provider SDKs behind backend-only subpaths; browser/mobile use typed HTTP clients.
- `@stackra/reporting` keeps query definitions provider-neutral and never exposes raw SQL to clients.
- `@stackra/dashboard` owns presentation/document contracts but persistence authority stays with the host service through `/nestjs`.
- `@stackra/seo` does not own products/pages/content; it normalizes and renders SEO metadata for resources owned elsewhere.
- `@stackra/sdui` does not own pages, templates, publishing or business data.
- `@stackra/page-builder` does not own a database or publication authority; the owning NestJS service does.
- `@stackra/pwa` owns web shell/runtime lifecycle, not business synchronization.
- `@stackra/collaboration` owns collaboration transport/presence primitives, not document truth.
- `@stackra/consent` owns decision contracts, not legal policy ownership or analytics.
- `@stackra/webhook` owns cryptographic/transport primitives; Integrations owns business subscriptions.

## Subpath-only concerns
These requested names are deliberately not separate package roots: `redis`, `network`, `response`, `rate-limit`, `cookie`, `session`, `email`, `slack`, `encryption`, `hashing`, `csp`, `tracing`, `swagger`, `versioning`, `indexer`, `pubsub`. Their canonical paths are defined in `.kiro/plans/2026-09-03-package-catalog-and-boundaries.md`.

## SDUI/page-builder boundary
```text
Page Builder → typed document → SDUI validation → host draft/publish persistence → SDUI renderer
```
The builder edits the document model, never a serialized DOM tree. Arbitrary JavaScript, SQL, executable component code and unrestricted network calls are prohibited in documents.

## Reuse gate
A new capability must have independent API/lifecycle/dependency value or a real cross-runtime contract. Every plan must cover public API, exact source tree, subpath exports, configuration, DI/lifecycle, security/tenancy, failure semantics, observability, tests and production exit criteria.
