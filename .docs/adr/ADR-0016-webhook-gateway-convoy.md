# ADR-0016 — Use Convoy for Webhook Gateway Infrastructure

**Status:** ACCEPTED

## Decision

Use Convoy as the initial webhook gateway/delivery infrastructure.

Do not implement a complete webhook delivery platform as a Cloudflare Worker.

## Rationale

Webhook infrastructure requires durable state, retries, rate limiting, circuit breaking, delivery tracking, replay and operational tooling.

Convoy is purpose-built for this workload and supports Docker/self-hosted deployment, preserving portability.

## Boundary

```text
Figentra
  owns webhook contracts and business semantics

Convoy
  owns delivery infrastructure
```

## Consequences

Positive:
- avoid rebuilding webhook infrastructure
- portable deployment
- mature delivery mechanics
- separation from business services

Negative:
- additional infrastructure
- operational dependency
- Convoy integration work

Mitigation:
- internal WebhookGateway abstraction
- no direct Convoy database access
- versioned webhook contracts
