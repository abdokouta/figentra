# Infrastructure Orchestrator — Credentials and Secrets

Provider credentials are control-plane secrets and never part of public operation payloads, Registry manifests, logs, events or operation records.

## Boundary

Workers receive only the minimum credential reference/binding needed to invoke an approved provider/execution runner. Secret material is retrieved from the platform secret-management boundary, not stored in D1/KV.

## Isolation

Separate credentials per environment/provider/account. Production credentials cannot be used by development/staging workers. Rotation uses overlapping validity where provider semantics allow it, followed by revocation of the old credential.

## Terraform

Sensitive Terraform variables are supplied through protected runner environment/secret channels. State backend credentials are runner-only. Plan/state artifacts are classified sensitive and access controlled; public API returns only safe summaries/digests.

## Logging

Redact authorization headers, access keys, tokens, private keys, Terraform sensitive values and provider response bodies containing secrets. Secret access is auditable without recording secret values.