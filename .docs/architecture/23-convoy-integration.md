# 23 — Convoy Integration Architecture

**Status: APPROVED FOUNDATION**

## Purpose

Provide reliable inbound/outbound webhook infrastructure without implementing a custom delivery platform.

## Logical boundary

```text
Figentra Webhook Contract
          ↓
      Adapter/API
          ↓
        Convoy
          ↓
    external endpoint
```

## Inbound

Convoy receives provider webhooks and forwards normalized/validated events into Figentra's event boundary.

Provider-specific verification must happen at the provider boundary.

## Outbound

Services emit versioned events.

Webhook eligibility is determined by Figentra subscription/capability rules.

Convoy handles delivery.

## Security

- endpoint authentication
- signing
- secret rotation
- delivery authorization
- tenant isolation
- replay protection
- idempotency
- no sensitive secrets in payloads

## Reliability

Required:

- retries
- exponential/backoff policy
- rate limiting
- circuit breaking
- dead-letter behavior
- replay
- delivery observability

## Ownership

Figentra:
- event schema
- webhook schema
- tenant
- subscription authorization
- event exposure policy
- API/versioning

Convoy:
- delivery state
- transport
- retries
- endpoint execution
- delivery mechanics

## Provider independence

Convoy is replaceable.

No service imports Convoy-specific domain types into core business logic.

Use an internal `WebhookGateway` contract.
