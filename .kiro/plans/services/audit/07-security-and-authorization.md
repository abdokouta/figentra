# Audit Service — Security & Authorization

Audit is append-only governance evidence. Identity authenticates callers; IAM authorizes query/export/retention/legal-hold operations. Gateway may prevalidate but cannot replace either authority.

## Gateway boundary
Gateway owns public CORS/WAF/coarse edge controls. Audit independently validates producer/service identity, tenant scope, event schema and evidence provenance. No Gateway-only header can establish trusted provenance or authorization. Direct/internal ingress is equally protected.

## Controls
No update/delete API for records; tenant isolation at repository/application layers; exports require explicit permission; legal holds require privileged authorization and actor attribution; sensitive fields are minimized/redacted; exports are encrypted/access-controlled/expiring; ingestion accepts only registered authenticated event envelopes; duplicate IDs are deduplicated.

Hash-chain verification detects tampering. Integrity failure alerts and blocks silent continuation.

## Rate/transport distinction
Gateway limits edge traffic. Audit retains bounded query/export/ingestion controls and integrity safeguards.

## Threat tests
Cross-tenant query/export, forged service/Gateway event, replay, payload injection, hash tampering, unauthorized retention/legal hold, export leakage, object-reference guessing, privilege escalation and direct-ingress bypass.

Audit must audit privileged operations without recursive infinite loops.