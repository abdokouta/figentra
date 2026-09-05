# Registry — Resilience and Failure

D1 failure: protected writes fail closed; safe immutable cached reads may be served only when freshness policy permits. KV failure: query D1 and continue; never treat KV as authority. Manifest validation failure: reject atomically. Publication conflict: return stable conflict without mutation. Worker restart: no correctness impact. Duplicate publication: idempotent replay. Partial cache update: rebuild from D1. Binding failure: readiness reflects required binding health.

Retries are bounded with exponential backoff and jitter. Never blindly retry non-idempotent publication. Reconciliation compares D1 publication/projection state and repairs only deterministic derived cache/projection state. A known-good active revision is never replaced by a failed publication.

Recovery includes D1 restore verification, cache purge/rebuild, publication replay, projection consistency checks and post-recovery smoke tests.