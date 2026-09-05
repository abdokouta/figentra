# Registry — Deployment and Operations

Wrangler owns Worker/D1/KV deployment. Environments are isolated: development, staging, production each have separate bindings, domains and credentials. Secrets are Worker secrets/bindings only.

## Deployment order

1. Validate manifest/schema and tests. 2. Apply backward-compatible D1 migrations. 3. Deploy Worker. 4. Verify health/readiness and D1 connectivity. 5. Publish/read smoke test. 6. Verify Gateway discovery. 7. Promote environment.

## Rollback

Worker rollback uses immutable deployment version. D1 migrations use expand/contract compatibility; irreversible migrations require a forward recovery procedure. KV can be purged and rebuilt from D1.

## Operations

Runbooks: D1 outage, KV outage, publication conflict spike, corrupt projection, cache rebuild, failed deployment, manifest compromise, credential rotation, domain/route takeover, restore and reconciliation.

## Backup/DR

D1 backup/export schedule, restore verification, documented RPO/RTO, cross-environment isolation, recovery smoke tests and access-controlled restore operations. No production secret is copied into lower environments.

## Health

Liveness confirms Worker execution. Readiness confirms required configuration and D1 schema availability. KV is non-authoritative and therefore does not block readiness unless a deployment-specific contract explicitly requires it.