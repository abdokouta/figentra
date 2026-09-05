# Tenant Service — Jobs & Scheduling

`VerifyDomain` processes DNS/HTTP challenge verification in bounded attempts and updates authoritative status transactionally.

`ExpireDomainChallenges` expires unused challenges every five minutes.

`ReconcileMembershipContext` validates required local membership projections against canonical Identity/Tenant state in bounded pages.

`ArchiveTenantCleanup` performs only policy-authorized cleanup after archival and retention gates.

`TenantContextCacheRebuild` rebuilds derived tenant-context cache entries from PostgreSQL.

Schedules: verification processing continuously through queue consumers; challenge expiry every five minutes; membership reconciliation hourly; cache reconciliation every fifteen minutes; archival cleanup daily.

Every scheduled occurrence has deterministic occurrence ID and distributed lease. Jobs have strict schemas, timeout, bounded retry/backoff, idempotency, checkpoints and DLQ. External verification is not marked successful before evidence is validated. Cleanup never deletes data before retention policy allows it.

Metrics: backlog, oldest item, attempts, duration, verification success/failure, reconciliation lag, cleanup volume and DLQ depth.