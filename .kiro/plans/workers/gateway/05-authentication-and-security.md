# Authentication and Security

## Authentication

Gateway performs JWT/token prevalidation for protected public routes: issuer, audience, signature, algorithm allow-list, expiration, not-before, clock skew and key rotation. It extracts only the claims needed for routing/context. The owning service performs authoritative token verification and principal resolution.

## Authorization

Gateway may enforce coarse route admission such as public/private and required application capability, but it never replaces IAM. Services call IAM for authoritative resource/action decisions.

## Headers

Apply HSTS where appropriate, content-type protection, frame policy, referrer policy, permissions policy, CSP where applicable, cache controls for private data, and removal of internal forwarding headers. Client-controlled copies of trusted headers are discarded.

## CORS

CORS is route/application policy from trusted configuration. Handle preflight without forwarding when policy permits. Never use wildcard origin with credentials.

## Abuse

Enforce body/header/URL limits, method allow-list, edge rate limits, connection/request deadlines, malformed-request rejection and abuse telemetry. Bot/WAF controls belong to Cloudflare edge configuration and are represented in the Gateway operational contract.

## Secrets

Worker secrets are bindings. No credentials in source, route manifests, logs or client responses.

## Webhooks

Preserve raw body, provider headers and request timestamp. Owning service performs cryptographic business verification and replay protection unless Gateway explicitly owns that provider edge contract.

## Threats

Cover token forgery, algorithm confusion, confused deputy, tenant spoofing, origin disclosure, SSRF, header injection, request smuggling, oversized payloads, cache poisoning, CORS abuse, replay, rate-limit bypass and credential leakage.
