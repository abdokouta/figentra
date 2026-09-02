# 02 — Principal, Service Account and Credential Architecture

**Status: APPROVED DIRECTION; DETAILED SECURITY DESIGN**

## Principal

Principal is the single authorization subject.

We explicitly do not create:

```text
Person → User → Actor → Principal
```

Instead:

```text
Identity → Principal
```

## Principal types

Conceptual types:

```text
human
service
integration
system
agent
```

These are types, not necessarily five separate services.

## Human

```text
Identity
   ↓
Principal(type=human)
```

## Service account

```text
Service Account
   ↓
Principal(type=service)
```

Service accounts can:

- authenticate
- own credentials
- receive IAM assignments
- be scoped
- expire
- be disabled
- be audited

## Integration

External systems may receive integration principals where actions must be attributed and authorized.

## System

Internal automation can use system principals.

## Agent

AI agents use normal principal + IAM controls.

No agent receives implicit authority.

## Credentials

Credentials authenticate principals.

```text
Principal
   ↓
Credential
```

Potential types:

```text
oauth_client
client_secret
api_key
private_key
certificate
workload_identity
```

## Secret handling

- plaintext secrets are never stored in ordinary DB rows
- API secrets are displayed once
- secret hashes are stored where hashing is appropriate
- private keys are encrypted in a secret manager
- rotation is mandatory
- revocation is first class
- expiration is first class
- usage timestamps are recorded

## API keys

Use for:

- developer APIs
- external integrations
- CLI
- controlled automation

Do not use as the default internal service authentication mechanism.

## M2M OAuth

Preferred internal protocol:

**OAuth 2.0 Client Credentials**

```text
Service A
  ↓
Identity Platform
  ↓
short-lived audience-bound token
  ↓
Service B
  ↓
IAM
```

## JWT

Core claims:

```text
iss
sub
aud
iat
exp
jti
azp
```

JWTs should not contain the full permission graph.

## Token exchange

Required for:

- audience-specific tokens
- service chains
- on-behalf-of
- delegated operations
- agent execution

Use standardized OAuth token exchange mechanisms where applicable.

## Impersonation

Preserve:

```text
actual_principal
effective_principal
```

Impersonation must be:

- privileged
- explicit
- time-limited where possible
- fully audited

## Delegation

Delegation is limited authority transferred from one principal to another.

Constraints can include:

- actions
- resources
- scopes
- time
- conditions
- approval

Delegation cannot silently expand privileges.

## Credential lifecycle

```text
ISSUED
  ↓
ACTIVE
  ↓
ROTATED / EXPIRED / REVOKED
```

Rotation should support overlapping validity windows where needed for zero-downtime rollout.

## Service identity

Every platform service receives a Figentra service principal.

Example:

```text
svc_identity
svc_iam
svc_registry
svc_billing
```

Infrastructure workload identity remains separate.

## Conceptual data

```text
principals
service_accounts
credentials
oauth_clients
api_keys
```

Physical schema remains subject to security review.
