# Identity Service — Security & Authorization

## Trust boundary
Identity is the authoritative authentication trust boundary. Gateway may prevalidate/admit credentials but cannot establish final authentication. Identity validates provider credentials and creates trusted PrincipalContext. IAM remains the authorization authority.

## Gateway boundary
Gateway owns public edge WAF/CORS/coarse rate controls and transport admission. Identity independently validates forwarded-header trust, credentials, provider semantics, sessions, replay, delegation and assurance. Gateway-only auth/principal/tenant/actor headers are never trusted. Direct/internal ingress receives the same service-side security controls.

## Controls
- Validate JWT issuer, audience, signature, algorithm allow-list, expiry and bounded clock skew.
- Validate provider webhook signatures before business effects.
- Reject forged principal/tenant/actor/assurance headers.
- Store no raw passwords, access tokens or refresh tokens.
- Use secret-manager references for service credentials.
- Encrypt restricted fields according to classification.
- Redact credentials, provider tokens, cookies and security payloads.
- Rate-limit authentication, refresh, linking, webhook and credential-rotation endpoints; Gateway edge limits are additional protection, not the source of these invariants.
- Require elevated assurance for sensitive operations.
- Delegation is explicit, time-bounded and always evaluated by IAM.

## Session security
Refresh-token rotation/replay controls follow canonical semantics. Replay revokes affected session family. Expired/revoked sessions cannot become trusted through cache state.

## Administrative authorization
Administrative endpoints require authenticated PrincipalContext and IAM permission checks. Identity does not define role/permission semantics.

## Threat cases
Provider spoofing, token confusion, replay, account takeover, session fixation, webhook replay, secret leakage, tenant-context confusion, delegation escalation, forged Gateway headers and provider outage are explicit tests. Failure is closed.