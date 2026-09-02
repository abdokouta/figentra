# ADR-0064 — Event Observability

**Status:** Accepted

Publishers, relays and consumers expose structured logs, metrics and traces for
latency, failures, retries, DLQ and lag. Request ID, correlation ID, causation
ID and W3C trace context are propagated where supported. Secrets and sensitive
payloads are redacted.
