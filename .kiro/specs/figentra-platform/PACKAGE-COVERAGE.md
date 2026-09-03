---
authored_by: kiro
authored_at: 2026-09-03
status: normative
---
# Package Coverage Matrix

This is the normative coverage index for the requested package inventory. A name marked **subpath** is intentionally not a separate package under the package-boundary law.

| Requested | Canonical plan/location | Type |
|---|---|---|
| search | `@stackra/search` | capability package |
| seo | `@stackra/seo` | capability package |
| sdui | `@stackra/sdui` | capability package |
| scope | `@stackra/scope` | capability package |
| cache | `@stackra/cache` | base package |
| config | `@stackra/config` | base package |
| console | `@stackra/console` | tooling package |
| container | `@stackra/container` | base package |
| contracts | `@stackra/contracts` | base package |
| events | `@stackra/events` | base package |
| http | `@stackra/http` | base package |
| i18n | `@stackra/i18n` | UI package |
| logger | `@stackra/logger` | base package |
| media | `@stackra/media` | capability package |
| network | `@stackra/http/network` | subpath |
| pagination | `@stackra/pagination` | base package |
| pipeline | `@stackra/pipeline` | base package |
| tracking | `@stackra/tracking` | capability package |
| theming | `@stackra/theming` | UI package |
| testing | `@stackra/testing` | tooling package |
| sync | `@stackra/sync` | capability package |
| redis | `@stackra/cache/redis` | subpath |
| realtime | `@stackra/realtime` | base package |
| queue | `@stackra/queue` | capability package |
| pwa | `@stackra/pwa` | capability package |
| page-builder | `@stackra/page-builder` | capability package |
| kbd | `@stackra/kbd` | capability package |
| desktop | `@stackra/desktop` | runtime foundation |
| ai | `@stackra/ai` | capability package |
| collaboration | `@stackra/collaboration` | capability package |
| consent | `@stackra/consent` | capability package |
| coordinator | `@stackra/coordinator` | base package |
| cookie | `@stackra/http/cookie` | subpath |
| csp | `@stackra/security/csp` | subpath |
| router | `@stackra/router` | UI package |
| scheduler | `@stackra/scheduler` | capability package |
| session | `@stackra/identity/session` | subpath |
| email | `@stackra/notifications/email` | provider subpath |
| encryption | `@stackra/security/encryption` | subpath |
| health | `@stackra/health` | base package |
| hashing | `@stackra/security/hashing` | subpath |
| link | `@stackra/link` | base package |
| orm | `@stackra/orm` | base package |
| rate-limit | `@stackra/http/rate-limit` | subpath |
| response | `@stackra/http/response` | subpath |
| settings | `@stackra/config/settings` | subpath |
| slack | `@stackra/notifications/slack` | provider subpath |
| storage | `@stackra/storage` | base package |
| swagger | `@stackra/openapi/swagger` | subpath |
| tracing | `@stackra/observability/tracing` | subpath |
| versioning | `@stackra/contracts/versioning` | subpath |
| webhook | `@stackra/webhook` | capability package |
| indexer | `@stackra/search/indexer` | subpath |
| pubsub | `@stackra/nats/pubsub` | subpath |

## Required implementation artifacts

Each package has a canonical implementation plan under `.kiro/plans/packages`, a package source contract in `.kiro/plans/2026-09-03-package-source-contract-matrix.md`, and participates in `.kiro/plans/2026-09-03-enterprise-day-one-plan-standard.md`. Service-owned capabilities additionally follow `.kiro/plans/2026-09-03-service-implementation-contract.md`.

## Cross-runtime expectations

Frontend-capable packages define React integration when UI-facing, React Native integration when mobile-facing, and typed HTTP/OpenAPI adapters where the backend is authoritative. Backend integration is provided by NestJS subpaths rather than parallel service packages. Provider SDKs are isolated behind provider subpaths.

## Tenancy expectation
All HTTP/query/cache/storage operations carry platform RequestContext where relevant. Client switchers use `@stackra/scope`; identity/session provide principal context; Tenant service owns authoritative tenant state; IAM owns authorization. Packages never treat tenant IDs as proof of permission.
