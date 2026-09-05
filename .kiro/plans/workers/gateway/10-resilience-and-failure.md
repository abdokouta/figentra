# Resilience and Failure

## Timeouts

Every upstream route has a finite deadline. Gateway deadline is propagated downstream and cannot be extended by the service. No unbounded fetch or stream is permitted.

## Retries

Retry only explicitly retry-safe idempotent operations and only on transient transport failures. Never retry authentication, authorization, validation, business conflicts, non-idempotent writes, or a response after the upstream may have committed an unknown side effect unless an idempotency contract exists.

## Circuit protection

Repeated upstream failures trigger route/upstream circuit protection. Open circuits return a deterministic unavailable response and recover through bounded probes.

## Failures

- Registry unavailable: use valid cached route metadata within its security TTL; otherwise fail protected routing closed.
- Service unavailable: 503.
- Timeout: 504.
- Rate limit: 429.
- Invalid authentication prevalidation: 401.
- Unknown/unauthorized route admission: 404/403 according to route disclosure policy.
- Malformed transport input: 400/413/415.

## Recovery

No business state is stored in Gateway for recovery. Service state remains owned by the service. Operational recovery consists of metadata refresh, binding recovery, configuration rollback and traffic restoration.

## Origin protection

Prevent retry storms, connection floods and cache stampedes. A single failing origin cannot cause uncontrolled Gateway amplification.
