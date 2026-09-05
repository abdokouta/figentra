# Identity Service — Testing Contract

## Unit
Test Principal/Identity/Session/Delegation invariants, provider-result normalization, token-claim validation, session state transitions, replay handling, idempotency and error mapping.

## Integration
Run PostgreSQL migrations and transactions; provider adapter tests with deterministic fixtures; NATS outbox publication/consumption; webhook verification/deduplication; cache/session invalidation; secret-manager reference behavior.

## Contract
Verify OpenAPI schemas, error codes, PrincipalContext shape, event envelope/version compatibility and IdentityProvider port compatibility. Provider-specific objects must never appear in contracts.

## Security
Test forged tokens, wrong issuer/audience, invalid signature, algorithm confusion, expired/not-yet-valid tokens, clock skew, replay, webhook forgery/replay, identity-link takeover, delegation escalation, tenant confusion, secret leakage, rate-limit bypass and authorization bypass.

## E2E
Sign-up/sign-in → session → `/me`; refresh rotation; logout; global logout; identity link/unlink; provider webhook; service identity creation/rotation/revocation; delegation create/revoke; disabled principal rejection.

## Reliability
Simulate provider timeout, provider 5xx, NATS outage, duplicate events, DB deadlock/timeout, cache outage, worker crash, scheduler duplication and DLQ recovery. Assert fail-closed behavior.

## Load
Measure authentication and verification throughput, concurrent refresh, webhook bursts and reconciliation at production target concurrency. Verify p95/p99 and database/provider saturation thresholds.

## Migration
Every migration has upgrade, rollback/recovery and rolling-deployment compatibility tests. No release is accepted if old and new application versions cannot safely coexist during deployment.