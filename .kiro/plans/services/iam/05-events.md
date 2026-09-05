# IAM Service — Events Contract

Stream: `FIGENTRA_IAM`. All messages use the canonical envelope with event ID, type/version, aggregate, tenant, correlation/causation, timestamp and schema version.

Published:
- `figentra.iam.role.created.v1`
- `figentra.iam.role.updated.v1`
- `figentra.iam.role.deleted.v1`
- `figentra.iam.grant.created.v1`
- `figentra.iam.grant.revoked.v1`
- `figentra.iam.policy.created.v1`
- `figentra.iam.policy.updated.v1`
- `figentra.iam.policy.published.v1`
- `figentra.iam.policy.disabled.v1`
- `figentra.iam.permission.catalog.updated.v1`

Every administrative mutation writes its event to the transactional outbox. Publisher retries transient NATS errors with bounded exponential backoff; poison messages enter DLQ.

Consumers invalidate decision caches on role/grant/policy changes and process relevant Tenant resource/lifecycle changes. Consumption is at-least-once and deduplicated by event ID. No consumer writes another service's database.

Events never contain credentials, tokens or executable policy. Policy conditions are serialized as validated data. Schema changes are additive within a version or require a new version. Replay is operator-controlled and remains subject to current authorization/security rules.