# ADR-0024 — Final Figentra Domain Boundaries

## Status

Accepted

## Decision

Figentra uses fourteen business services:

1. Identity
2. Tenant
3. IAM
4. Monetization
5. Usage
6. Workflow
7. Notifications
8. Audit
9. Files
10. Integrations
11. Search
12. Reporting
13. Analytics
14. Marketing

The former Scope, Policy, Approval and Entitlements service boundaries are removed.

## Boundary decisions

- **Scope** is not a platform business domain. Tenant provides tenant context; product domains own resource hierarchies; IAM evaluates access against resource/context.
- **Policy** belongs to IAM because policy is an authorization mechanism, not an independent business domain.
- **Approval** belongs to Workflow because approval is a durable human-task/orchestration primitive. IAM decides authorization/eligibility.
- **Entitlements** belong to Monetization because they are the effective commercial capability produced by plans, subscriptions, grants, overrides and limits.
- **Audit** remains a focused service under the governance/security concern. It is not merged into IAM and does not imply a generic Governance service.

## Consequences

The platform has fewer distributed boundaries, fewer synchronous hops, and clearer ownership. Product services remain free to model their own domain hierarchies instead of depending on a generic Scope service.

Cross-service contracts remain in `@stackra/contracts`. No service may import another service's implementation or database model.
