# ADR-0033 — Feature Flags and Integrations

## Status
Accepted.

## Decision
Feature flags are not the source of truth for whether a tenant owns or has
activated an integration. Integration availability is modeled by an
Integration Registry plus tenant installation/configuration and entitlements.

Feature flags control rollout/availability; entitlements control commercial
access; tenant installation controls activation/configuration.

## Consequences
Commercial entitlement, tenant configuration and deployment rollout remain
separate concerns.
