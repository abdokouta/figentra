# ADR-0034 — Monetization Boundary

## Status

Accepted.

## Decision

Figentra initially uses one Monetization bounded context containing plans,
products, subscriptions, billing, invoices, provider adapters, entitlements,
metering and usage. Stripe and Paddle are provider adapters.

Further decomposition is allowed only when scale, ownership or operational
boundaries justify it.

## Consequences

The platform avoids premature fragmentation while keeping provider-specific
logic behind adapters.
