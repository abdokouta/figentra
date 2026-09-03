# Security Standards

## Authentication

- Use approved identity provider.
- Never implement custom password cryptography.
- Validate issuer, audience, signature and expiry.
- Use short-lived access tokens.
- Never accept client-supplied authorization context as authoritative.

## Authorization

Every protected operation must identify:

- principal
- action
- resource
- context

Default deny.

Least privilege.

## Credentials

- never log secrets
- rotate credentials
- expire credentials
- revoke compromised credentials
- use environment-specific credentials

## Service identity

Every service has an explicit service principal.

## Webhooks

- verify signature
- validate timestamp/replay protection where supported
- idempotency
- reject malformed events
- audit processing failures

## Data

Encrypt in transit and at rest.

Minimize PII.

Separate tenant data logically and use DB-level controls where appropriate.

## Privileged operations

Require stronger authentication/authorization and full audit.

## Break glass

Emergency access must:

- be explicitly authorized
- be time bounded
- be audited
- be reviewed
