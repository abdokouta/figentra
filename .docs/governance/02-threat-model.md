# Security Threat Model — Initial

## Threats

### Credential theft

Mitigation:

- short-lived tokens
- rotation
- revocation
- secret manager
- no secret logging

### Token replay

Mitigation:

- short expiry
- audience
- jti where required
- replay detection for sensitive operations

### Privilege escalation

Mitigation:

- least privilege
- explicit IAM
- policy tests
- delegation controls
- approval

### Tenant escape

Mitigation:

- server-derived tenant context
- Scope validation
- IAM
- database isolation/RLS
- cross-tenant tests

### Webhook forgery

Mitigation:

- provider signature verification
- timestamp/replay checks where supported
- idempotency

### Service impersonation

Mitigation:

- service principals
- audience-bound tokens
- workload identity
- credential rotation

### Authorization cache staleness

Mitigation:

- short TTL
- invalidation
- policy version
- bypass for critical operations

### Supply chain

Mitigation:

- lockfiles
- dependency scanning
- SBOM
- signed releases where practical
- minimal dependencies
