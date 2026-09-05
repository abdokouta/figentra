# Registry — Security and Authorization

Authentication is prevalidated at the edge using configured issuer/audience/signature/expiry rules. Publication authorization is authoritative through trusted service/application identity and IAM permission; edge validation is never the sole authorization decision.

## Controls

Strict input schemas; body/header/path limits; tenant/application binding; least privilege; immutable version ownership; secret detection/rejection; code/SQL rejection; URL allowlists; no arbitrary outbound requests; no dynamic execution; cache poisoning protection; replay/idempotency protection; CORS restricted by environment; security headers; audit hooks for all writes.

## Sensitive data

No tokens, passwords, private keys, provider credentials or credential-bearing URLs are persisted. Logs redact authorization headers, cookies, manifest secrets and sensitive claims.

## Threat cases

Cross-tenant publication, application impersonation, version overwrite, manifest injection, XSS via branding metadata, SSRF, cache poisoning, replay, oversized payload, route takeover and privilege escalation are explicit negative tests. Fail closed for protected writes.