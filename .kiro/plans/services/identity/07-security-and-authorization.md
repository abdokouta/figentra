# Identity Service — Security & Authorization

## Trust boundary
Identity is the authentication trust boundary. It validates provider credentials and creates trusted PrincipalContext. IAM remains the authorization authority.

## Controls
- Validate JWT issuer, audience, signature, algorithm allow-list, expiry and bounded clock skew.
- Validate provider webhook signatures before parsing business effects.
- Reject forged principal/tenant/actor/assurance headers.
- Store no raw passwords, access tokens or refresh tokens.
- Use secret-manager references for service credentials.
- Encrypt restricted fields according to platform classification.
- Redact credentials, provider tokens, cookies and security payloads from logs/traces/errors.
- Rate-limit authentication, refresh, linking, webhook and credential-rotation endpoints.
- Require elevated assurance for linking identities, disabling accounts, service credential rotation and delegation.
- Delegation is explicit, time-bounded, purpose-bound and always evaluated by IAM.

## Session security
Refresh-token rotation/replay controls follow the provider's canonical semantics. A replay signal revokes the affected session family according to policy. Logout is idempotent. Expired/revoked sessions cannot become trusted again through cache state.

## Service identities
Each service identity has explicit audience, status and credential lifecycle. Credentials are scoped, rotated, revoked and never treated as human authentication. Compromised credentials can be invalidated independently.

## Administrative authorization
Administrative endpoints require an authenticated PrincipalContext and IAM permission checks such as `identity.sessions.revoke`, `identity.service-identities.manage`, and `identity.delegations.manage`. Identity does not define role or permission semantics.

## Threat cases
Provider spoofing, token algorithm confusion, expired token acceptance, replay, account takeover through identity linking, session fixation, webhook replay, secret leakage, tenant-context confusion, privilege escalation through delegation, and provider outage are explicit test cases. Failure is closed: unverifiable identity never becomes authenticated.