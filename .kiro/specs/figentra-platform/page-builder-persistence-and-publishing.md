# Figentra — Page Builder Persistence and Publishing Contract

**Status:** Normative
**Owner:** Owning NestJS service

## Purpose

Define the service-side persistence contract for visual pages/templates. Packages provide the document/editor capability; the owning service owns authoritative state and publication.

## Entities

### Page

```text
id
application_id
tenant_id
slug
type
draft_revision_id
published_revision_id
status
created_at
updated_at
```

### PageRevision

```text
id
page_id
revision_number
schema_version
component_manifest_version
document_json
document_hash
created_by
created_at
```

Published revisions are immutable. `document_hash` identifies the exact persisted document payload.

### Template / TemplateRevision

Equivalent revision semantics. A published page references a concrete compatible template revision or contains the fully materialized immutable structure according to the owning service's chosen inheritance mode. Silent mutation of a published page through later template edits is prohibited.

## Draft writes

Draft mutation requires an expected revision/version. Stale writes fail with a typed conflict. The client must explicitly reload/reconcile.

## Validation

Validation occurs before persistence of a publishable revision and includes:

- SDUI schema;
- component definition/version compatibility;
- child constraints;
- bindings;
- actions/capabilities;
- asset ownership/access;
- localization requirements;
- document size/depth limits;
- tenant/security rules.

## Publish transaction

```text
BEGIN
  authorize
  validate
  persist immutable PageRevision
  advance Page.published_revision_id
  persist publication metadata
  enqueue outbox event
COMMIT
```

The previous published revision remains valid until commit succeeds.

## Rollback

Rollback selects an existing immutable revision and advances the published pointer. The historical revision is never modified.

## API semantics

```http
PUT  /pages/:id/draft
POST /pages/:id/validate
POST /pages/:id/preview
POST /pages/:id/publish
POST /pages/:id/rollback
GET  /pages/:id
GET  /pages/:id/revisions/:revision
```

The exact route names remain subject to the owning service's OpenAPI contract, but these semantics must exist.

## Events

Publication and rollback produce versioned business events through the transactional outbox. Consumers must not infer publication from database polling.

## Caching

Published pages expose revision/hash information for ETag/version-based caching. Public immutable pages can be CDN cached. Private/personalized resolution must honor tenant/principal isolation.

## Audit

Publish and rollback can emit durable audit records through the Audit service boundary. Operational logs/telemetry are not the source of accountability.

## Recovery

Any failure before publication commit leaves the existing published revision active. Outbox delivery is retried independently. Replaying a publication event is idempotent.

## Tests

Required:

- optimistic concurrency;
- validation rejection;
- atomic publish;
- rollback;
- duplicate publish idempotency;
- outbox atomicity;
- tenant isolation;
- asset authorization;
- cache correctness;
- schema/version compatibility;
- database migration/recovery tests.
