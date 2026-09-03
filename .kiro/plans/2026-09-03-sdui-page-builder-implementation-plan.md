# Figentra — SDUI + Visual Page Builder Implementation Plan

**Status:** Normative / implementation locked
**Decision:** Controlled SDUI + visual page builder
**ADR:** `.docs/adr/ADR-0012-controlled-sdui-and-page-builder.md`

## Goal

Deliver a Shopify/WordPress-class visual page builder without creating a new microservice or Worker. The implementation must use one typed document model from editor through publication and runtime rendering.

## Required workstreams

### 1. `@stackra/sdui`

Implement the canonical runtime contract:

```text
packages/sdui/src/core
packages/sdui/src/schema
packages/sdui/src/react
packages/sdui/src/react-native
packages/sdui/src/nestjs
packages/sdui/src/testing
```

Required areas:

- document/node types;
- schema versioning;
- JSON Schema generation/validation;
- component registry/definition contracts;
- binding contracts;
- action contracts;
- responsive layout model;
- renderer registry;
- safety limits;
- compatibility/migration framework;
- React and React Native renderers;
- NestJS DTO/API helpers;
- conformance fixtures.

### 2. `@stackra/page-builder`

Implement:

```text
packages/page-builder/src/schema
packages/page-builder/src/editor
packages/page-builder/src/react
packages/page-builder/src/blocks
packages/page-builder/src/registry
packages/page-builder/src/testing
```

Required areas:

- editor state;
- stable node selection;
- command model;
- undo/redo;
- drag/drop;
- insertion legality;
- responsive editing;
- inspector model;
- binding picker;
- component palette;
- template/section authoring;
- preview;
- publish intent integration;
- editor/renderer parity.

### 3. Owning NestJS service integration

The service owning pages/templates must implement:

- Page;
- PageRevision;
- PagePublication;
- Template;
- TemplateRevision;
- optional ReusableSection;
- draft persistence;
- immutable revision persistence;
- optimistic concurrency;
- validation endpoint;
- preview endpoint;
- publish/rollback transactions;
- tenant and principal isolation;
- binding resolution;
- asset authorization;
- cache metadata;
- publication outbox event.

No page data is persisted in `@stackra/sdui` or `@stackra/page-builder`.

### 4. Application component contracts

Every application component exposed to the builder must declare:

```text
stable type
version
category
props schema
defaults
child constraints
bindings
actions
responsive capabilities
accessibility requirements
renderer capabilities
compatibility requirements
```

The metadata is suitable for application-owned manifest compilation and Registry projection. The Registry stores sanitized metadata only.

### 5. Manifest compilation

Application builds may compile component/route/action/capability metadata into a versioned application manifest. Compilation can use the application's NestJS DiscoveryService/decorators where useful, but this runs in the application build/runtime source tree and does not change Registry runtime.

```text
application metadata/decorators
  -> compiler
  -> schema validation
  -> normalized manifest
  -> publication
  -> Registry D1 projection
```

Registry never imports application implementations and never executes the manifest.

### 6. Registry runtime lock

The Application Registry remains:

```text
Cloudflare Worker + Hono
D1 authoritative
KV optional/disposable cache
```

It is not converted into NestJS. It does not become an SDUI server or page store.

### 7. API contracts

Canonical semantics:

```http
GET  /pages/:id
GET  /pages/:id/revisions/:revision
PUT  /pages/:id/draft
POST /pages/:id/validate
POST /pages/:id/preview
POST /pages/:id/publish
POST /pages/:id/rollback
```

OpenAPI schemas and cross-service errors live in `@stackra/contracts` where shared contracts are required.

### 8. Security

Implement and test:

- tenant isolation;
- principal propagation;
- component allow-lists;
- binding allow-lists;
- action capability checks;
- URL scheme validation;
- rich-text sanitization;
- style-token constraints;
- document depth/size limits;
- render/request budgets;
- safe cache keys;
- no code/secret/SQL persistence.

### 9. Publishing

Publishing is transactional and immutable:

```text
load draft
 -> authorize
 -> validate document
 -> validate components
 -> validate bindings
 -> validate assets/locales
 -> create immutable revision
 -> advance published pointer atomically
 -> outbox event
```

A failure leaves the previous published revision active.

### 10. Caching

Use ETag/revision-based cache validation. Public immutable pages may be edge/CDN cached. Personalized or authorization-sensitive render results must be keyed by the relevant security context or not cached.

### 11. Observability

Instrument validation, rendering, binding resolution, publication and editor API interactions without logging sensitive bound values or secrets.

Use the existing Logger/Observability/Tracking/Audit ownership boundaries. Page views are behavioral Tracking/Analytics signals, not Audit records.

### 12. Testing

Mandatory layers:

- schema fixtures;
- unit tests;
- property/invariant tests;
- package conformance tests;
- renderer compatibility tests;
- API contract tests;
- persistence/transaction tests;
- security tests;
- tenant isolation tests;
- publish/rollback tests;
- browser E2E editor tests;
- responsive layout tests;
- editor/runtime parity tests;
- failure/retry/conflict tests.

## Delivery order

1. Lock ADR and architecture.
2. Implement `@stackra/sdui` core/schema/testing.
3. Implement initial component vocabulary and React renderer.
4. Implement page-builder document/editor/commands.
5. Implement page service persistence and APIs.
6. Integrate assets/media and bindings.
7. Implement templates/reusable sections.
8. Implement publish/rollback/cache.
9. Add Registry component metadata projection/manifest compiler integration.
10. Add React Native renderer where product requirements justify it.
11. Run security, contract and E2E gates.
12. Production rollout with rollback/runbooks.

## Explicit non-work

Do not create:

- SDUI Worker;
- Page Builder Worker;
- SDUI microservice;
- Page Builder microservice solely for architectural symmetry;
- DOM/React-tree persistence;
- arbitrary JS/CSS execution;
- registry-owned page database;
- application startup dependency on Registry publication.

## Exit criteria

The feature is implementation-complete only when:

- a merchant can create a page from approved components;
- pages survive reloads as typed documents;
- the same renderer drives preview and production;
- responsive layout is preserved without absolute DOM coordinates;
- bindings resolve through authorized host-service contracts;
- drafts are revisioned and conflict-safe;
- publication is atomic and rollback-safe;
- Registry only stores sanitized metadata projections;
- no dedicated Worker/service was introduced for SDUI/page builder;
- conformance/security/tenant isolation/E2E tests pass in CI;
- schema/version migrations and operational runbooks exist.
