# ADR-0021 — Gateway and Registry as Enterprise Control-Plane Kernels

## Status

Accepted.

## Decision

The API Gateway and Application Registry are treated as enterprise control-plane
components from V1.

Gateway responsibilities:

- Identity JWT verification
- perimeter rate limiting
- route discovery
- IAM authorization
- token exchange
- service credential propagation
- upstream timeout/circuit breaking
- correlation/security headers

Registry responsibilities:

- application/version/route metadata
- manifest validation
- signed service registration
- registration permissions
- audit trail
- route audience metadata
- upstream SSRF prevention
- D1 authority + KV cache

Neither component owns business data.

## Consequences

The platform gets a stable security boundary before product applications are
implemented. These components require dedicated integration, load, failure, and
security testing before production activation.
