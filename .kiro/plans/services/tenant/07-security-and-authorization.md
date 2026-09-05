# Tenant Service — Security & Authorization

Identity establishes the authenticated principal. Tenant establishes tenant lifecycle/context. IAM decides whether that principal may administer the tenant. Tenant never embeds its own role/permission engine.

Controls: every tenant path/query is scope-checked; client tenant IDs are untrusted; membership changes require elevated IAM permissions; lifecycle transitions require explicit authorization and actor attribution; domain verification challenges are random, short-lived and single-use; settings are allow-listed and schema-validated; secrets are forbidden in normal settings.

Isolation is enforced at application and repository layers. Cross-tenant object access returns not-found/forbidden according to the public contract without leaking existence.

Threat tests cover tenant escape, forged tenant headers, membership escalation, unauthorized suspension/archive, challenge replay, domain takeover, settings injection, oversized settings, race conditions and stale context cache.

Audit: lifecycle, membership, domain verification and privileged settings changes emit durable audit facts. Logs/traces never substitute for audit.