# Infrastructure Orchestrator — Security and Authorization

Authentication is prevalidated at the edge and re-established in the control plane. IAM is authoritative for operation permission. Tenant/application/environment target binding is mandatory.

## Permissions

Separate read, plan, apply, promote, rollback, destroy, credential-use, reconcile and administrative permissions. Production destructive actions require explicit privileged authorization and policy checks.

## Controls

Allowlisted provider/resource/action; immutable artifact and plan digests; environment isolation; least-privilege service identity; request signing/context; idempotency; replay protection; rate limiting; concurrency locks; secret redaction; no arbitrary URLs/commands; no credentials in API payloads.

## Threat model

Prevent privilege escalation, cross-environment mutation, cross-tenant access, plan substitution, state disclosure, credential exfiltration, command injection, SSRF, replay, confused-deputy provider access and unauthorized destroy. Fail closed for missing/invalid authorization.