# Figentra Platform Specification Set

**Active specification root:** `.kiro/specs/figentra/`

The legacy `.kiro/specs/figentra-platform/` tree is reference-only and is intentionally not extended. `.ref/` is historical/reference input. This tree is the active implementation specification.

## Reading order

1. `README.md` — platform architecture and boundaries.
2. `00-implementation-checklist.md` — cross-component gates.
3. Component specification for the target component.
4. Relevant ADRs/steering rules.
5. `.kiro/specs/messaging-s2s/` for detailed messaging/S2S contracts.

## Components

### Services

- [01-approval](services/01-approval.md)
- [02-audit](services/02-audit.md)
- [03-entitlements](services/03-entitlements.md)
- [04-files](services/04-files.md)
- [05-iam](services/05-iam.md)
- [06-identity](services/06-identity.md)
- [07-integrations](services/07-integrations.md)
- [08-monetization](services/08-monetization.md)
- [09-notifications](services/09-notifications.md)
- [10-policy](services/10-policy.md)
- [11-reporting](services/11-reporting.md)
- [12-scope](services/12-scope.md)
- [13-search](services/13-search.md)
- [14-tenant](services/14-tenant.md)
- [15-usage](services/15-usage.md)
- [16-workflow](services/16-workflow.md)

### Packages

- [01-contracts](packages/01-contracts.md)
- [02-events](packages/02-events.md)
- [03-iam](packages/03-iam.md)
- [04-identity](packages/04-identity.md)
- [05-messaging](packages/05-messaging.md)
- [06-observability](packages/06-observability.md)
- [07-outbox](packages/07-outbox.md)
- [08-oxlint-config](packages/08-oxlint-config.md)
- [09-prettier-config](packages/09-prettier-config.md)
- [10-registry](packages/10-registry.md)
- [11-sdk](packages/11-sdk.md)
- [12-security](packages/12-security.md)
- [13-tsup-config](packages/13-tsup-config.md)
- [14-typescript-config](packages/14-typescript-config.md)

### Workers

- [01-gateway](workers/01-gateway.md)
- [02-infrastructure-orchestrator](workers/02-infrastructure-orchestrator.md)
- [01-registry](workers/01-registry.md)

### Apps

- [01-family](apps/01-family.md)
- [02-landing-page](apps/02-landing-page.md)
- [03-portal](apps/03-portal.md)

### Stackra

- [01-container](stackra/01-container.md)
- [02-http](stackra/02-http.md)
- [03-logger](stackra/03-logger.md)
- [04-state](stackra/04-state.md)
- [05-testing](stackra/05-testing.md)
- [06-tsup-config](stackra/06-tsup-config.md)
- [07-typescript-config](stackra/07-typescript-config.md)
- [08-prettier-config](stackra/08-prettier-config.md)
- [09-oxlint-config](stackra/09-oxlint-config.md)
- [10-query](stackra/10-query.md)
