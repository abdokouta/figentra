# IAM Service — Testing Contract

Unit-test the evaluator, scope matcher, policy AST, deny precedence, expiry, grants, versioning and cache key construction.

Integration-test PostgreSQL transactions, concurrent mutations, outbox, NATS consumers, cache invalidation and Tenant/Identity contract compatibility.

Contract-test OpenAPI DTOs, authorization request/decision schema, event versions and `@stackra/contracts` compatibility.

Security-test tenant isolation, forged PrincipalContext, forged tenant context, privilege escalation, explicit-deny bypass, policy injection, arbitrary-code attempts, oversized AST, stale cache, delegation escalation and self-privilege escalation.

E2E-test role creation → permission assignment → grant → authorization allow; explicit deny; expiry; policy publication/disable; resource hierarchy; check-many; administrative audit.

Reliability-test NATS outage, duplicate delivery, DB contention, cache outage, worker crash, scheduler duplication and DLQ recovery. Assert no failure mode becomes allow.

Property-test that explicit deny dominates any allow and missing required context cannot yield allow.

Load-test hot authorization paths, cache cold starts, policy publication and concurrent administrative changes at production concurrency with p95/p99 thresholds.