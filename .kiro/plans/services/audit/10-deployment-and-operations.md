# Audit Service — Deployment & Operations

One NestJS source tree with `api`, `consumer`, `worker`, `scheduler`. Immutable images and isolated environments.

Configuration covers PostgreSQL, NATS, archive/object storage, encryption keys/references, export limits, retention defaults, OTel, rate limits and service authentication. Secrets are externalized.

Rollout: expand schema → compatible consumer/worker → API → scheduler. Verify append/query, ingestion, hash verification, export and legal-hold smoke tests.

Scaling: query API by latency; consumers by stream lag; workers by ingestion/export/retention backlog. Bound export concurrency and DB pools.

Rollback preserves append-only evidence and schema compatibility. Never perform ad-hoc historical rewrites. Cache/derived state is rebuilt from authoritative audit data.

Runbooks: hash mismatch, ingestion backlog, DLQ, export outage/leak, DB saturation, archive failure, retention backlog and suspected unauthorized access. Legal hold always wins over deletion.

Health/readiness expose no audit payloads or secrets. Recovery requires tested PostgreSQL PITR/restore and archive restore, NATS replay and chain verification.

Production gate: all test classes green, migration/recovery verified, security review complete, observability live, rollback tested and integrity check passes.