---
status: canonical
document: service-data-lifecycle
service: identity
version: v1
---
# Identity Service — Data Lifecycle Contract

## 1. Scope
This document defines creation, mutation, retention, archival, deletion, reconciliation, export and recovery for Identity-owned data. Audit evidence is owned by Audit and follows its independent retention/legal-hold rules.

## 2. Principal lifecycle
`pending -> active -> disabled -> archived`. Principal identifiers are immutable. Disable immediately prevents new authenticated use subject to token-verification architecture and triggers session-family revocation. Archive removes the principal from active operation but preserves the minimum referential tombstone required for historical event/audit attribution.

Hard deletion is allowed only through approved privacy/tenant-erasure workflow after all legal-hold, contractual and integrity checks. Cross-service deletion is coordinated by workflow/events; Identity never directly deletes another service's rows.

## 3. External identity lifecycle
Identity bindings are created only after provider subject verification. `(provider, externalSubject)` is globally unique within the provider namespace. Link/unlink operations are versioned and audited. A last usable sign-in method cannot be removed when doing so would violate account-recovery policy. Unlinked bindings retain a bounded tombstone/fingerprint where required to prevent accidental subject reattachment/replay; sensitive provider metadata is minimized.

## 4. Session lifecycle
`created -> active -> expired|revoked`. Raw provider refresh tokens are never stored. Session records are retained for the configured security investigation window, then purged or reduced to security-safe historical facts. Revocation timestamps/reasons and family lineage are retained long enough to enforce replay protection and incident investigation. Expired session cleanup is bounded, resumable and idempotent.

## 5. Credential references
CredentialRef rows contain only secret-manager references and metadata. Rotation creates a new active version before revoking the old version according to overlap policy. Deleted service identities remove/revoke secret material in the secret manager and retain non-secret lifecycle metadata for auditability.

## 6. Delegation lifecycle
Delegations are immutable grants with explicit start/expiry/revocation. Expired/revoked delegations cannot be reactivated. Delegation records are retained according to security/audit policy and may be archived but not silently mutated.

## 7. Provider reconciliation
Periodic reconciliation compares internal Identity bindings/state with Supabase provider state using resumable cursors and deterministic conflict rules. Provider deletion/disable, email verification, MFA state and session-affecting changes are normalized into explicit application commands/events. Reconciliation never overwrites canonical Figentra state without a defined rule and audit record.

## 8. Tenant/user erasure
Erasure workflow classifies data into: delete, anonymize, retain-under-legal-basis, or external-provider erase. The operation is idempotent, produces a completion report, verifies provider-side deletion where applicable, emits lifecycle events, invalidates caches, and preserves Audit-owned evidence according to Audit policy.

## 9. Backup and restore
PostgreSQL backup/restore follows platform RPO/RTO. Restore verification includes identity uniqueness, session/revocation state, outbox continuity and provider reconciliation before traffic promotion. Secret values are restored from the secret-management system, not database backup.

## 10. Data classification
Credentials/secrets: restricted. Provider subjects and authentication identifiers: confidential. Session/security metadata: confidential. Public display name: internal/public only according to consuming product. Classification controls logs, exports, metrics, registry projection and support access.

## 11. Tests
Lifecycle tests cover every state transition, concurrent disable/revoke, unlink edge cases, expiry, purge eligibility, legal hold interaction, provider deletion mismatch, idempotent erasure, backup restore plus reconciliation, and prevention of resurrecting revoked/deleted security state.