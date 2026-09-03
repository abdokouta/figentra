---
status: canonical
component: package
package: "@stackra/config"
---
# `@stackra/config` — implementation plan

Typed, layered configuration loading with environment/profile resolution, schema validation, secret references and immutable runtime snapshots.

## Layout/API
`src/schema`, `src/loaders`, `src/sources`, `src/secrets`, `src/validation`, `src/runtime`, `src/index.ts`; expose `ConfigManager`, `ConfigSource`, `SecretReference`, typed `get/require`, validation and lifecycle APIs.

## Rules
Configuration is loaded once per runtime unless an explicit reload contract exists. Secrets are references to a secret manager, never persisted in source/config files. Required production settings fail fast at bootstrap.

## Testing/security
Environment precedence, malformed config, missing secrets, tenant-independent global config, reload semantics and redaction tests. No secret values in logs/errors.

## Exit criteria
Every runtime/service uses one validated configuration boundary with explicit environment contracts and no ad-hoc `process.env` access outside adapters.
