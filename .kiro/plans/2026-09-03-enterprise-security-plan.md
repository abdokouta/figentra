---
authored_by: kiro
authored_at: 2026-09-03
source: prompt://enterprise-day-one-plan-set
reviewed_by: null
reviewed_at: null
---

# Figentra enterprise security architecture — day-one plan

**Status:** Planned  
**Anchor ADRs:** ADR-0001, ADR-0005, ADR-0010, ADR-0021, ADR-0083, ADR-0088, ADR-0090, ADR-0091, ADR-0092  
**Depends on:** all foundation packages and repository security steering  
**Design effort:** 20 days across 10 phases

## Purpose

Define the security baseline applied across identity, authentication, tenancy, storage, transport, secrets, runtime boundaries, logging, supply chain and operations. Security controls are implementation requirements, not future hardening tasks.

## Non-goals

Replacing cloud-provider security controls, implementing business authorization rules inside this plan, or relying on undocumented manual procedures.

## Core architecture

Threat model every trust boundary: browser/RN/desktop → API; service → service; Worker → binding; app → storage; package → provider. Controls include least privilege, explicit capabilities, schema validation, bounded inputs, secure defaults and auditable privileged actions.

## Required controls

- JWT/OIDC verification with pinned issuer/audience/algorithm policy.
- Tenant context established from trusted identity, never client input.
- Secrets from approved secret providers; no `.env` files on disk where steering forbids them.
- Central redaction for logs/errors/traces.
- SSRF protection for arbitrary outbound URLs.
- Path traversal protection for filesystem/object keys.
- Signed URL expiry and scope enforcement.
- Rate limits and body/payload limits on public boundaries.
- TLS and least-privilege service credentials.
- Dependency/license/SBOM and lockfile integrity checks.
- Security tests for every adapter and runtime.

## Security registry / discovery

No ad-hoc security plugin registry. Policies are centrally defined as contracts; runtime adapters register capabilities through the canonical discovery mechanism only when needed.

## Error / observability rules

Security failures use stable error codes and do not disclose whether protected resources exist. Audit events capture actor, tenant, action, resource, decision and correlation ID. Metrics aggregate by policy/outcome, never by secrets or raw identifiers.

## Persistence / tenancy

Encryption at rest is provider responsibility; application encryption uses `@stackra/encryption` where required. Tenant keys/credentials are never shared across contexts without explicit policy. Data deletion and retention are testable and auditable.

## Testing / conformance

Threat-model tests cover auth bypass, tenant breakout, SSRF, path traversal, prototype pollution, oversized payloads, token leakage, replay, open redirects, insecure IPC and dependency drift. Security conformance is a release gate.

## Phases

1. threat model/inventory (2d); 2. identity/auth controls (2d); 3. tenancy/isolation (2d); 4. secrets/crypto (2d); 5. transport/SSRF (2d); 6. storage/media (2d); 7. runtime/desktop/Worker (2d); 8. logging/redaction/audit (2d); 9. supply-chain/conformance (3d); 10. docs/incident runbooks (1d).

## Exit criteria

All trust boundaries have explicit controls and tests; secrets cannot reach logs/artifacts; tenant isolation is verified; security conformance is mandatory for release.

## Cross-references

`2026-09-03-auth-package.md`, `2026-09-03-identity-package.md`, `2026-09-03-errors-package.md`, `2026-09-03-storage-package.md`, `2026-09-03-enterprise-tenancy-plan.md`.
