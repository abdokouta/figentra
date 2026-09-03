# ADR-0035 — Notification Service

## Status

Accepted.

## Decision

Notifications are owned by a dedicated service covering email, SMS, push, in-app
and webhook delivery. Email templates use React Email. Templates are versioned
and localized. Delivery is asynchronous and retryable.

Notification preference/suppression decisions are centralized, while provider
credentials remain infrastructure secrets.

## Consequences

Business services publish notification intents instead of embedding provider SDK
logic.
