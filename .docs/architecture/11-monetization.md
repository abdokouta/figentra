# 11 — Monetization

**Status: DESIGN PENDING**

## Boundary

Monetization owns commercial state.

Potential components:

```text
Billing Account
Plan
Price
Subscription
Invoice
Payment
Credit
Tax
```

## Providers

Initial adapters:

- Stripe
- Paddle

Provider-specific objects must not leak into the core domain.

## Entitlement separation

```text
Billing
  ↓
Subscription
  ↓
Entitlement
```

IAM answers authorization.

Entitlements answer commercial capability.

## Usage

Usage/metering should be separated from payment provider implementation.

Potential path:

```text
Usage Event
 ↓
Meter
 ↓
Aggregation
 ↓
Quota
 ↓
Billing
```

Start with PostgreSQL where volume permits. Introduce Timescale/analytics stores
only when justified.

## Billing hierarchy

Relationships such as:

```text
Figentra
 ↓
Academorix
 ↓
Barclona
 ↓
Parent
```

require a dedicated domain decision.
