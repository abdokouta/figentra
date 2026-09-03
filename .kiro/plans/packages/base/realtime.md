---
status: canonical
component: package
package: "@stackra/realtime"
---
# `@stackra/realtime` — implementation plan

Transport-neutral realtime client/server capability for subscriptions, presence and event delivery. Durable domain events remain in event infrastructure/services.

## API
Connection/session lifecycle, subscribe/unsubscribe, channels, typed messages, auth context, reconnect/backoff and lifecycle disposal. Runtime adapters for browser/native/desktop/node are explicit.

## Security/reliability
Tenant-scoped channel authorization, token rotation, message-size limits, bounded subscriptions, reconnect jitter and duplicate-safe message handling. No secret-bearing payload logging.

## Testing/deployment
Connection loss/reconnect, authorization, ordering guarantees, backpressure, subscription cleanup and runtime conformance. Production transport configuration is explicit and observable.

## Exit criteria
Realtime behavior is consistent across runtimes without coupling core code to a specific WebSocket/provider implementation.
