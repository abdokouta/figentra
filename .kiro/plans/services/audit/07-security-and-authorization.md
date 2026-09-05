# Audit Service — Security & Authorization

Audit is append-only governance evidence. Identity authenticates callers; IAM authorizes query/export/retention/legal-hold operations.

Controls: no update/delete API for records; tenant isolation at repository and application layers; exports require explicit permission; legal holds require privileged authorization and actor attribution; sensitive fields are minimized/redacted; exported data is encrypted and access-controlled; export references expire.

Ingestion accepts only registered event schemas and authenticated service/event envelopes. Producer identity and tenant context are validated. Duplicate event IDs are rejected as duplicates, not appended twice.

Hash-chain verification detects tampering. Any integrity failure triggers an alert and blocks silent continuation of the affected chain.

Threat tests: cross-tenant query/export, forged service event, event replay, payload injection, hash tampering, unauthorized retention change, legal-hold bypass, export data leakage, object-reference guessing and privilege escalation.

Audit must audit its own privileged operations without recursive infinite audit loops; self-audit events are marked with a bounded event class and excluded from re-ingestion recursion.