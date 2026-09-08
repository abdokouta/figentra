# Search — Events

Consumes versioned domain events such as `CustomerCreated/Updated/Deleted`, `OrderCreated/Updated/Deleted`, `ProductChanged`, `ProjectChanged`, and equivalent registered-resource events. Events carry resource identity, tenant, version, occurredAt, eventId and enough projection data or a safe projection reference.

Writes are idempotent using eventId/source version. Deletes create/remove projection documents according to index policy. Event ordering is respected per entity where available; stale versions are ignored.