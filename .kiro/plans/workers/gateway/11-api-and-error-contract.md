# API and Error Contract

## Gateway-owned endpoints

`GET /health`, `GET /ready` and controlled diagnostics required by operations. Diagnostics never expose dependency credentials or internal topology.

## Proxy API

All application APIs are routed through Registry-declared paths. The Gateway does not duplicate service controllers. OpenAPI remains owned by each service; Gateway route metadata references those contracts.

## Headers

Standardize request ID, correlation ID, trace context, forwarded protocol/host information and safe response security headers. Trusted internal headers use a reserved namespace and are overwritten at the edge.

## Errors

Gateway-owned envelope fields: `code`, `message`, `requestId`, `correlationId`, optional `details` safe for clients, and optional retry metadata. Do not expose stack traces, provider credentials, origin addresses or internal service names unless the public contract explicitly permits a stable identifier.

## Status mapping

400 malformed request; 401 failed authentication admission; 403 explicit edge policy denial; 404 unknown route; 413 payload too large; 415 unsupported content type; 429 throttled; 502 invalid upstream response/transport; 503 unavailable; 504 timeout. Service status codes remain service-owned when safely proxyable.

## Idempotency

Pass through idempotency keys. The service owns idempotency records and semantics.
