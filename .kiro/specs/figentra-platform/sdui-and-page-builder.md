# Figentra Platform — SDUI and Visual Page Builder Specification

**Status:** Normative
**Related ADR:** ADR-0012 — Controlled SDUI and Visual Page Builder

## 1. Objective

Provide a production-grade visual page authoring capability whose persisted output is a controlled, versioned SDUI document. The system must support landing pages, commerce pages, templates and reusable sections without persisting arbitrary executable UI code.

## 2. Runtime topology

```text
Admin / Builder React application
        |
        | HTTPS/OpenAPI
        v
Owning NestJS service
        |
        +--> page/template/revision persistence
        +--> domain data authorization
        +--> binding resolution
        +--> publish/rollback
        |
        v
@stackra/sdui runtime
        |
        v
React component renderers
```

For applications with native clients, `@stackra/sdui/react-native` consumes the same versioned document contract where the UX is appropriate.

There is no SDUI Worker in the default architecture.

## 3. Ownership

### Application Registry

Owns metadata and capability projections only. Registry may store component capability metadata, routes and application manifest projections. It does not own page revisions or business content.

### Gateway

Routes/authorizes edge traffic according to existing gateway rules. It does not compose page documents.

### Owning NestJS service

Owns page/template entities, tenant scope, revision persistence, publication state, binding authorization, asset references, conflict handling and APIs.

### `@stackra/sdui`

Owns the versioned schema, validators, renderer contracts, binding/action contracts and runtime safety constraints.

### `@stackra/page-builder`

Owns visual authoring behavior and editor state.

## 4. Domain model

Recommended minimum service-owned entities:

```text
Page
PageRevision
PagePublication
Template
TemplateRevision
ReusableSection
ComponentDefinitionProjection (optional derived metadata)
```

A `PageRevision` stores one immutable SDUI document plus schema/component compatibility metadata. Draft edits create a new mutable draft version until persisted as an immutable revision.

## 5. Publish contract

```text
POST /pages/:id/revisions
PUT  /pages/:id/draft
POST /pages/:id/validate
POST /pages/:id/preview
POST /pages/:id/publish
POST /pages/:id/rollback
GET  /pages/:id
GET  /pages/:id/revisions/:revision
```

Exact route naming is owned by the service API contract; the semantics are mandatory.

Publish transaction:

```text
load draft
 -> authorize tenant/principal
 -> validate schema
 -> validate components
 -> validate bindings
 -> validate assets/locales
 -> validate policies
 -> persist immutable revision
 -> atomically advance published pointer
 -> emit publication event/outbox
```

Publication must not mutate historical revisions.

## 6. Draft concurrency

Draft writes carry an expected revision/version. The server rejects stale writes with a typed conflict response. The builder reloads/reconciles explicitly; silent last-write-wins is forbidden.

## 7. Render contract

Published page reads return:

```text
page identity
revision identity
schema version
document metadata
validated SDUI document
cacheability metadata
```

Binding resolution is authorized for the current principal and tenant. Public immutable pages may be CDN cached; personalized pages must not leak one user's resolved data to another.

## 8. Component registration

Application components are registered with stable type/version contracts and renderer capabilities. The page document stores only the stable component reference and props/bindings.

Component implementations remain in the application/package that owns them.

## 9. Templates

Templates define structure and contextual bindings. A concrete page may supply page-specific configuration without duplicating the template implementation.

Template changes do not silently mutate already-published pages unless the service explicitly supports a versioned inheritance policy. V1 should prefer immutable template revisions referenced by page revisions.

## 10. Assets

Pages reference asset IDs. Binary uploads flow through the canonical Files/Media capabilities. The page service checks that asset references belong to or are accessible to the current tenant and published context.

## 11. Actions

Actions must resolve through a finite capability registry. A document can request a typed action; the host application dispatches it after authorization.

No document may embed arbitrary callback code.

## 12. Security model

The system must enforce:

- tenant isolation;
- component allow-lists;
- binding source allow-lists;
- action capability checks;
- safe URL protocols;
- sanitized rich text;
- constrained styling tokens;
- output size/depth limits;
- protection against recursive or cyclic document structures;
- protection against binding fan-out and N+1 amplification;
- auditability for publish/rollback operations as required by the owning service.

## 13. Performance

Documents are immutable after publication, enabling content-addressed/ETag caching. Runtime resolves bindings with bounded concurrency and request budgets.

A document size and node-count ceiling must be enforced by schema validation. Limits are configurable per environment and tenant plan where appropriate.

## 14. Observability

Required telemetry:

- page validation failures;
- render latency;
- binding resolution latency;
- renderer lookup failures;
- action dispatch failures;
- publication duration and failure reason;
- cache hit/miss where applicable;
- document size/node count distributions.

Do not log sensitive bound values, tokens or private content.

## 15. Failure semantics

- Invalid documents are rejected before publication.
- Unknown component versions fail closed with a typed compatibility error.
- Missing non-critical optional data may use component-defined fallbacks.
- Missing required bindings fail the render or use an explicit fallback; silent empty data is not allowed where business semantics require a value.
- Publication failure leaves the previous published revision active.
- Renderer failure must not mutate persisted documents.

## 16. Migration

Every breaking schema change requires:

1. version declaration;
2. migration implementation;
3. fixtures before/after migration;
4. backward compatibility decision;
5. renderer compatibility matrix;
6. operational rollback strategy.

Published revisions must remain reproducible.

## 17. Testing gate

CI must cover:

- complete schema fixture suite;
- document validation fuzz/property tests within controlled bounds;
- component compatibility;
- binding authorization;
- tenant isolation;
- publish atomicity;
- stale revision conflicts;
- rollback;
- cache correctness;
- editor/renderer parity;
- security rejection corpus;
- API contract tests.

## 18. Explicit non-requirements

No dedicated SDUI microservice.

No SDUI Cloudflare Worker.

No page database inside `@stackra/sdui`.

No Registry ownership of page content.

No arbitrary code transmission.
