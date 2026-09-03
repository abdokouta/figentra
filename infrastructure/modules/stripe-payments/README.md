# `stripe-payments` — infrastructure module

> **Category:** third-party · **Maturity:** beta · **Version:** 1.0.0

Stripe payment processing integration. Configures the Stripe API key, webhook
secret, and default currency for the deployable to process payments,
subscriptions, and invoices.

## Provides

- `payments.stripe`

## Runtime targets

- **terraform:** terraform.tf
- **docker:** n/a
- **wrangler:** n/a

## Environment variables

| Variable                  | Description                                   | Source                                   |
| ------------------------- | --------------------------------------------- | ---------------------------------------- |
| `STRIPE_SECRET_KEY`       | Stripe secret API key (from Doppler).         | `terraform_output.stripe_secret_key`     |
| `STRIPE_WEBHOOK_SECRET`   | Stripe webhook signing secret (from Doppler). | `terraform_output.stripe_webhook_secret` |
| `STRIPE_DEFAULT_CURRENCY` | Default currency.                             | `module.config.default_currency`         |

## Usage in `cloud.yaml`

```yaml
modules:
  - use: stripe-payments
    version: "^1.0.0"
    config:
      # See the schema section of module.yaml for all available fields.
```

## Cross-references

- [`infrastructure/modules/schema/module.v1.json`](../schema/module.v1.json) —
  module manifest schema.
- [`infrastructure/modules/README.md`](../README.md) — registry catalog.
- [`.kiro/plans/2026-09-03-cloud-yaml-capability-modules.md`](../../../.kiro/plans/2026-09-03-cloud-yaml-capability-modules.md)
  — authorising plan.
